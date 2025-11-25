import os

from dynaconf import Dynaconf

__all__ = ["settings"]

settings = Dynaconf(
    environments=True,
    envvar_prefix="DYNACONF",
    settings_files=[
        os.path.join(os.path.dirname(__file__), filename)
        for filename in ("settings.toml", ".secrets.toml")
    ],
    load_dotenv=True,
)
