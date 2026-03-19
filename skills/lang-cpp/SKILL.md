---
name: lang-cpp
description: C++ development standards — style, memory safety, concurrency, tooling, and testing. Load when working on C++ projects.
---

# C++ Standards

## Code Style

Follow [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html).

**Standard**: C++20 or newer.

**Tooling (mandatory)**:
- `-Wall -Wextra -Werror` — treat warnings as errors
- `clang-tidy` — static analysis and modernization
- `clang-format` — formatting
- `cppcheck` — additional static analysis (optional but recommended)

---

## Memory Safety and RAII

- **RAII everywhere** — acquire resources in constructors, release in destructors
- Use smart pointers; no raw `new`/`delete`
- Prefer `std::unique_ptr` for exclusive ownership, `std::shared_ptr` only when truly shared
- Use `std::make_unique` and `std::make_shared`
- Avoid unnecessary copies; use move semantics

```cpp
// Good: RAII with smart pointers
auto user = std::make_unique<User>(name, email);

// Bad: raw new/delete
User* user = new User(name, email);
// ... easy to forget delete
delete user;
```

---

## Error Handling

- Prefer `std::expected` (C++23) or `Result<T, E>` pattern over exceptions for recoverable errors
- Use exceptions for truly exceptional, unrecoverable situations
- Never throw in destructors
- Check return values; avoid silent failures
- Include context in error messages

```cpp
// C++23 std::expected
auto fetchUser(std::string_view id) -> std::expected<User, AppError> {
    if (id.empty()) {
        return std::unexpected(AppError::InvalidInput("user id is empty"));
    }
    // ...
}

// Or with exceptions for unrecoverable errors
if (!config.isValid()) {
    throw std::runtime_error(
        std::format("Invalid config: missing field '{}'", field));
}
```

---

## Concurrency

- Use `std::thread`, `std::jthread` (C++20), and `std::async`
- Protect shared state with `std::mutex` and `std::lock_guard`/`std::scoped_lock`
- Prefer `std::atomic` for simple shared counters/flags
- Avoid data races — use ThreadSanitizer (`-fsanitize=thread`) in CI

```cpp
std::mutex mtx;
std::scoped_lock lock(mtx);
// ... safe access
```

---

## Modern C++ Idioms

- Use `auto` for type deduction when the type is obvious from context
- Prefer `std::string_view` over `const std::string&` for read-only string parameters
- Use structured bindings: `auto [key, value] = *map.begin();`
- Use `constexpr` for compile-time computation
- Prefer `std::optional` for values that may or may not exist
- Use `std::variant` for type-safe unions
- Range-based for loops with `const auto&`

```cpp
// Structured bindings
for (const auto& [name, score] : scores) {
    fmt::print("{}: {}\n", name, score);
}

// Optional
auto findUser(int id) -> std::optional<User>;
```

---

## Naming Conventions

```cpp
// Classes/Structs: PascalCase
class UserService {};

// Functions/Methods: PascalCase (Google) or camelCase
void ProcessRequest();

// Variables: snake_case
int request_count = 0;

// Constants: kPascalCase
constexpr int kMaxRetries = 3;

// Macros (avoid): ALL_CAPS
#define MAX_BUFFER_SIZE 1024
```

---

## Testing

**Framework**: GoogleTest or Catch2.

- Use dependency injection for testability
- Use sanitizers in debug builds: ASan (`-fsanitize=address`), UBSan (`-fsanitize=undefined`), TSan (`-fsanitize=thread`)
- Test error paths and edge cases
- Use `EXPECT_*` (non-fatal) over `ASSERT_*` (fatal) when possible

```cpp
TEST(CalculatorTest, AddReturnsSum) {
    Calculator calc;
    EXPECT_EQ(calc.Add(2, 3), 5);
    EXPECT_EQ(calc.Add(-1, 1), 0);
    EXPECT_EQ(calc.Add(0, 0), 0);
}

// Parameterized tests
class AddTest : public ::testing::TestWithParam<std::tuple<int, int, int>> {};

TEST_P(AddTest, ReturnsCorrectSum) {
    auto [a, b, expected] = GetParam();
    EXPECT_EQ(Calculator{}.Add(a, b), expected);
}

INSTANTIATE_TEST_SUITE_P(AddCases, AddTest, ::testing::Values(
    std::make_tuple(2, 3, 5),
    std::make_tuple(-1, 1, 0),
    std::make_tuple(0, 0, 0)
));
```

---

## Build System

- Prefer CMake (3.20+) as build system
- Use `target_*` commands, avoid global `include_directories`/`link_libraries`
- Set C++ standard per target: `target_compile_features(mylib PUBLIC cxx_std_20)`
- Enable sanitizers in debug: `-fsanitize=address,undefined`
- Use `FetchContent` or Conan/vcpkg for dependency management

```cmake
cmake_minimum_required(VERSION 3.20)
project(myapp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(myapp src/main.cpp)
target_compile_options(myapp PRIVATE -Wall -Wextra -Werror)
```

---

## Observability

- Use structured logging (spdlog or fmt-based)
- Include correlation IDs in log messages
- Log levels: info, warn, error
- Never log secrets; redact sensitive data

---

## Security

- Never print secrets; redact by default
- Load secrets from environment or secret manager
- Validate all inputs; check buffer bounds
- Avoid unsafe C APIs; use size-aware variants (`strncpy` over `strcpy`, prefer `std::string`)
- Use AddressSanitizer in CI to catch memory issues

---

## Project Scaffolding

For new projects, scaffold from: [templ-project/cpp](https://github.com/templ-project/cpp)

```bash
uvx --from git+https://github.com/templ-project/cpp.git bootstrap ./my-project
cd my-project && task deps:sync && task validate
```

Use [Taskfile](https://github.com/go-task/task) for automation: `task build`, `task test`, `task lint`, `task format`, `task validate`.

---

## Deliverables

- `README.md` with build/test instructions
- `CMakeLists.txt` with proper target configuration
- Dependency manifest (Conan/vcpkg or FetchContent)
- Lint/format configs (`.clang-format`, `.clang-tidy`)
- Unit tests with sanitizers enabled
- `Taskfile.yml` for automation
