# Test Prompts

## Describe your role

Describe your role. Summarize what you can and cannot do.

## @Athena to use team for HLD

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

## @Athena to use team to extend HLD

Extend the logging system HLD with network transport. Use the team for it.

**Requirements:**

- Three-tier architecture: Logger → Collector → Aggregator (extends existing outputs, doesn't replace them)
- Logger ships log entries over UDP (fire-and-forget, drop on failure) or TCP (at-least-once, bounded ring buffer on failure) — configurable per instance
- Wire format: MessagePack or Protobuf (not JSON), batched by count or time interval
- Collector is a standalone stateless service receiving from multiple apps (app_id + instance_id), compacting into time-windowed zstd-compressed chunks, pushing to aggregator via pluggable adapter (ship HTTP/JSON reference adapter)
- TCP backpressure propagates naturally from aggregator through collector to logger; UDP is unaffected
- TLS optional, auth via shared secret token in batch header
- Network output fully async — must NOT degrade file/console throughput; collector handles 10k+ connections, 1M+ entries/sec
- No disk WAL, no collector HA/clustering, no service discovery, no log filtering at collector — durability is the file output's job
- Single collector instance per environment, no multi-process concerns

## @Athena to use team to write LLD for first HLD

Write an LLD for the @.specs/hld-00001-logging-system-v1.md document. Use the team. The target language is Golang and focus on existing solutions and enhancing them.

## @Hephaestus to split the LLD into tasks

Read @.specs/lld-00001-logging-system-v1.md and split it into tasks. Use the team to review them.
