class AppError(Exception):
    status_code = 500
    code = "application_error"

    def __init__(self, detail: str, *, status_code: int | None = None, code: str | None = None) -> None:
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        super().__init__(detail)


class ValidationAppError(AppError):
    status_code = 422
    code = "validation_error"
