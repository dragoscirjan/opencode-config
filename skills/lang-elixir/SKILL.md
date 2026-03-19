---
name: lang-elixir
description: Elixir/OTP development standards — functional style, concurrency, OTP patterns, testing, and project structure. Load when working on Elixir projects.
---

# Elixir Standards

## Code Style

Follow the [Elixir Style Guide](https://github.com/christopheradams/elixir_style_guide).

**Tooling (mandatory)**:
- `mix format` — code formatting (always run before commit)
- `Credo` — static analysis and style checking
- `Dialyxir` — type checking via Dialyzer
- `mix compile --warnings-as-errors` — strict compilation

**Naming**:
- `snake_case` for functions, variables, atoms, module attributes
- `PascalCase` for modules
- `snake_case` for filenames
- Predicate functions end with `?` (e.g., `valid?/1`)
- Bang functions end with `!` for those that raise on error (e.g., `fetch!/1`)

---

## Functional Patterns

Elixir is functional — embrace immutability and pattern matching.

```elixir
# Good: pattern matching in function heads
def process(%User{role: :admin} = user), do: admin_flow(user)
def process(%User{role: :member} = user), do: member_flow(user)
def process(_), do: {:error, :unknown_role}

# Good: pipe operator for data transformation
user
|> validate()
|> enrich_profile()
|> persist()
|> notify()

# Good: with for complex conditional flows
with {:ok, user} <- fetch_user(id),
     {:ok, profile} <- fetch_profile(user),
     {:ok, _} <- authorize(profile) do
  {:ok, profile}
end
```

- Use pattern matching in function heads over conditionals
- Use the pipe operator `|>` for data transformation chains
- Use `with` for multi-step operations that may fail
- Keep functions small and focused
- Prefer recursion with tail-call optimization over loops
- Use guards (`when`) for type/value constraints

---

## Error Handling

Use tagged tuples — the Elixir convention.

```elixir
# Good: tagged tuples for expected errors
def fetch_user(id) do
  case Repo.get(User, id) do
    nil -> {:error, :not_found}
    user -> {:ok, user}
  end
end

# Good: bang variant raises for unexpected failures
def fetch_user!(id) do
  case fetch_user(id) do
    {:ok, user} -> user
    {:error, reason} -> raise "Failed to fetch user #{id}: #{reason}"
  end
end
```

- Return `{:ok, value}` / `{:error, reason}` for expected failures
- Use `!` functions that raise for "should never fail" cases
- Let processes crash on unexpected errors — supervisors handle recovery
- Never catch generic exceptions unless at application boundaries
- Use `Ecto.Changeset` for input validation

---

## OTP and Concurrency

OTP is the backbone — use supervision trees and processes.

```elixir
# GenServer for stateful processes
defmodule MyApp.Cache do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(opts) do
    {:ok, %{data: %{}, ttl: Keyword.get(opts, :ttl, 60_000)}}
  end

  @impl true
  def handle_call({:get, key}, _from, state) do
    {:reply, Map.get(state.data, key), state}
  end

  @impl true
  def handle_cast({:put, key, value}, state) do
    {:noreply, put_in(state.data[key], value)}
  end
end
```

```elixir
# Supervision tree
defmodule MyApp.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      MyApp.Repo,
      {MyApp.Cache, ttl: 120_000},
      MyAppWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: MyApp.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

- Use supervision trees — define restart strategies (`one_for_one`, `one_for_all`, `rest_for_one`)
- Use `GenServer` for stateful processes
- Use `Task` and `Task.Supervisor` for one-off async work
- Isolate side effects in dedicated processes
- Use message passing between processes — avoid shared state
- Use `Registry` for dynamic process registration
- Design for "let it crash" — supervisors handle recovery

---

## Testing

**Framework**: ExUnit (built-in).

```elixir
defmodule MyApp.UserServiceTest do
  use ExUnit.Case, async: true

  alias MyApp.UserService

  describe "fetch_user/1" do
    test "returns user when exists" do
      {:ok, user} = UserService.fetch_user("valid-id")
      assert user.name == "Alice"
    end

    test "returns error when not found" do
      assert {:error, :not_found} = UserService.fetch_user("nonexistent")
    end
  end

  describe "create_user/1" do
    test "validates required fields" do
      assert {:error, changeset} = UserService.create_user(%{})
      assert "can't be blank" in errors_on(changeset).name
    end
  end
end
```

- Use `async: true` for tests that don't share state
- Use `describe` blocks for grouping related tests
- Test both `{:ok, _}` and `{:error, _}` paths
- Use `Mox` for mocking (behavior-based)
- Use `ExUnit.CaptureLog` to test log output
- Use `Ecto.Adapters.SQL.Sandbox` for database test isolation
- Use `setup` and `setup_all` for test fixtures
- Run with `mix test`; use `--cover` for coverage

---

## Ecto (Database)

```elixir
defmodule MyApp.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :name, :string
    field :email, :string
    has_many :orders, MyApp.Order
    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email])
    |> validate_required([:name, :email])
    |> validate_format(:email, ~r/@/)
    |> unique_constraint(:email)
  end
