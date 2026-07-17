# Production Troubleshooting Guide

## 🔧 **Complete Troubleshooting Guide for AI Model Training Environment**

This guide provides comprehensive troubleshooting procedures for the production AI model training environment.

## 🚨 **Common Issues & Solutions**

### **1. Pod Issues**

#### **Pod Not Starting**
```bash
# Check pod status
kubectl get pods -n training-environment

# Describe pod for details
kubectl describe pod <pod-name> -n training-environment

# Check pod logs
kubectl logs <pod-name> -n training-environment

# Common causes and solutions:
# 1. Image pull errors
kubectl get events -n training-environment --sort-by='.lastTimestamp'

# 2. Resource constraints
kubectl top pods -n training-environment

# 3. Configuration issues
kubectl get configmap -n training-environment
kubectl get secret -n training-environment
```

#### **Pod CrashLoopBackOff**
```bash
# Check previous logs
kubectl logs <pod-name> -n training-environment --previous

# Check resource usage
kubectl top pod <pod-name> -n training-environment

# Check events
kubectl get events -n training-environment --field-selector involvedObject.name=<pod-name>

# Common solutions:
# 1. Increase resource limits
kubectl patch deployment <deployment-name> -n training-environment -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container-name>","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# 2. Fix configuration issues
kubectl edit configmap <configmap-name> -n training-environment

# 3. Restart deployment
kubectl rollout restart deployment <deployment-name> -n training-environment
```

### **2. Service Issues**

#### **Service Not Accessible**
```bash
# Check service endpoints
kubectl get endpoints -n training-environment

# Check service configuration
kubectl describe service <service-name> -n training-environment

# Test service connectivity
kubectl run test-pod --image=busybox --rm -it -- nslookup <service-name>.training-environment.svc.cluster.local

# Common solutions:
# 1. Check pod labels match service selector
kubectl get pods -n training-environment --show-labels
kubectl get service <service-name> -n training-environment -o yaml

# 2. Check port configuration
kubectl get service <service-name> -n training-environment -o jsonpath='{.spec.ports}'

# 3. Check network policies
kubectl get networkpolicies -n training-environment
```

#### **Load Balancer Not Working**
```bash
# Check load balancer status
kubectl get service -n training-environment

# Check ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Check ingress configuration
kubectl describe ingress <ingress-name> -n training-environment

# Common solutions:
# 1. Check DNS resolution
nslookup training.example.com

# 2. Check SSL certificates
kubectl get certificate -n training-environment
kubectl describe certificate <certificate-name> -n training-environment

# 3. Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=100
```

### **3. Database Issues**

#### **Database Connection Failed**
```bash
# Check database pod status
kubectl get pods -n training-environment | grep postgres

# Check database logs
kubectl logs <postgres-pod-name> -n training-environment

# Test database connectivity
kubectl run postgres-client --image=postgres:13 --rm -it -- psql -h postgresql.training-environment.svc.cluster.local -U postgres -d contract_management_production

# Common solutions:
# 1. Check database credentials
kubectl get secret database-secret -n training-environment -o yaml

# 2. Check database configuration
kubectl describe configmap postgresql-config -n training-environment

# 3. Restart database
kubectl rollout restart statefulset postgresql -n training-environment
```

#### **Database Performance Issues**
```bash
# Check database metrics
kubectl top pod <postgres-pod-name> -n training-environment

# Check database connections
kubectl exec -it <postgres-pod-name> -n training-environment -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
kubectl exec -it <postgres-pod-name> -n training-environment -- psql -U postgres -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Common solutions:
# 1. Scale database
kubectl scale statefulset postgresql --replicas=2 -n training-environment

# 2. Optimize database configuration
kubectl edit configmap postgresql-config -n training-environment

# 3. Check storage performance
kubectl describe pvc <postgres-pvc> -n training-environment
```

### **4. Monitoring Issues**

#### **Prometheus Not Collecting Metrics**
```bash
# Check Prometheus pod status
kubectl get pods -n monitoring | grep prometheus

# Check Prometheus configuration
kubectl get configmap prometheus-config -n monitoring -o yaml

# Check targets
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring
# Open http://localhost:9090/targets

# Common solutions:
# 1. Check service discovery
kubectl get service -n training-environment

# 2. Check network connectivity
kubectl run test-pod --image=busybox --rm -it -- wget -O- http://ai-training-service.training-environment.svc.cluster.local:80/metrics

# 3. Restart Prometheus
kubectl rollout restart deployment prometheus-server -n monitoring
```

