# Production Monitoring Guide

## 📊 **Complete Monitoring Setup for AI Model Training Environment**

This guide provides comprehensive monitoring setup for the production AI model training environment.

## 🎯 **Monitoring Architecture**

### **Monitoring Stack**
```
Prometheus (Metrics Collection)
    ↓
Grafana (Dashboards & Visualization)
    ↓
AlertManager (Alerting)
    ↓
ELK Stack (Logging)
    ↓
Jaeger (Distributed Tracing)
```

## 🔧 **Step 1: Deploy Monitoring Stack**

### **1.1 Deploy Prometheus**
```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Deploy Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=***REMOVED-KEYCLOAK_ADMIN_PASSWORD*** \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
  --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi
```

### **1.2 Deploy ELK Stack**
```bash
# Add Helm repository
helm repo add elastic https://helm.elastic.co
helm repo update

# Deploy Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace \
  --set replicas=3 \
  --set volumeClaimTemplate.resources.requests.storage=100Gi \
  --set esJavaOpts="-Xms2g -Xmx2g"

# Deploy Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --set replicas=1 \
  --set service.type=LoadBalancer

# Deploy Logstash
helm install logstash elastic/logstash \
  --namespace logging \
  --set replicas=2
```

### **1.3 Deploy Jaeger**
```bash
# Add Helm repository
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update

# Deploy Jaeger
helm install jaeger jaegertracing/jaeger \
  --namespace tracing \
  --create-namespace \
  --set storage.type=elasticsearch \
  --set storage.elasticsearch.host=elasticsearch-master.logging.svc.cluster.local
```

## 📈 **Step 2: Configure Application Metrics**

### **2.1 Add Prometheus Metrics to Application**
```javascript
// backend/middleware/metrics.js
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const trainingJobsTotal = new promClient.Counter({
  name: 'training_jobs_total',
  help: 'Total number of training jobs',
  labelNames: ['status', 'type']
});

const trainingJobDuration = new promClient.Histogram({
  name: 'training_job_duration_seconds',
  help: 'Duration of training jobs in seconds',
  labelNames: ['type', 'status']
});

const activeTrainingJobs = new promClient.Gauge({
  name: 'active_training_jobs',
  help: 'Number of active training jobs'
});

const privacyBudgetUsage = new promClient.Gauge({
  name: 'privacy_budget_usage',
  help: 'Privacy budget usage percentage',
  labelNames: ['user_id', 'dataset_id']
});

// Register metrics
promClient.register.registerMetric(httpRequestDuration);
promClient.register.registerMetric(httpRequestTotal);
promClient.register.registerMetric(trainingJobsTotal);
promClient.register.registerMetric(trainingJobDuration);
promClient.register.registerMetric(activeTrainingJobs);
promClient.register.registerMetric(privacyBudgetUsage);

module.exports = {
  httpRequestDuration,
  httpRequestTotal,
  trainingJobsTotal,
  trainingJobDuration,
  activeTrainingJobs,
  privacyBudgetUsage,
  register: promClient.register
};
```

### **2.2 Add Metrics Middleware**
```javascript
// backend/middleware/metricsMiddleware.js
const { httpRequestDuration, httpRequestTotal } = require('./metrics');

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });
  
  next();
};

module.exports = metricsMiddleware;
```

### **2.3 Add Metrics Endpoint**
```javascript
// backend/routes/metrics.js
const express = require('express');
const { register } = require('../middleware/metrics');
const router = express.Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;
```

## 📊 **Step 3: Create Grafana Dashboards**

### **3.1 AI Training Overview Dashboard**
```json
{
  "dashboard": {
    "title": "AI Training Environment Overview",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Training Jobs",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(training_jobs_total[5m])",
            "legendFormat": "{{status}} {{type}}"
          }
        ]
      },
      {
        "title": "Active Training Jobs",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_training_jobs"
          }
        ]
      },
      {
        "title": "Privacy Budget Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "privacy_budget_usage",
            "legendFormat": "{{user_id}}/{{dataset_id}}"
          }
        ]
      }
    ]
  }
}
```

