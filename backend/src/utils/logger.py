"""Structured JSON logging utility for AWS Lambda and local debugging."""
import json
import logging
import os
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Custom formatter emitting structured JSON for AWS CloudWatch Insights."""

    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "service": os.getenv("POWERTOOLS_SERVICE_NAME", "aerodispatch-orders"),
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_record.update(record.extra)
        return json.dumps(log_record)


def get_logger(name: str = "aerodispatch") -> logging.Logger:
    """Returns a configured logger with JSON formatting."""
    logger = logging.getLogger(name)
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, log_level, logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.propagate = False

    return logger
