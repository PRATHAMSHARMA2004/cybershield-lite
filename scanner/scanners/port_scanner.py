import socket
from urllib.parse import urlparse
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

# Common ports to check
PORTS_TO_SCAN = [21, 22, 23, 25, 80, 443, 3306, 5432, 6379, 8080, 8443, 27017]


def check_port(hostname: str, port: int, timeout: float = 2.0) -> int | None:
    """Return port number if open, None if closed."""
    try:
        with socket.create_connection((hostname, port), timeout=timeout):
            return port
    except (socket.timeout, ConnectionRefusedError, OSError):
        return None


def scan_ports(url: str) -> list[int]:
    """Scan common ports and return list of open ones."""
    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        return []

    open_ports = []

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(check_port, hostname, port): port
            for port in PORTS_TO_SCAN
        }
        for future in as_completed(futures):
            result = future.result()
            if result is not None:
                open_ports.append(result)

    return sorted(open_ports)