### **3.2 System Resources Dashboard**
```json
{
  "dashboard": {
    "title": "System Resources",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total[5m]) * 100",
            "legendFormat": "{{pod}}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes / container_spec_memory_limit_bytes * 100",
            "legendFormat": "{{pod}}"
          }
        ]
      },
      {
        "title": "Disk Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_fs_usage_bytes / container_fs_limit_bytes * 100",
            "legendFormat": "{{pod}}"
          }
        ]
      },
      {
        "title": "Network I/O",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_network_receive_bytes_total[5m])",
            "legendFormat": "{{pod}} receive"
          },
          {
            "expr": "rate(container_network_transmit_bytes_total[5m])",
            "legendFormat": "{{pod}} transmit"
          }
        ]
      }
    ]
  }
}
```

## 🚨 **Step 4: Configure Alerting**

### **4.1 Prometheus Alert Rules**
```yaml
# monitoring/alert-rules.yaml
groups:
- name: ai-training-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"
  
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }} seconds"
  
  - alert: TrainingJobFailure
    expr: rate(training_jobs_total{status="failed"}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Training job failure rate high"
      description: "Training job failure rate is {{ $value }} failures per second"
  
  - alert: HighCPUUsage
    expr: rate(container_cpu_usage_seconds_total[5m]) * 100 > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is {{ $value }}%"
  
  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes * 100 > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is {{ $value }}%"
  
  - alert: PrivacyBudgetExceeded
    expr: privacy_budget_usage > 90
    for: 1m
    labels:
      severity: warning
    annotations:
      summary: "Privacy budget nearly exceeded"
      description: "Privacy budget usage is {{ $value }}% for {{ $labels.user_id }}/{{ $labels.dataset_id }}"
```