end
```

- Use Ecto schemas and changesets for data validation
- Write migrations with `mix ecto.gen.migration`
- Use `Repo.transaction` for multi-step database operations
- Use preloads explicitly — avoid N+1 queries
- Use composable queries with `Ecto.Query`

---

## Phoenix (Web)

```elixir
defmodule MyAppWeb.UserController do
  use MyAppWeb, :controller

  action_fallback MyAppWeb.FallbackController

  def show(conn, %{"id" => id}) do
    with {:ok, user} <- Users.fetch_user(id) do
      render(conn, :show, user: user)
    end
  end
end
```

- Use contexts (e.g., `MyApp.Users`) to encapsulate business logic
- Keep controllers thin — delegate to contexts
- Use `action_fallback` for consistent error handling
- Use LiveView for real-time features
- Use `Plug` for middleware (auth, logging, etc.)

---

## Project Structure

```
├── lib/
│   ├── my_app/
│   │   ├── application.ex     # OTP Application
│   │   ├── repo.ex            # Ecto Repo
│   │   ├── users/             # Context: Users
│   │   │   ├── user.ex        # Schema
│   │   │   └── users.ex       # Context module
│   │   └── orders/            # Context: Orders
│   ├── my_app_web/
│   │   ├── controllers/
│   │   ├── views/
│   │   ├── live/              # LiveView
│   │   ├── router.ex
│   │   └── endpoint.ex
│   └── my_app.ex
├── test/
│   ├── my_app/
│   ├── my_app_web/
│   └── support/
├── config/
│   ├── config.exs
│   ├── dev.exs
│   ├── prod.exs
│   └── test.exs
├── priv/
│   └── repo/migrations/
├── mix.exs
└── mix.lock
```

- Use Phoenix contexts to group related business logic
- Keep `lib/my_app/` for business logic, `lib/my_app_web/` for web layer
- Tests mirror the source structure

---

## Configuration

Use Mix config with environment-specific overrides:

```elixir
# config/runtime.exs — runtime config from environment
config :my_app, MyApp.Repo,
  url: System.get_env("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")
```

- Use `config/runtime.exs` for runtime environment variables
- Use `config/dev.exs`, `config/test.exs`, `config/prod.exs` for env-specific compile-time config
- Validate required config at startup in `Application.start/2`

---

## Observability

- Use `Logger` for structured logging
- Include context (request IDs, user IDs) via `Logger.metadata`
- Use Telemetry for metrics and instrumentation

```elixir
require Logger

Logger.info("User fetched", user_id: id, request_id: conn.assigns[:request_id])
Logger.error("Failed to process order", order_id: id, reason: inspect(reason))
```

---

## Security

- Load secrets from environment variables or secret manager
- Never commit secrets to VCS
- Validate and sanitize all inputs via Ecto changesets
- Use parameterized queries (Ecto handles this by default)
- Use `Plug.CSRFProtection` for CSRF protection
- Use `Bcrypt` or `Argon2` for password hashing

---

## Deliverables

- `README.md` with setup/test instructions
- `mix.exs` with pinned dependency versions
- Unit tests for contexts and business logic
- Proper error handling with tagged tuples
- Supervision tree for process management
- Database migrations