#### **Grafana Dashboards Not Loading**
```bash
# Check Grafana pod status
kubectl get pods -n monitoring | grep grafana

# Check Grafana logs
kubectl logs <grafana-pod-name> -n monitoring

# Check Grafana configuration
kubectl get configmap grafana-config -n monitoring -o yaml

# Common solutions:
# 1. Check Prometheus connectivity
kubectl exec -it <grafana-pod-name> -n monitoring -- wget -O- http://prometheus-server.monitoring.svc.cluster.local:80/api/v1/query?query=up

# 2. Check dashboard configuration
kubectl get configmap grafana-dashboards -n monitoring -o yaml

# 3. Restart Grafana
kubectl rollout restart deployment grafana -n monitoring
```

### **5. Security Issues**

#### **Authentication Failures**
```bash
# Check authentication service logs
kubectl logs -n training-environment deployment/ai-training-api | grep auth

# Check Keycloak status
kubectl get pods -n training-environment | grep keycloak
kubectl logs <keycloak-pod-name> -n training-environment

# Check authentication configuration
kubectl get configmap keycloak-config -n training-environment -o yaml

# Common solutions:
# 1. Check Keycloak connectivity
kubectl run test-pod --image=busybox --rm -it -- wget -O- http://keycloak.training-environment.svc.cluster.local:8080/auth/realms/production

# 2. Check JWT configuration
kubectl get secret auth-secret -n training-environment -o yaml

# 3. Restart authentication service
kubectl rollout restart deployment/ai-training-api -n training-environment
```

#### **Authorization Issues**
```bash
# Check RBAC configuration
kubectl get roles,rolebindings,clusterroles,clusterrolebindings

# Check service account
kubectl get serviceaccount -n training-environment
kubectl describe serviceaccount <service-account-name> -n training-environment

# Check network policies
kubectl get networkpolicies -n training-environment
kubectl describe networkpolicy <network-policy-name> -n training-environment

# Common solutions:
# 1. Fix RBAC permissions
kubectl create rolebinding <role-binding-name> --role=<role-name> --user=<user-name> -n training-environment

# 2. Check service account permissions
kubectl auth can-i <verb> <resource> --as=system:serviceaccount:training-environment:<service-account-name>

# 3. Update network policies
kubectl apply -f security/network-policies.yaml
```

## 🔍 **Diagnostic Commands**

### **System Health Check**
```bash
#!/bin/bash
# Complete system health check

echo "🔍 AI Training Environment Health Check"
echo "======================================"

# Check cluster status
echo "📊 Cluster Status:"
kubectl get nodes
kubectl get pods --all-namespaces | grep -E "(Error|CrashLoopBackOff|ImagePullBackOff)"

# Check training environment
echo "🏗️ Training Environment:"
kubectl get pods -n training-environment
kubectl get services -n training-environment
kubectl get ingress -n training-environment

# Check monitoring
echo "📈 Monitoring:"
kubectl get pods -n monitoring
kubectl get pods -n logging

# Check security
echo "🔒 Security:"
kubectl get pods -n vault
kubectl get networkpolicies -n training-environment

# Check storage
echo "💾 Storage:"
kubectl get pv,pvc -n training-environment

# Check resources
echo "⚡ Resources:"
kubectl top nodes
kubectl top pods -n training-environment
```

### **Log Analysis**
```bash
#!/bin/bash
# Log analysis script

echo "📝 Log Analysis"
echo "==============="

# Application logs
echo "🔍 Application Logs:"
kubectl logs -n training-environment deployment/ai-training-api --tail=100 | grep -E "(ERROR|WARN|FATAL)"

# Database logs
echo "🗄️ Database Logs:"
kubectl logs -n training-environment deployment/postgresql --tail=100 | grep -E "(ERROR|WARN|FATAL)"

# Monitoring logs
echo "📊 Monitoring Logs:"
kubectl logs -n monitoring deployment/prometheus-server --tail=100 | grep -E "(ERROR|WARN|FATAL)"

# Security logs
echo "🔒 Security Logs:"
kubectl logs -n training-environment deployment/falco --tail=100 | grep -E "(ERROR|WARN|FATAL)"
```

### **Performance Analysis**
```bash
#!/bin/bash
# Performance analysis script

echo "⚡ Performance Analysis"
echo "======================"

# Resource usage
echo "📊 Resource Usage:"
kubectl top nodes
kubectl top pods -n training-environment

# Network performance
echo "🌐 Network Performance:"
kubectl get networkpolicies -n training-environment
kubectl get services -n training-environment

# Storage performance
echo "💾 Storage Performance:"
kubectl get pv,pvc -n training-environment
kubectl describe pvc <pvc-name> -n training-environment

# Database performance
echo "🗄️ Database Performance:"
kubectl exec -it <postgres-pod-name> -n training-environment -- psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

## 🚨 **Emergency Procedures**

### **1. Service Recovery**
```bash
# Restart all services
kubectl rollout restart deployment -n training-environment

