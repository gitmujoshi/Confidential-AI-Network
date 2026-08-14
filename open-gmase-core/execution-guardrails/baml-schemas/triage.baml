# Example BAML-style schemas (templates).
# Compile with BoundaryML BAML or adapt to your typed-output stack.

class TriageResult {
  severity string @description("critical|high|medium|low|info")
  category string
  confidence float @description("0.0-1.0")
  recommended_action string @description("investigate|remediate|monitor|escalate")
  requires_hitl bool
}

class ToolProposal {
  tool_name string
  target string
  action_type string @description("READ|WRITE")
  confidence_score float
  dry_run bool
  parameters map<string>
}

function ClassifyAlert(alert_text: string) -> TriageResult {
  client LocalLlama
  prompt #"
    Classify this security alert into TriageResult.
    Alert: {{ alert_text }}
    {{ ctx.output_format }}
  "#
}
