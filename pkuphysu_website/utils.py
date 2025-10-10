from flask import Response, jsonify


def respond_error(status_code: int, errid: str, message: str = None) -> Response:
    """Return an error json response

    :param status_code: Status code
    :type status_code: int
    :param errid: The id of error. Used by frontend.
        Should be action + short reason. e.g. AuthBadCode
    :type errid: str
    :param message: Error message, defaults to None
    :type message: str, optional
    :return: jsonified response
    :rtype: Response
    """
    response = jsonify(
        {
            "status": status_code,
            "errid": errid,
            "message": message,
        }
    )
    response.status_code = status_code
    return response


def respond_success(**kwargs) -> Response:
    """Receive kwargs and return jsonified response with status=200 added

    :return: jsonified response
    :rtype: Response
    """
    return jsonify(status=200, **kwargs)

