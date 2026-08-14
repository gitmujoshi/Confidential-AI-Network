# Open-GMASE base tool guardrails (community pack)
#
# Package: open_gmase.tools
# Covers: destructive SQL/CLI, cost stubs, confidence, rate/loop, secret exposure
# License: Apache-2.0

package open_gmase.tools

# Default: deny if no explicit allow
default allow = false

#-----------------------------------
# 1. Production Database Protection
#-----------------------------------

deny[msg] {
    input.tool_name == "execute_sql"
    contains(lower(input.parameters.query), "drop table")
    input.environment == "production"
    msg := "DROP TABLE operations not allowed in production environment"
}

deny[msg] {
    input.tool_name == "execute_sql"
    contains(lower(input.parameters.query), "drop database")
    msg := "DROP DATABASE operations are forbidden"
}

deny[msg] {
    input.tool_name == "execute_sql"
    contains(lower(input.parameters.query), "truncate")
    input.environment == "production"
    not input.metadata.approved_by_admin
    msg := "TRUNCATE operations require admin approval in production"
}

#-----------------------------------
# 2. Cost Control Policies
#-----------------------------------

deny[msg] {
    input.cost_estimate_usd > 100
    msg := sprintf("Operation exceeds cost threshold: $%.2f > $100", [input.cost_estimate_usd])
}

warn[msg] {
    input.cost_estimate_usd > 50
    input.cost_estimate_usd <= 100
    msg := sprintf("Operation is expensive: $%.2f", [input.cost_estimate_usd])
}

deny[msg] {
    input.tool_name == "llm_inference"
    input.parameters.max_tokens > 8000
    msg := sprintf("Token limit exceeded: %d > 8000", [input.parameters.max_tokens])
}

#-----------------------------------
# 3. Confidence Threshold Enforcement
#-----------------------------------

deny[msg] {
    input.confidence_score < 0.7
    input.metadata.resource_criticality == "critical"
    msg := sprintf("Confidence too low for critical resource: %.2f < 0.70", [input.confidence_score])
}

warn[msg] {
    input.confidence_score >= 0.7
    input.confidence_score < 0.85
    msg := sprintf("Medium confidence level: %.2f", [input.confidence_score])
}

#-----------------------------------
# 4. Rate Limiting and Anti-Loop
#-----------------------------------

deny[msg] {
    input.metadata.invocations_last_minute > 100
    msg := "Rate limit exceeded: more than 100 invocations per minute"
}

deny[msg] {
    input.metadata.repeated_identical_calls > 5
    msg := "Potential infinite loop detected: same call repeated 5+ times"
}

#-----------------------------------
# 5. Credential and Secret Protection
#-----------------------------------

deny[msg] {
    input.tool_name == "execute_command"
    regex.match(`(?i)(env|printenv|echo\s+\$)`, input.parameters.command)
    msg := "Commands that may dump environment secrets are denied"
}

deny[msg] {
    input.tool_name == "execute_command"
    contains(input.parameters.command, "rm -rf /")
    msg := "Destructive filesystem wipe patterns are denied"
}

#-----------------------------------
# 6. Explicit allow (dry-run / read)
#-----------------------------------

allow {
    count(deny) == 0
    input.tool_name == "read_logs"
}

allow {
    count(deny) == 0
    input.metadata.dry_run == true
}

allow {
    count(deny) == 0
    input.tool_name == "execute_sql"
    startswith(lower(trim(input.parameters.query)), "select")
}
