from logging import getLogger

from flask import Blueprint, request
from sqlalchemy import inspect, text
from sqlalchemy.exc import DataError

from pkuphysu_website import db
from pkuphysu_website.auth.utils import master_before_request
from pkuphysu_website.utils import respond_error, respond_success

bp = Blueprint("dba", __name__)
bp.before_request(master_before_request)

logger = getLogger(__name__)


@bp.route("/db-tables/create-all", methods=["POST"])
def create_all():
    db.create_all()
    logger.info("Tables created")
    return respond_success()


@bp.route("/db-tables", methods=["GET"])
def index():
    inspector = inspect(db.engine)
    tables_info = {}
    for table_name, table in db.Model.metadata.tables.items():
        table_exists = inspector.has_table(table_name)
        table_rows = 0
        if table_exists:
            table_rows = db.session.query(table).count()
        tables_info[table_name] = {"exists": table_exists, "rows": table_rows}
    return respond_success(tables=tables_info)


@bp.route("/db-tables/<table_name>", methods=["GET", "DELETE", "PUT", "PATCH"])
def manage_table(table_name):
    table = db.Model.metadata.tables.get(table_name)

    columns = {col.name: col for col in table.columns}
    columns_list = [col.name for col in table.columns]
    columns_type = [
        f'{str(col.type)} {"NOT NULL " if not col.nullable else ""}{"PRIMARY KEY " if col.primary_key else ""}'
        for col in table.columns
    ]
    primary_keys = [col for col in table.columns if col.primary_key]
    if not primary_keys:
        return respond_error(500, "TableHasNoPrimaryKey")

    pk_names = {pk.name for pk in primary_keys}

    if request.method == "GET":
        try:
            rows = db.session.query(table).all()
            data = [{col: getattr(row, col) for col in columns} for row in rows]
            return respond_success(
                count=len(data), data=data, columns=columns_list, types=columns_type
            )
        except Exception as e:
            logger.error("Query failed: %s", str(e))
            return respond_error(500, "DBAQueryFailed")

    elif request.method == "DELETE":
        # 删除特定记录（通过 body 指定要删的行）
        payload = request.get_json(force=True)
        records = payload.get("data")

        if records == "all":
            # 清空整个表
            result = db.session.execute(
                text(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY CASCADE;')
            )
            db.session.commit()
            logger.info("Cleared all rows from %s", table_name)
            return respond_success(deleted=table_name)

        if not isinstance(records, list) or len(records) == 0:
            return respond_error(400, "DBADeleteNoData")

        deleted_count = 0
        for record in records:
            if not isinstance(record, dict):
                continue
            # 提取主键条件
            conditions = []
            for pk in primary_keys:
                val = record.get(pk.name)
                if val is None:
                    return respond_error(400, f"MissingPrimaryKeyValue: {pk.name}")
                conditions.append(getattr(table.c, pk.name) == val)

            result = db.session.execute(db.delete(table).where(*conditions))
            deleted_count += result.rowcount

        db.session.commit()
        logger.info("Deleted %d rows from %s", deleted_count, table_name)
        return respond_success(deleted=deleted_count)

    elif request.method in ["PUT", "PATCH"]:
        payload = request.get_json(force=True)
        records = payload.get("data")
        if not isinstance(records, list):
            return respond_error(400, "DBADataMalformed")
        if len(records) == 0:
            return respond_success()

        inserted_count = 0
        updated_count = 0

        for record in records:
            if not isinstance(record, dict):
                return respond_error(400, "InvalidRecordNotDict")
            record = {k: v for k, v in record.items() if k in columns_list}
            if not record:
                return respond_error(400, "InvalidColumnInData")
            filters = []
            pk_values = {}
            for pk_name in pk_names:
                val = record.get(pk_name)
                if val is None:
                    return respond_error(400, f"PrimaryKeyCannotBeNull: {pk_name}")
                filters.append(getattr(table.c, pk_name) == val)
                pk_values[pk_name] = val

            # 查询是否存在
            existing = db.session.execute(db.select(table).where(*filters)).first()

            try:
                if existing:
                    # UPDATE
                    result = db.session.execute(
                        db.update(table).where(*filters),
                        [{k: v for k, v in record.items() if k in columns}],
                    )
                    updated_count += result.rowcount
                else:
                    # INSERT
                    result = db.session.execute(
                        db.insert(table),
                        [{k: v for k, v in record.items() if k in columns}],
                    )
                    inserted_count += result.rowcount
            except DataError as e:
                logger.error("Data error on record %r: %s", record, str(e))
                db.session.rollback()
                return respond_error(500, "DBADataValidationError", str(e))

        try:
            db.session.commit()
            return respond_success(inserted=inserted_count, updated=updated_count)
        except Exception as e:
            db.session.rollback()
            logger.error("Commit failed: %s", str(e))
            return respond_error(500, "DBACommitFailed", str(e))


@bp.route("/db-tables/migrate", methods=["GET", "POST"])
def migrate():
    from alembic.runtime.migration import MigrationContext

    # use `db.session.connection()` instead of `db.engine.connect()`
    # to avoid lock hang
    context = MigrationContext.configure(
        db.session.connection(),
        opts={
            "compare_type": True,
        },
    )

    if request.method == "GET":
        import pprint

        from alembic.autogenerate import compare_metadata

        diff = compare_metadata(context, db.metadata)
        diff_str = pprint.pformat(diff, indent=2, width=20)
        logger.info("Migrate steps: %s", diff_str)
        return respond_success(migration=diff_str)

    from alembic.autogenerate import produce_migrations
    from alembic.operations import Operations
    from alembic.operations.ops import OpContainer

    migration = produce_migrations(context, db.metadata)
    operation = Operations(context)
    for outer_op in migration.upgrade_ops.ops:
        logger.info("Invoking %s", outer_op)
        if isinstance(outer_op, OpContainer):
            for inner_op in outer_op.ops:
                logger.info("Invoking %s", inner_op)
                operation.invoke(inner_op)
        else:
            operation.invoke(outer_op)
    db.session.commit()
    db.session.close()
    return respond_success()
