class DomainError(Exception):
    """Exceção base de regras de negócio."""

    status_code = 400

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        if status_code is not None:
            self.status_code = status_code
        self.message = message


class ValidationError(DomainError):
    status_code = 400


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class ExternalApiError(DomainError):
    status_code = 502
