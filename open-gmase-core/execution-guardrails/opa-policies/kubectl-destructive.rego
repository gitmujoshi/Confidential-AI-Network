# kubectl destructive operations — community example pack
package open_gmase.kubectl

default allow = false

deny[msg] {
    input.tool_name == "kubectl"
    regex.match(`(?i)\b(delete|drain)\b`, input.parameters.args)
    not input.metadata.hitl_approved
    msg := "kubectl delete/drain requires HITL approval"
}

deny[msg] {
    input.tool_name == "kubectl"
    contains(input.parameters.args, "--all-namespaces")
    contains(input.parameters.args, "delete")
    msg := "cluster-wide delete is forbidden"
}

allow {
    count(deny) == 0
    input.tool_name == "kubectl"
    regex.match(`(?i)\b(get|describe|logs)\b`, input.parameters.args)
}
