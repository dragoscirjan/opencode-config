/**
 * Bifrost configuration schema (TypeScript types only, no runtime values).
 *
 * These interfaces describe the shape of the Bifrost gateway configuration.
 * The actual values live in `config.ts`; `start.ts` serializes them to
 * `${appDir}/config.json` and launches Bifrost with it.
 */

/** An API key registered on a provider. */
export interface ProviderKey {
  /** Human-readable label for the key (e.g. "default", "local"). */
  name: string;
  /**
   * The key value. The special form `"env.VAR_NAME"` makes Bifrost read the
   * value from the environment variable `VAR_NAME` at runtime.
   */
  value: string;
  /**
   * Models this key is allowed to serve. `["*"]` means "any model".
   * Entries use the `vendor/model` naming convention.
   */
  models: string[];
  /**
   * Load-balancing weight relative to other keys on the same provider.
   * Higher weight receives proportionally more traffic.
   */
  weight: number;
}

/** Network-level settings for a provider's upstream connection. */
export interface NetworkConfig {
  /** Base URL of the provider's API endpoint. */
  base_url: string;
  /**
   * Allow requests to private/loopback addresses (RFC 1918, localhost, etc.).
   * Required for providers running on the LAN, e.g. a local LM Studio.
   */
  allow_private_network?: boolean;
  /** How long to wait for a single upstream request before failing it. */
  default_request_timeout_in_seconds: number;
  /** Maximum idle time while receiving a streaming response. */
  stream_idle_timeout_in_seconds?: number;
  /** How many times to retry a failed upstream request before falling back. */
  max_retries: number;
}

/** Which request kinds a custom provider accepts. */
export interface AllowedRequests {
  /** Non-streaming chat completions (`POST /chat/completions`). */
  chat_completion: boolean;
  /** Streaming chat completions (SSE). */
  chat_completion_stream: boolean;
}

/** Settings for providers that are not natively supported by Bifrost. */
export interface CustomProviderConfig {
  /**
   * The built-in provider implementation whose wire protocol is reused
   * (e.g. "openai" for any OpenAI-compatible endpoint).
   */
  base_provider_type: string;
  /** The request kinds this provider is allowed to handle. */
  allowed_requests: AllowedRequests;
}

/** A single upstream LLM provider. */
export interface ProviderConfig {
  /** API keys available to this provider (load-balanced by weight). */
  keys: ProviderKey[];
  /** Connection settings for this provider. */
  network_config: NetworkConfig;
  /** Custom-provider settings (only for OpenAI-compatible custom endpoints). */
  custom_provider_config: CustomProviderConfig;
}

/** A concrete provider/model pair a routing rule sends traffic to. */
export interface RoutingTarget {
  /**
   * Provider key as defined under {@link BifrostConfig.providers}.
   * Omit to keep the incoming request's provider.
   */
  provider?: string;
  /**
   * Model identifier in `vendor/model` form.
   * Omit to keep the incoming request's model.
   */
  model?: string;
  /**
   * UUID of a specific provider API key to pin for this target.
   * Requires `provider` to be set; omit for load-balanced key selection.
   */
  key_id?: string;
  /**
   * Probability weight. The weights of all targets in a rule must sum to 1;
   * with multiple targets, one is selected probabilistically per request.
   */
  weight: number;
}

/**
 * A governance routing rule. When a request matches
 * {@link RoutingRule.cel_expression}, the rule's targets (and ordered
 * fallbacks) decide which upstream provider/model actually serves it.
 * This is how "virtual models" like `code` or `design` are implemented.
 */
export interface RoutingRule {
  /** Unique, stable identifier of the rule. */
  id: string;
  /** Human-readable name shown in the Bifrost UI/logs. */
  name: string;
  /** Free-text explanation of what the rule is for. */
  description: string;
  /** Whether the rule is active. Disabled rules are ignored entirely. */
  enabled: boolean;
  /**
   * When true, after this rule matches, the resolved provider/model becomes
   * the new request context and the full rule set is re-evaluated from the
   * top (rule chaining). Default false = terminal rule.
   */
  chain_rule?: boolean;
  /**
   * Evaluation order within a scope: rules are sorted ASCENDING by priority
   * (0 evaluates before 10) and the FIRST matching rule wins.
   * Scopes themselves are evaluated VirtualKey → Team → Customer → Global.
   */
  priority: number;
  /**
   * Where the rule applies: "global" (every request), "customer", "team",
   * or "virtual_key".
   */
  scope: string;
  /** ID of the scoped entity; null/omitted for global scope. */
  scope_id?: string | null;
  /**
   * CEL (Common Expression Language) predicate evaluated against the request.
   * The rule applies only when the expression is true.
   *
   * Available variables include:
   * - `model`, `provider`, `request_type` — request context
   * - `headers["x-..."]`, `params["..."]` — transport metadata
   * - `virtual_key_id/name`, `team_id/name`, `customer_id/name` — org context
   * - `budget_used`, `tokens_used`, `request` — capacity metrics (0-100)
   * - `complexity_tier` — "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING",
   *   classified per-request by the Complexity Router (see
   *   {@link GovernanceConfig.complexity_analyzer_config}); unknown when the
   *   prompt carries no configured signal, in which case tier rules simply
   *   do not match and evaluation falls through.
   *
   * Example: `model == "code" && complexity_tier == "REASONING"`.
   */
  cel_expression: string;
  /**
   * Primary destination(s) for matched requests. With several targets, one
   * is picked probabilistically by weight (weights must sum to 1).
   */
  targets: RoutingTarget[];
  /**
   * Ordered fallback chain in `"provider/model"` form. When the selected
   * target fails (after retries), the next entry is tried, in order.
   */
  fallbacks: string[];
}

