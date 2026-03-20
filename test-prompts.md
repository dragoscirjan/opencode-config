# Test Prompts

## @Plan to use team for HLD

Write me a HLD for a logging system. Use the team for it.
**Requirements:**

- Language-agnostic design
- Log levels: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
- File output: JSON format
- Console output: Prettified to /dev/stdout or /dev/stderr
- High throughput: Async/buffered writes, millions of logs/sec, minimal allocations
- Structured logging with key-value pairs
- Context propagation (request IDs, trace IDs)
- File rotation (size-based, time-based, retention policies)
- Single process per log file (no multi-process safety needed)
