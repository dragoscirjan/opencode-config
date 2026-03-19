---
name: lang-python
description: Python development standards — style, typing, tooling, testing, and packaging. Load when working on Python projects.
---

# Python Standards

## Code Style

Follow [PEP 8](https://peps.python.org/pep-0008/).

**Runtime**: Python 3.11+.

**Tooling (mandatory)**:
- `black` — formatting (or `ruff format`)
- `ruff` — fast linting (replaces flake8, isort, pyflakes, etc.)
- `mypy` — type checking (recommended for libraries, mandatory for new projects)

---

## Type Hints

Use type hints throughout. `mypy` strict mode recommended for libraries.

```python
from collections.abc import Sequence

def calculate_total(items: Sequence[Item]) -> float:
    """Calculate the total price of all items."""
    return sum(item.price for item in items)

# Use | union syntax (3.10+)
def find_user(user_id: str) -> User | None:
    ...

# Use generics
from typing import TypeVar
T = TypeVar("T")

def first(items: Sequence[T]) -> T | None:
    return items[0] if items else None
```

- Prefer `collections.abc` types over `typing` equivalents (`Sequence`, `Mapping`, `Iterable`)
- Use `TypeAlias` or `type` (3.12+) for complex type definitions
- Use `Protocol` for structural subtyping (duck typing with type safety)

---

## Error Handling

```python
# Good: explicit error with context
raise UserNotFoundError(f"User {user_id} not found in database", user_id=user_id)

# Bad: bare except or silent failure
try:
    ...
except:  # Never do this
    pass
```

- Use custom exception classes with error codes
- Never use bare `except:` — always specify the exception type
- Include context in error messages
- Fail fast and loud; avoid silent failures
- Use `raise ... from err` to preserve exception chains

```python
class AppError(Exception):
    def __init__(self, code: str, message: str, **context: object) -> None:
        super().__init__(message)
        self.code = code
        self.context = context
```

---

## Testing

**Framework**: `pytest` with fixtures.

- Write tests for all public APIs
- Use parametrize for multiple scenarios
- Use fixtures for setup/teardown
- Test error paths, not just happy paths
- Use `pytest-cov` for coverage

```python
import pytest

@pytest.mark.parametrize("items,expected", [
    ([], 0),
    ([Item(price=10)], 10),
    ([Item(price=10), Item(price=20)], 30),
])
def test_calculate_total(items: list[Item], expected: float) -> None:
    assert calculate_total(items) == expected

# Fixtures
@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    session = create_session()
    yield session
    session.rollback()
    session.close()
```

---

## Project Structure

Use `src/` layout (PEP 621):

```
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── core.py
│       └── utils.py
├── tests/
│   ├── conftest.py
│   ├── test_core.py
│   └── test_utils.py
├── pyproject.toml
├── Taskfile.yml
└── README.md
```

---

## Packaging

Use `pyproject.toml` (PEP 621) as the single source of project metadata:

```toml
[project]
name = "mypackage"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["httpx>=0.27"]

[project.optional-dependencies]
dev = ["pytest", "pytest-cov", "mypy", "ruff", "black"]

[tool.ruff]
target-version = "py311"
line-length = 120

[tool.mypy]
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- Use `uv` or `pip` for dependency management
- Pin dependencies in lock files for reproducible builds
- Use virtual environments (`uv venv`, `python -m venv`)

---

## Common Patterns

```python
# Dataclasses for value objects
from dataclasses import dataclass

@dataclass(frozen=True)
class User:
    id: str
    name: str
    email: str

# Context managers for resource management
from contextlib import contextmanager

@contextmanager
def managed_connection(url: str):
    conn = connect(url)
    try:
        yield conn
    finally:
        conn.close()

# Enum for constrained values
from enum import StrEnum

class Status(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
```

---

## Async

- Use `asyncio` for I/O-bound concurrency
- Use `async`/`await` syntax consistently
- Prefer `asyncio.TaskGroup` (3.11+) over `gather` for structured concurrency
- Use `httpx` (async) over `requests` for new async code

```python
async with asyncio.TaskGroup() as tg:
    task1 = tg.create_task(fetch_user(user_id))
    task2 = tg.create_task(fetch_orders(user_id))
# Both complete or both cancel
```

---

## Observability

- Use `logging` module with structured output (JSON preferred)
- Include correlation IDs
- Log levels: info, warning, error
- Never log secrets; redact sensitive data

```python
import logging
logger = logging.getLogger(__name__)

logger.info("User fetched", extra={"user_id": user_id, "request_id": request_id})
```

---

## Security

- Never print secrets; redact by default
- Load secrets from environment or secret manager
- Never commit secrets to VCS
- Validate and sanitize all inputs
- Use parameterized queries for databases

---

## Project Scaffolding

Use [Taskfile](https://github.com/go-task/task) for automation: `task test`, `task lint`, `task format`, `task validate`.

Standard task commands:
```bash
task test              # pytest
task lint              # ruff check + mypy
task format            # black or ruff format
task validate          # full CI pipeline locally
```

---

## Deliverables

- `README.md` with install/run/test instructions
- `pyproject.toml` with all metadata and tool configs
- `src/` layout
- Unit tests with pytest
- Type hints throughout
- `Taskfile.yml` for automation
