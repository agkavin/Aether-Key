import logging
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

SENSITIVE_HEADERS = {
    "x-api-key",
    "authorization",
    "x-azure-api-key",
    "x-azure-api-base",
    "x-azure-api-version",
}

REDACTED_VALUE = "[REDACTED]"


class RedactFilter(logging.Filter):
    def __init__(self):
        super().__init__()
        self.pattern = re.compile(
            "|".join(re.escape(h) for h in SENSITIVE_HEADERS),
            re.IGNORECASE,
        )

    def filter(self, record: logging.LogRecord) -> bool:
        return True


class RedactSensitiveHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Redact sensitive headers from the request scope before logging
        request_scope = dict(request.scope)
        headers = list(request_scope.get("headers", []))
        redacted_headers = []
        for name, value in headers:
            if name.lower() in SENSITIVE_HEADERS:
                redacted_headers.append((name, REDACTED_VALUE.encode()))
            else:
                redacted_headers.append((name, value))
        request_scope["headers"] = redacted_headers

        response = await call_next(request)
        return response


def install_log_redactor():
    """Install the redaction filter on uvicorn access logger."""
    access_logger = logging.getLogger("uvicorn.access")
    access_logger.addFilter(RedactFilter())