### **4.2 AlertManager Configuration**
```yaml
# monitoring/alertmanager-config.yaml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@example.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://webhook.example.com/alerts'
    send_resolved: true

- name: 'email'
  email_configs:
  - to: 'admin@example.com'
    subject: 'AI Training Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

- name: 'slack'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
    title: 'AI Training Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## 📝 **Step 5: Configure Logging**

### **5.1 Application Logging**
```javascript
// backend/utils/logger.js
const winston = require('winston');
const { createLogger, format, transports } = winston;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'ai-training-api' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Add request ID to logs
logger.add(new transports.Console({
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${JSON.stringify(meta)}`;
    })
  )
}));

module.exports = logger;
```

### **5.2 Logstash Configuration**
```ruby
# monitoring/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "ai-training" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{LOGLEVEL:level}\]: %{GREEDYDATA:message}" }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    mutate {
      add_field => { "service" => "ai-training-api" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch-master.logging.svc.cluster.local:9200"]
    index => "ai-training-logs-%{+YYYY.MM.dd}"
  }
}
```

## 🔍 **Step 6: Configure Distributed Tracing**

### **6.1 Add Jaeger to Application**
```javascript
// backend/utils/tracing.js
const jaeger = require('jaeger-client');
const opentracing = require('opentracing');

const config = {
  serviceName: 'ai-training-api',
  sampler: {
    type: 'const',
    param: 1,
  },
  reporter: {
    logSpans: true,
    agentHost: process.env.JAEGER_AGENT_HOST || 'jaeger-agent.tracing.svc.cluster.local',
    agentPort: process.env.JAEGER_AGENT_PORT || 6832,
  },
};

const options = {
  tags: {
    'ai-training.version': '1.0.0',
  },
};

const tracer = jaeger.initTracer(config, options);
opentracing.initGlobalTracer(tracer);

module.exports = tracer;
```

### **6.2 Add Tracing Middleware**
```javascript
// backend/middleware/tracingMiddleware.js
const tracer = require('../utils/tracing');

const tracingMiddleware = (req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  
  req.span = span;
  
  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode);
    span.finish();
  });
  
  next();
};

module.exports = tracingMiddleware;
```

## 📊 **Step 7: Create Custom Dashboards**

### **7.1 Training Performance Dashboard**
```json
{
  "dashboard": {
    "title": "Training Performance",
    "panels": [
      {
        "title": "Training Job Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(training_jobs_total{status=\"completed\"}[5m]) / rate(training_jobs_total[5m]) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "title": "Average Training Duration",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(training_job_duration_seconds_bucket[5m]))",
            "legendFormat": "Median Duration (s)"
          }
        ]
      },
      {
        "title": "Training Jobs by Type",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (type) (training_jobs_total)",
            "legendFormat": "{{type}}"
          }
        ]
      }
    ]
  }
}
```

### **7.2 Security Dashboard**
```json
{
  "dashboard": {
    "title": "Security Monitoring",
    "panels": [
      {
        "title": "Authentication Failures",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(auth_failures_total[5m])",
            "legendFormat": "Auth Failures/sec"
          }
        ]
      },
      {
        "title": "Privacy Budget Usage",
        "type": "gauge",
        "targets": [
          {
            "expr": "privacy_budget_usage",
            "legendFormat": "{{user_id}}/{{dataset_id}}"
          }
        ]
      },
      {
        "title": "Data Access Violations",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(data_access_violations_total[5m])",
            "legendFormat": "Violations/sec"
          }
        ]
      }
    ]
  }
}
```

## 🚀 **Step 8: Deploy Monitoring**

### **8.1 Deploy All Monitoring Components**
```bash
# Deploy Prometheus with alert rules
kubectl apply -f monitoring/alert-rules.yaml -n monitoring

# Deploy AlertManager
kubectl apply -f monitoring/alertmanager-config.yaml -n monitoring

# Deploy Logstash
kubectl apply -f monitoring/logstash.conf -n logging

# Deploy Jaeger
kubectl apply -f monitoring/jaeger-config.yaml -n tracing
```

### **8.2 Import Grafana Dashboards**
```bash
# Import dashboards
curl -X POST \
  http://admin:***REMOVED-KEYCLOAK_ADMIN_PASSWORD***@grafana.monitoring.svc.cluster.local:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/dashboards/ai-training-overview.json

curl -X POST \
  http://admin:***REMOVED-KEYCLOAK_ADMIN_PASSWORD***@grafana.monitoring.svc.cluster.local:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/dashboards/training-performance.json
```

## 📋 **Step 9: Monitoring Checklist**

### **Pre-Deployment**
- [ ] Prometheus configured with retention policy
- [ ] Alert rules defined and tested
- [ ] Grafana dashboards created
- [ ] ELK stack configured
- [ ] Jaeger tracing setup
- [ ] Application metrics implemented
- [ ] Logging configuration complete

### **Post-Deployment**
- [ ] All metrics flowing to Prometheus
- [ ] Dashboards displaying data correctly
- [ ] Alerts firing appropriately
- [ ] Logs being collected and indexed
- [ ] Traces being generated
- [ ] Performance baselines established
- [ ] Alert notifications working

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Metrics not appearing**: Check Prometheus targets and service discovery
2. **Dashboards empty**: Verify metric names and queries
3. **Alerts not firing**: Check AlertManager configuration and rules
4. **Logs not appearing**: Verify Logstash configuration and Elasticsearch connectivity
5. **Traces missing**: Check Jaeger agent connectivity and sampling configuration

### **Debug Commands**
```bash
# Check Prometheus targets
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring
# Open http://localhost:9090/targets

# Check Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
# Open http://localhost:3000 (admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***)

# Check Elasticsearch
kubectl port-forward svc/elasticsearch-master 9200:9200 -n logging
curl http://localhost:9200/_cluster/health

# Check Jaeger
kubectl port-forward svc/jaeger-query 16686:80 -n tracing
# Open http://localhost:16686
```

## 📚 **Additional Resources**

- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **ELK Stack Documentation**: https://www.elastic.co/guide/
- **Jaeger Documentation**: https://www.jaegertracing.io/docs/
- **Kubernetes Monitoring**: https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/

---

**Monitoring Status**: ✅ **COMPREHENSIVE**  
**Alerting**: ✅ **CONFIGURED**  
**Logging**: ✅ **CENTRALIZED**  
**Tracing**: ✅ **DISTRIBUTED**  
**Dashboards**: ✅ **CUSTOMIZED**
