---
name: lang-java
description: Java development standards — style, error handling, testing, concurrency, and project structure. Load when working on Java projects.
---

# Java Standards

## Code Style

Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html).

**Tooling (mandatory)**:
- `google-java-format` — formatting
- `Checkstyle` — style enforcement
- `SpotBugs` or `Error Prone` — static analysis
- `PMD` — code quality rules
- Build: Gradle (preferred) or Maven — always reproducible builds

**Naming**:
- `camelCase` for methods, fields, local variables
- `PascalCase` for classes, interfaces, enums, records
- `SCREAMING_SNAKE_CASE` for constants (`static final`)
- Packages: `com.company.project.module` (all lowercase)

---

## Modern Java Features

Use modern Java features (17+) where applicable:

```java
// Records for immutable data carriers
public record User(String id, String name, String email) {}

// Sealed classes for restricted hierarchies
public sealed interface Shape permits Circle, Rectangle, Triangle {}
public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
public record Triangle(double base, double height) implements Shape {}

// Pattern matching
if (shape instanceof Circle c) {
    return Math.PI * c.radius() * c.radius();
}

// Switch expressions
String label = switch (status) {
    case ACTIVE -> "Active";
    case INACTIVE -> "Inactive";
    case PENDING -> "Pending";
};

// Text blocks
String json = """
    {
        "name": "%s",
        "age": %d
    }
    """.formatted(name, age);
```

- Use `record` for immutable value types (DTOs, events, configs)
- Use `sealed` classes/interfaces for closed type hierarchies
- Use `var` for local variables when the type is obvious from context
- Use `Optional<T>` for return values that may be absent — never return `null`
- Use `Stream` API for collection processing

---

## Error Handling

```java
// Good: specific exception with context
public User findUser(String id) throws UserNotFoundException {
    return repository.findById(id)
        .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
}

// Good: custom exception hierarchy
public class AppException extends RuntimeException {
    private final ErrorCode code;

    public AppException(ErrorCode code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }
}
```

- Throw specific exceptions, not generic `Exception` or `RuntimeException`
- Include context in exception messages (IDs, operation, parameters)
- Use checked exceptions for recoverable errors, unchecked for programming bugs
- Never catch `Exception` or `Throwable` broadly (except at application boundaries)
- Use try-with-resources for all `AutoCloseable` resources
- Never swallow exceptions silently — log or rethrow with context

---

## Dependency Injection

Prefer constructor injection — it's the cleanest and most testable approach.

```java
@Service
public class UserService {
    private final UserRepository repository;
    private final EventPublisher publisher;

    // Constructor injection — Spring auto-wires this
    public UserService(UserRepository repository, EventPublisher publisher) {
        this.repository = repository;
        this.publisher = publisher;
    }
}
```

- **Constructor injection** over field or setter injection
- Make dependencies `final`
- Program to interfaces, not implementations
- Keep constructors simple — no business logic
- Use Spring Framework when applicable (or Dagger/Guice for non-Spring projects)

---

## Concurrency

Use `java.util.concurrent` — avoid manual thread management.

```java
// Good: ExecutorService for managed concurrency
var executor = Executors.newVirtualThreadPerTaskExecutor(); // Java 21+
var future = executor.submit(() -> fetchData(url));

// Good: CompletableFuture for async composition
CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenApply(this::enrichProfile)
    .thenAccept(this::sendNotification)
    .exceptionally(ex -> {
        log.error("Pipeline failed for user {}", id, ex);
        return null;
    });

// Good: Structured concurrency (Java 21+ preview)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var user = scope.fork(() -> fetchUser(id));
    var orders = scope.fork(() -> fetchOrders(id));
    scope.join().throwIfFailed();
    return new UserProfile(user.get(), orders.get());
}
```

- Use `ExecutorService` — never raw `Thread`
- Prefer virtual threads (Java 21+) for I/O-bound workloads
- Use `CompletableFuture` for async composition
- Use `ConcurrentHashMap`, `AtomicInteger`, etc. for thread-safe collections
- Avoid `synchronized` blocks when concurrent utilities suffice
- Use `StructuredConcurrency` (Java 21+ preview) when available

