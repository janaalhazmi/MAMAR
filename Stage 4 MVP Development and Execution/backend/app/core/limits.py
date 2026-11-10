import threading
import time

# Sign-in limit: after MAX_FAILED wrong passwords for one email in WINDOW_SECONDS, that email
# must wait, so a password cannot be guessed by trying many. A right password clears the count.
MAX_FAILED = 10
WINDOW_SECONDS = 15 * 60

# The biggest request body: 10 photos of 5 MB, plus the form fields.
MAX_BODY_BYTES = 55 * 1024 * 1024

_failed: dict[str, list[float]] = {}
_lock = threading.Lock()


def _recent(email: str, now: float) -> list[float]:
    times = [moment for moment in _failed.get(email, []) if now - moment < WINDOW_SECONDS]
    if times:
        _failed[email] = times
    else:
        _failed.pop(email, None)
    return times


def login_blocked(email: str) -> bool:
    with _lock:
        return len(_recent(email, time.time())) >= MAX_FAILED


def record_failed_login(email: str) -> None:
    with _lock:
        now = time.time()
        _failed[email] = [*_recent(email, now), now]


def clear_failed_logins(email: str) -> None:
    with _lock:
        _failed.pop(email, None)