/**
 * Score thresholds mapping the 0..1 complexity score to a tier.
 * Must be strictly increasing: simple_medium < medium_complex < complex_reasoning.
 */
export interface ComplexityTierBoundaries {
  /** Threshold between Simple and Medium (default 0.15). */
  simple_medium: number;
  /** Threshold between Medium and Complex (default 0.35). */
  medium_complex: number;
  /** Threshold between Complex and Reasoning (default 0.60). */
  complex_reasoning: number;
}

/**
 * Keyword lists driving the complexity scoring dimensions.
 * Lists are merged additively (union) with the stored runtime keywords;
 * each list needs at least one entry when present.
 */
export interface ComplexityKeywords {
  /** Code/debugging/programming signals (30% of the score). */
  code_keywords: string[];
  /**
   * Strong reasoning triggers: 2+ matches (or 1 match plus strong
   * code/technical signals) force the Reasoning tier regardless of score.
   * Keep these specific multi-word phrases — broad terms like "explain"
   * will push most traffic to Reasoning.
   */
  reasoning_keywords: string[];
  /** Architecture/infra/operations signals (25% of the score). */
  technical_keywords: string[];
  /** Straightforward-intent phrases that nudge the score down (-5%). */
  simple_keywords: string[];
}

/**
 * Tuning for the Complexity Router, which classifies each text-bearing
 * request into SIMPLE / MEDIUM / COMPLEX / REASONING (fully in-process,
 * <1 ms, zero external calls) and exposes the result as the
 * `complexity_tier` CEL variable for routing rules.
 *
 * Scoring: code 30% + reasoning markers 25% + technical terms 25% +
 * word count 10% − simple indicators 5%; the system prompt contributes
 * 25% of the user-message signal, and multi-turn history blends in
 * (60/40, or 35/65 for continuation phrases like "do it").
 *
 * Omit this whole section to use Bifrost's factory defaults.
 */
export interface ComplexityAnalyzerConfig {
  /** Score → tier thresholds. */
  tier_boundaries: ComplexityTierBoundaries;
  /** Keyword lists for the scoring dimensions. */
  keywords: ComplexityKeywords;
}

/** Governance settings: routing, budgets, and guardrails. */
export interface GovernanceConfig {
  /**
   * All routing rules. Evaluation order: scope VirtualKey → Team →
   * Customer → Global; ascending priority within a scope; first match wins.
   */
  routing_rules: RoutingRule[];
  /** Complexity Router tuning. Omit to use factory defaults. */
  complexity_analyzer_config?: ComplexityAnalyzerConfig;
}

/** HTTP server tuning for the Bifrost gateway itself. */
export interface ServerConfig {
  /** Socket read buffer size in bytes for inbound requests. */
  read_buffer_size: number;
}

/** Logging behaviour of the Bifrost gateway. */
export interface ClientConfig {
  /** Master switch for request/response logging. */
  enable_logging: boolean;
  /**
   * When true, request/response bodies are excluded from logs (only metadata
   * is kept). Keep false in local dev to allow prompt inspection.
   */
  disable_content_logging: boolean;
  /** How many days log entries are retained before being pruned. */
  log_retention_days: number;
  /** Extra HTTP headers captured into each log entry. */
  logging_headers: string[];
  /** Also mirror errors to the console (stdout/stderr) logs. */
  dump_errors_in_console_logs: boolean;
}

/** A pluggable storage backend (used for config and logs stores). */
export interface StoreConfig {
  /** Whether this store is active. */
  enabled: boolean;
  /** Storage backend driver. Currently "sqlite". */
  type: 'sqlite';
  /** Driver-specific options. */
  config: {
    /** Filesystem path of the SQLite database file. */
    path: string;
  };
}

/** Root Bifrost configuration object, serialized to `config.json`. */
export interface BifrostConfig {
  /** URL of the JSON schema this config conforms to (editor validation). */
  $schema: string;
  /**
   * Declares which source Bifrost treats as authoritative for its
   * configuration ("config.json" = the generated file).
   */
  source_of_truth: string;
  /** Key used to encrypt secrets (provider API keys) at rest. */
  encryption_key: string;
  /** Gateway HTTP server tuning. */
  server: ServerConfig;
  /** Logging behaviour. */
  client: ClientConfig;
  /** Where Bifrost persists its own configuration state. */
  config_store: StoreConfig;
  /** Where Bifrost persists request/response logs. */
  logs_store: StoreConfig;
  /** Upstream LLM providers, keyed by provider id. */
  providers: Record<string, ProviderConfig>;
  /** Governance: routing rules that map virtual models to real ones. */
  governance: GovernanceConfig;
}
