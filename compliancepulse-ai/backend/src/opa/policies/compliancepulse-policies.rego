# Example OPA Policies for CompliancePulse AI

package compliancepulse.tools

# Default: deny if no explicit allow
default allow = false

#-----------------------------------
# 1. Production Database Protection
#-----------------------------------

# Deny DROP TABLE operations in production
deny[msg] {
    input.tool_name == "execute_sql"
    contains(lower(input.parameters.query), "drop table")
    input.environment == "production"
    msg := "DROP TABLE operations not allowed in production environment"
}

# Deny DROP DATABASE operations
deny[msg] {
    input.tool_name == "execute_sql"
    contains(lower(input.parameters.query), "drop database")
    msg := "DROP DATABASE operations are forbidden"
}

# Deny TRUNCATE in production without approval
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

# Deny operations exceeding cost threshold
deny[msg] {
    input.cost_estimate_usd > 100
    msg := sprintf("Operation exceeds cost threshold: $%.2f > $100", [input.cost_estimate_usd])
}

# Warn on expensive operations
warn[msg] {
    input.cost_estimate_usd > 50
    input.cost_estimate_usd <= 100
    msg := sprintf("Operation is expensive: $%.2f", [input.cost_estimate_usd])
}

# Deny LLM inference if token count exceeds limit
deny[msg] {
    input.tool_name == "llm_inference"
    input.parameters.max_tokens > 8000
    msg := sprintf("Token limit exceeded: %d > 8000", [input.parameters.max_tokens])
}

#-----------------------------------
# 3. Confidence Threshold Enforcement
#-----------------------------------

# Deny low-confidence operations on critical resources
deny[msg] {
    input.confidence_score < 0.7
    input.metadata.resource_criticality == "critical"
    msg := sprintf("Confidence too low for critical resource: %.2f < 0.70", [input.confidence_score])
}

# Warn on medium confidence operations
warn[msg] {
    input.confidence_score >= 0.7
    input.confidence_score < 0.85
    msg := sprintf("Medium confidence level: %.2f", [input.confidence_score])
}

#-----------------------------------
# 4. Rate Limiting and Anti-Loop
#-----------------------------------

# Deny if too many invocations in short time window
deny[msg] {
    input.metadata.invocations_last_minute > 100
    msg := "Rate limit exceeded: more than 100 invocations per minute"
}

# Deny if agent appears stuck in loop
deny[msg] {
    input.metadata.repeated_identical_calls > 5
    msg := "Potential infinite loop detected: same call repeated 5+ times"
}

#-----------------------------------
# 5. Credential and Secret Protection
#-----------------------------------

# Deny commands that might expose environment variables
deny[msg] {
    input.tool_name == "execute_command"
    regex.match("(printenv|env|export|set|cat\\s+/etc/environment)", input.parameters.command)
    msg := "Command may expose environment variables or secrets"
}

# Deny access to sensitive files
deny[msg] {
    input.tool_name == "file_operation"
    input.parameters.operation == "read"
    sensitive_paths := ["/etc/passwd", "/etc/shadow", "/.aws/credentials", "/.ssh/id_rsa"]
    path_matches_sensitive(input.parameters.path, sensitive_paths)
    msg := sprintf("Access to sensitive file denied: %s", [input.parameters.path])
}

# Helper function
path_matches_sensitive(path, sensitive_paths) {
    some i
    contains(path, sensitive_paths[i])
}

# Deny operations that try to disable security features
deny[msg] {
    input.tool_name == "execute_command"
    regex.match("(setenforce\\s+0|systemctl\\s+stop\\s+firewalld|iptables\\s+-F)", input.parameters.command)
    msg := "Cannot disable security features"
}

#-----------------------------------
# 6. Network Security
#-----------------------------------

# Deny outbound connections to suspicious IPs
deny[msg] {
    input.tool_name == "http_request"
    is_suspicious_ip(input.parameters.url)
    msg := sprintf("Connection to suspicious IP blocked: %s", [input.parameters.url])
}

# Block connections to cloud metadata services (SSRF prevention)
deny[msg] {
    input.tool_name == "http_request"
    regex.match("(169.254.169.254|metadata.google.internal)", input.parameters.url)
    msg := "Access to cloud metadata service blocked (SSRF prevention)"
}

# Helper function
is_suspicious_ip(url) {
    # In production, check against threat intelligence feed
    suspicious_ips := ["192.0.2.1", "198.51.100.1", "203.0.113.1"]
    some i
    contains(url, suspicious_ips[i])
}

#-----------------------------------
# 7. Time-Based Restrictions
#-----------------------------------

# Deny production changes during business hours
deny[msg] {
    input.tool_name == "execute_command"
    input.environment == "production"
    input.metadata.destructive_operation == true
    is_business_hours(input.timestamp)
    msg := "Destructive production operations only allowed during maintenance windows"
}

# Helper function
is_business_hours(timestamp) {
    # Parse timestamp and check if 9 AM - 5 PM weekdays
    # Simplified for example
    hour := to_number(split(timestamp, "T")[1])
    hour >= 9
    hour < 17
}

#-----------------------------------
# 8. Agent-Specific Policies
#-----------------------------------

# Only forensic agents can read sensitive logs
deny[msg] {
    input.tool_name == "file_operation"
    input.parameters.operation == "read"
    contains(input.parameters.path, "/var/log/audit")
    not is_forensic_agent(input.agent_id)
    msg := "Only forensic agents can access audit logs"
}

# Helper function
is_forensic_agent(agent_id) {
    forensic_agents := ["forensic-001", "forensic-002"]
    some i
    agent_id == forensic_agents[i]
}

#-----------------------------------
# 9. Data Classification Policies
#-----------------------------------

# Deny PII processing without proper authorization
deny[msg] {
    input.metadata.data_classification == "PII"
    not input.metadata.gdpr_approved
    msg := "PII processing requires GDPR approval"
}

# Require encryption for sensitive data operations
deny[msg] {
    input.metadata.data_classification in ["confidential", "restricted"]
    input.tool_name == "file_operation"
    input.parameters.operation == "write"
    not input.parameters.encrypted
    msg := "Sensitive data must be encrypted at rest"
}

#-----------------------------------
# 10. Compliance and Audit
#-----------------------------------

# Require approval for SOX-controlled operations
deny[msg] {
    input.metadata.sox_controlled == true
    not input.metadata.sox_approval_id
    msg := "SOX-controlled operations require documented approval"
}

# Warn if operation creates compliance risk
warn[msg] {
    input.metadata.compliance_risk_score > 70
    msg := sprintf("High compliance risk score: %d", [input.metadata.compliance_risk_score])
}

#-----------------------------------
# Helper Functions
#-----------------------------------

# Utility to check if value is in array
in_array(value, array) {
    some i
    value == array[i]
}

# Utility to convert string to lowercase
lower(s) = output {
    output := lower(s)
}