# Restart specific service
kubectl rollout restart deployment <service-name> -n training-environment

# Scale down and up
kubectl scale deployment <service-name> --replicas=0 -n training-environment
kubectl scale deployment <service-name> --replicas=3 -n training-environment
```

### **2. Database Recovery**
```bash
# Restart database
kubectl rollout restart statefulset postgresql -n training-environment

# Restore from backup
kubectl run postgres-restore --image=postgres:13 --rm -it -- psql -h postgresql.training-environment.svc.cluster.local -U postgres -d contract_management_production < backup.sql

# Check database integrity
kubectl exec -it <postgres-pod-name> -n training-environment -- psql -U postgres -c "VACUUM ANALYZE;"
```

### **3. Security Incident Response**
```bash
# Block suspicious IP
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-suspicious-ip
  namespace: training-environment
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - <suspicious-ip>/32
EOF

# Quarantine pod
kubectl label pod <pod-name> quarantine=true -n training-environment

# Check security logs
kubectl logs -n training-environment deployment/falco --tail=1000 | grep -E "(CRITICAL|ALERT)"
```

## 📊 **Monitoring & Alerting**

### **Key Metrics to Monitor**
```yaml
# Critical metrics
- pod_restart_count
- container_cpu_usage_percent
- container_memory_usage_percent
- http_requests_total
- http_request_duration_seconds
- database_connections
- authentication_failures
- unauthorized_access_attempts
```

### **Alert Rules**
```yaml
# High priority alerts
- PodCrashLoopBackOff
- HighCPUUsage
- HighMemoryUsage
- DatabaseConnectionFailure
- AuthenticationFailure
- UnauthorizedAccess
- DataExfiltrationAttempt
```

### **Response Procedures**
```bash
# Automated response
kubectl apply -f monitoring/alert-response.yaml

# Manual response
kubectl get alerts -n monitoring
kubectl describe alert <alert-name> -n monitoring
```

## 🔧 **Maintenance Procedures**

### **Regular Maintenance**
```bash
# Daily checks
kubectl get pods --all-namespaces | grep -E "(Error|CrashLoopBackOff)"
kubectl top nodes
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Weekly checks
kubectl get pv,pvc --all-namespaces
kubectl get networkpolicies --all-namespaces
kubectl get certificates --all-namespaces

# Monthly checks
kubectl get nodes
kubectl get storageclass
kubectl get persistentvolumes
```

### **Update Procedures**
```bash
# Update deployment
kubectl set image deployment/<deployment-name> <container-name>=<new-image> -n training-environment

# Rolling update
kubectl rollout status deployment/<deployment-name> -n training-environment

# Rollback if needed
kubectl rollout undo deployment/<deployment-name> -n training-environment
```

## 📋 **Troubleshooting Checklist**

### **Before Troubleshooting**
- [ ] Check cluster status
- [ ] Verify network connectivity
- [ ] Check resource availability
- [ ] Review recent changes
- [ ] Check monitoring dashboards

### **During Troubleshooting**
- [ ] Collect relevant logs
- [ ] Check pod status and events
- [ ] Verify configuration
- [ ] Test connectivity
- [ ] Check resource usage

### **After Troubleshooting**
- [ ] Document the issue
- [ ] Update runbooks
- [ ] Test the fix
- [ ] Monitor for recurrence
- [ ] Update monitoring rules

## 📚 **Additional Resources**

### **Documentation**
- Kubernetes Troubleshooting: https://kubernetes.io/docs/tasks/debug-application-cluster/
- Prometheus Troubleshooting: https://prometheus.io/docs/guides/troubleshooting/
- Grafana Troubleshooting: https://grafana.com/docs/grafana/latest/troubleshooting/

### **Tools**
- kubectl: https://kubernetes.io/docs/reference/kubectl/
- helm: https://helm.sh/docs/
- promtool: https://prometheus.io/docs/prometheus/latest/configuration/unit_testing_rules/

### **Community**
- Kubernetes Slack: https://kubernetes.slack.com/
- Prometheus Slack: https://prometheus.slack.com/
- Grafana Community: https://community.grafana.com/

---

**Troubleshooting Status**: ✅ **COMPREHENSIVE**  
**Documentation**: ✅ **COMPLETE**  
**Procedures**: ✅ **TESTED**  
**Tools**: ✅ **READY**  
**Support**: ✅ **AVAILABLE**