---

## Testing

**Framework**: JUnit 5 + Mockito + Testcontainers.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserService service;

    @Test
    void findUser_returnsUser_whenExists() {
        var expected = new User("1", "Alice", "alice@example.com");
        when(repository.findById("1")).thenReturn(Optional.of(expected));

        var result = service.findUser("1");

        assertThat(result).isEqualTo(expected);
        verify(repository).findById("1");
    }

    @Test
    void findUser_throwsException_whenNotFound() {
        when(repository.findById("1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findUser("1"))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: 1");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "null"})
    void findUser_rejectsInvalidIds(String id) {
        assertThatThrownBy(() -> service.findUser(id))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
```

- Use JUnit 5 with `@ExtendWith(MockitoExtension.class)` for mocking
- Use AssertJ for fluent assertions (`assertThat`, `assertThatThrownBy`)
- Use `@ParameterizedTest` for data-driven tests
- Test both success and failure paths
- Use Testcontainers for integration tests with databases, message queues, etc.
- Naming: `methodName_expectedBehavior_condition`
- Keep tests independent — no shared mutable state

---

## Project Structure

**Gradle (preferred)**:
```
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/project/
│   │   │       ├── Application.java
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── repository/
│   │   │       ├── model/
│   │   │       └── exception/
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       ├── java/
│       │   └── com/company/project/
│       │       ├── service/
│       │       └── controller/
│       └── resources/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/
│   └── wrapper/
└── README.md
```

- Use Gradle Kotlin DSL (`build.gradle.kts`) for build scripts
- Mirror source structure in tests
- Group by feature/domain for larger projects, by layer for smaller ones
- Use `internal/` or package-private access for non-public APIs

---

## Configuration

Use environment variables with structured config (Spring Boot example):

```yaml
# application.yml
server:
  port: ${PORT:8080}

app:
  database:
    url: ${DATABASE_URL}
    pool-size: ${DB_POOL_SIZE:10}
```

```java
@ConfigurationProperties(prefix = "app.database")
public record DatabaseConfig(String url, int poolSize) {}
```

- Use Spring's `@ConfigurationProperties` for type-safe config
- Provide sensible defaults
- Validate configuration at startup with `@Validated`
- Use profiles (`application-dev.yml`, `application-prod.yml`) for environment-specific config

---

## Observability

- Use SLF4J with Logback (or Log4j2) for structured logging
- Include context: request IDs, user IDs, operation names
- Use MDC (Mapped Diagnostic Context) for request-scoped data

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

private static final Logger log = LoggerFactory.getLogger(UserService.class);

public User fetchUser(String id) {
    MDC.put("userId", id);
    try {
        log.info("Fetching user");
        var user = repository.findById(id);
        log.info("User fetched successfully");
        return user;
    } catch (Exception e) {
        log.error("Failed to fetch user", e);
        throw e;
    } finally {
        MDC.remove("userId");
    }
}
```

- Log levels: INFO (normal operations), WARN (unexpected but tolerable), ERROR (actionable failures)
- Never log secrets; redact sensitive data

---

## Security

- Load secrets from environment or secret manager (Spring Vault, AWS Secrets Manager)
- Never commit secrets to VCS
- Validate and sanitize all inputs — use Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.)
- Use parameterized queries (JPA/JDBC) — never concatenate SQL strings
- Enable CSRF, CORS, and authentication with Spring Security when applicable
- Keep dependencies updated — run `dependencyCheck` or `snyk` in CI

---

## Deliverables

- `README.md` with build/test instructions
- `build.gradle.kts` (or `pom.xml`) with pinned dependency versions
- Unit tests for service and domain logic
- Integration tests for repositories and controllers
- Proper error handling throughout (no swallowed exceptions)
- Checkstyle/SpotBugs clean
