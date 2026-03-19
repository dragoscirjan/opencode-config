---
name: lang-lua
description: Lua development standards — style, patterns, error handling, testing, and embedding. Load when working on Lua projects.
---

# Lua Standards

## Code Style

Follow the [Lua Style Guide](https://github.com/Olivine-Labs/lua-style-guide).

**Tooling (recommended)**:
- `luacheck` — static analysis and linting
- `StyLua` — code formatting (Rust-based, opinionated)
- `LuaRocks` — package manager

**Naming**:
- `snake_case` for variables, functions, modules
- `PascalCase` for classes/metatables (OOP-style)
- `SCREAMING_SNAKE_CASE` for constants
- Prefix private/internal functions with `_`
- Use `local` for everything — avoid polluting globals

---

## Fundamentals

Lua is minimal by design — tables are the universal data structure.

```lua
-- Good: always use local
local function process(data)
  local result = {}
  for _, item in ipairs(data) do
    result[#result + 1] = transform(item)
  end
  return result
end

-- Good: module pattern
local M = {}

function M.create(name, age)
  return { name = name, age = age }
end

function M.greet(user)
  return string.format("Hello, %s!", user.name)
end

return M
```

- **Always use `local`** — global variables are a major source of bugs
- Use tables for everything: arrays, maps, objects, modules
- Prefer `ipairs` for array iteration, `pairs` for map iteration
- Use `#` operator for array length (contiguous integer keys only)
- Use `table.insert` or `t[#t + 1]` for appending
- String concatenation: use `table.concat` for multiple strings (not `..` in loops)

---

## Error Handling

Lua uses `pcall`/`xpcall` for protected calls and `error()` for raising.

```lua
-- Good: pcall for expected failures
local ok, result = pcall(function()
  return parse_config(path)
end)

if not ok then
  log.error("Failed to parse config: " .. tostring(result))
  return nil, result
end

-- Good: xpcall with traceback for debugging
local ok, result = xpcall(dangerous_operation, debug.traceback)

-- Good: return nil, err pattern (idiomatic Lua)
local function read_file(path)
  local file, err = io.open(path, "r")
  if not file then
    return nil, string.format("cannot open %s: %s", path, err)
  end
  local content = file:read("*a")
  file:close()
  return content
end
```

- Use `return nil, error_message` pattern for expected failures (idiomatic)
- Use `pcall`/`xpcall` for catching unexpected errors
- Use `error()` for programming bugs / assertion failures
- Always include context in error messages
- Use `xpcall` with `debug.traceback` during development for stack traces
- Check return values — Lua doesn't force you to, but you must

---

## OOP with Metatables

```lua
local Animal = {}
Animal.__index = Animal

function Animal.new(name, sound)
  local self = setmetatable({}, Animal)
  self.name = name
  self.sound = sound
  return self
end

function Animal:speak()
  return string.format("%s says %s", self.name, self.sound)
end

-- Inheritance
local Dog = setmetatable({}, { __index = Animal })
Dog.__index = Dog

function Dog.new(name)
  local self = Animal.new(name, "woof")
  return setmetatable(self, Dog)
end

function Dog:fetch(item)
  return string.format("%s fetches the %s", self.name, item)
end
```

- Use metatables and `__index` for prototype-based OOP
- Use `ClassName.new()` as constructor convention
- Use `:` (colon) syntax for methods (implicit `self` parameter)
- Use `.` (dot) syntax for static/class functions
- Keep inheritance shallow — prefer composition via embedding tables

---

## Tables and Data Structures

```lua
-- Array (sequential integer keys)
local fruits = { "apple", "banana", "cherry" }

-- Map / dictionary
local config = {
  host = "localhost",
  port = 8080,
  debug = false,
}

-- Defensive access for nested tables
local function get_nested(t, ...)
  local current = t
  for _, key in ipairs({...}) do
    if type(current) ~= "table" then return nil end
    current = current[key]
  end
  return current
end
```

- Be aware: arrays are 1-indexed in Lua
- Don't mix array and map keys in the same table
- Use `nil` checks before accessing nested tables
- Use `type()` for runtime type checking when needed

---

## Testing

**Framework**: `busted` (BDD-style) or `luaunit`.

```lua
-- busted style
describe("UserService", function()
  describe("create_user", function()
    it("returns a user with the given name", function()
      local user = UserService.create("Alice")
      assert.are.equal("Alice", user.name)
    end)

    it("returns nil for empty name", function()
      local user, err = UserService.create("")
      assert.is_nil(user)
      assert.are.equal("name cannot be empty", err)
    end)
  end)
end)

-- luaunit style
local lu = require("luaunit")

TestUserService = {}

function TestUserService:test_create_user()
  local user = UserService.create("Alice")
  lu.assertEquals(user.name, "Alice")
end

function TestUserService:test_create_user_empty_name()
  local user, err = UserService.create("")
  lu.assertNil(user)
  lu.assertEquals(err, "name cannot be empty")
end

os.exit(lu.LuaUnit.run())
```

- Use `busted` for BDD-style testing or `luaunit` for xUnit-style
- Test both success and `nil, err` failure paths
- Use `spy`, `stub`, `mock` from busted for test doubles
- Name tests descriptively
- Run with `busted` CLI or `lua test_file.lua` (luaunit)

---

## Embedding and C API

Lua is often embedded in other applications (games, tools, configs).

```lua
-- Configuration file pattern (common embedding use case)
return {
  window = {
    width = 1920,
    height = 1080,
    fullscreen = false,
  },
  audio = {
    volume = 0.8,
    mute = false,
  },
}
```

- When writing Lua for embedding, follow the host application's conventions
- Keep the Lua/C boundary clean — validate data crossing the boundary
- Use `require` for module loading — it handles caching
- Be aware of sandboxing — embedded Lua may not have `io`, `os`, `debug`
- For LuaJIT: use FFI for C interop instead of the C API when possible

---

## LuaJIT Specifics

```lua
local ffi = require("ffi")

ffi.cdef[[
  int printf(const char *fmt, ...);
  typedef struct { double x, y; } Point;
]]

local point = ffi.new("Point", { x = 1.0, y = 2.0 })
ffi.C.printf("Point: (%f, %f)\n", point.x, point.y)
```

- LuaJIT supports Lua 5.1 syntax (not 5.2+)
- Use FFI for C interop — it's faster than the C API
- Avoid patterns that prevent JIT compilation (e.g., `pairs` in hot loops, `unpack`, NYI features)
- Use `jit.off()` selectively if needed, not globally

---

## Neovim Lua

When writing Lua for Neovim plugins or configuration:

```lua
-- Plugin structure
local M = {}

function M.setup(opts)
  opts = vim.tbl_deep_extend("force", {
    enabled = true,
    keymap = "<leader>x",
  }, opts or {})

  if not opts.enabled then return end

  vim.keymap.set("n", opts.keymap, function()
    M.run()
  end, { desc = "Run my plugin" })
end

function M.run()
  local buf = vim.api.nvim_get_current_buf()
  local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
  -- process lines
end

return M
```

- Follow Neovim API conventions (`vim.api`, `vim.fn`, `vim.keymap`)
- Use `vim.tbl_deep_extend` for merging config with defaults
- Use `vim.notify` for user-facing messages
- Use `vim.schedule` for async-safe UI operations
- Expose a `setup(opts)` function for plugin configuration
- Use `vim.validate` for option validation

---

## Project Structure

```
├── lua/
│   └── mymodule/
│       ├── init.lua        # Module entry point
│       ├── core.lua        # Core logic
│       └── utils.lua       # Utilities
├── spec/                    # busted tests
│   └── mymodule/
│       ├── core_spec.lua
│       └── utils_spec.lua
├── rockspec/               # LuaRocks package spec (if distributing)
├── .luacheckrc             # luacheck config
└── README.md
```

- Use `init.lua` as module entry point (loaded by `require("mymodule")`)
- Keep modules focused — one concern per file
- Tests mirror source structure in `spec/` (busted) or `test/` (luaunit)

---

## Security

- Sandbox untrusted Lua code — remove `io`, `os`, `debug`, `loadfile` from the environment
- Validate all inputs, especially from C/host boundary
- Never use `loadstring` / `load` with untrusted input
- Be cautious with `debug` library in production

---

## Observability

- Use a logging module (or simple `print`/`io.write` wrapper with levels)
- Include context in log messages
- Log levels: info, warn, error

```lua
local log = require("mymodule.log")
log.info("Processing request", { id = request_id })
log.error("Failed to connect", { host = host, err = tostring(err) })
```

---

## Deliverables

- `README.md` with usage/test instructions
- `.luacheckrc` with project-specific config
- Tests for public module APIs
- Proper error handling (`nil, err` pattern)
- All variables declared `local`
- No global namespace pollution
