"""
Centralized Logging System
Provides structured logging for application monitoring
"""
import logging
import os
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from pathlib import Path

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Log format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Log levels
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = logging.DEBUG if ENVIRONMENT == "development" else logging.INFO

def setup_logger(name: str, log_file: str = None, level: int = LOG_LEVEL) -> logging.Logger:
    """
    Create configured logger instance
    
    Args:
        name: Logger name (usually __name__)
        log_file: Optional specific log file
        level: Logging level
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Create formatter
    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    
    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (rotating)
    if log_file:
        file_path = LOGS_DIR / log_file
    else:
        file_path = LOGS_DIR / f"{name}.log"
    
    # Rotating file handler (10MB per file, keep 5 backups)
    file_handler = RotatingFileHandler(
        file_path,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger

# Application logger
app_logger = setup_logger("app", "app.log")

# Flight scraper logger
scraper_logger = setup_logger("scraper", "scraper.log")

# Document parser logger
parser_logger = setup_logger("parser", "parser.log")

# Security logger (for auth failures, rate limits, etc.)
security_logger = setup_logger("security", "security.log", level=logging.WARNING)

# Error logger (for critical errors)
error_logger = setup_logger("errors", "errors.log", level=logging.ERROR)

def log_api_request(endpoint: str, method: str, ip: str, status_code: int, duration_ms: float):
    """Log API request with metrics"""
    app_logger.info(
        f"API Request: {method} {endpoint} | IP: {ip} | Status: {status_code} | Duration: {duration_ms:.2f}ms"
    )

def log_security_event(event_type: str, ip: str, details: str):
    """Log security-related events"""
    security_logger.warning(
        f"Security Event: {event_type} | IP: {ip} | Details: {details}"
    )

def log_scraper_attempt(origin: str, destination: str, provider: str, success: bool):
    """Log flight scraping attempts"""
    level = logging.INFO if success else logging.WARNING
    scraper_logger.log(
        level,
        f"Scraper: {origin}->{destination} | Provider: {provider} | Success: {success}"
    )

def log_file_processing(filename: str, file_type: str, records_count: int, errors_count: int):
    """Log document processing results"""
    parser_logger.info(
        f"File Processing: {filename} | Type: {file_type} | Records: {records_count} | Errors: {errors_count}"
    )

def log_critical_error(error_type: str, error_message: str, stack_trace: str = None):
    """Log critical application errors"""
    error_logger.error(
        f"Critical Error: {error_type} | Message: {error_message}"
    )
    if stack_trace:
        error_logger.error(f"Stack Trace:\n{stack_trace}")

# Export loggers
__all__ = [
    'setup_logger',
    'app_logger',
    'scraper_logger',
    'parser_logger',
    'security_logger',
    'error_logger',
    'log_api_request',
    'log_security_event',
    'log_scraper_attempt',
    'log_file_processing',
    'log_critical_error'
]
