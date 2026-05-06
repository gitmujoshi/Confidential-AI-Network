/**
 * System Health Monitor
 * 
 * This service continuously monitors the health and performance of both
 * Ethereum and SCITT CCF systems, providing real-time status information
 * for routing decisions.
 * 
 * Key Responsibilities:
 * - Monitor system availability
 * - Track performance metrics
 * - Detect system failures
 * - Provide health status
 * - Alert on issues
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2025-01-08
 */

const db = require('../models');
const ScittCcfService = require('./scittCcfService');

class SystemHealthMonitor {
  constructor() {
    this.ethereumHealth = { 
      isHealthy: false, 
      lastCheck: null, 
      metrics: {},
      uptime: 0,
      errorCount: 0,
      successCount: 0
    };
    
    this.scittCcfHealth = { 
      isHealthy: false, 
      lastCheck: null, 
      metrics: {},
      uptime: 0,
      errorCount: 0,
      successCount: 0
    };
    
    this.checkInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000; // 30 seconds
    this.monitoringActive = false;
    this.monitoringInterval = null;
    this.startTime = Date.now();
    
    // Performance tracking
    this.performanceHistory = {
      ethereum: [],
      scittCcf: []
    };
    
    // Alert thresholds
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.1, // 10%
      consecutiveFailures: 3
    };

    // Use a real SCITT CCF probe instead of Math.random() simulation.
    // SCITT CCF can be disabled automatically in dev/test if env vars are missing.
    this.scittCcfService = new ScittCcfService();
  }

  /**
   * Start health monitoring
   */
  async startMonitoring() {
    if (this.monitoringActive) {
      console.log('⚠️  Health monitoring already active');
      return;
    }

    try {
      console.log('🔍 Starting system health monitoring...');
      
      // Perform initial health checks
      await this.checkEthereumHealth();
      await this.checkScittCcfHealth();
      
      // Start periodic monitoring
      this.monitoringInterval = setInterval(async () => {
        await this.performHealthChecks();
      }, this.checkInterval);
      
      this.monitoringActive = true;
      console.log(`✅ Health monitoring started (interval: ${this.checkInterval}ms)`);
      
    } catch (error) {
      console.error('❌ Failed to start health monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop health monitoring
   */
  async stopMonitoring() {
    if (!this.monitoringActive) {
      console.log('⚠️  Health monitoring not active');
      return;
    }

    try {
      console.log('🔄 Stopping system health monitoring...');
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      
      this.monitoringActive = false;
      console.log('✅ Health monitoring stopped');
      
    } catch (error) {
      console.error('❌ Error stopping health monitoring:', error);
    }
  }

  /**
   * Perform all health checks
   */
  async performHealthChecks() {
    try {
      await Promise.allSettled([
        this.checkEthereumHealth(),
        this.checkScittCcfHealth()
      ]);
      
      // Log health status
      this.logHealthStatus();
      
    } catch (error) {
      console.error('❌ Error during health checks:', error);
    }
  }

  /**
   * Check Ethereum system health
   */
  async checkEthereumHealth() {
    try {
      const startTime = Date.now();
      
      // Simulate Ethereum health check (replace with actual implementation)
      const isConnected = await this.simulateEthereumHealthCheck();
      const responseTime = Date.now() - startTime;
      
      // Update health status
      const wasHealthy = this.ethereumHealth.isHealthy;
      this.ethereumHealth = {
        isHealthy: isConnected,
        lastCheck: new Date(),
        metrics: {
          responseTime: responseTime,
          isConnected: isConnected,
          timestamp: new Date().toISOString()
        },
        uptime: this.calculateUptime('ethereum'),
        errorCount: isConnected ? this.ethereumHealth.errorCount : this.ethereumHealth.errorCount + 1,
        successCount: isConnected ? this.ethereumHealth.successCount + 1 : this.ethereumHealth.successCount
      };
      
      // Track performance
      this.trackPerformance('ethereum', responseTime, isConnected);
      
      // Check for alerts
      if (wasHealthy && !isConnected) {
        await this.triggerAlert('ethereum', 'SYSTEM_DOWN', 'Ethereum system became unavailable');
      } else if (!wasHealthy && isConnected) {
        await this.triggerAlert('ethereum', 'SYSTEM_RECOVERED', 'Ethereum system recovered');
      }
      
      // Store health log
      await this.storeHealthLog('ethereum', isConnected, responseTime);
      
      if (!isConnected) {
        console.warn('⚠️  Ethereum system health check failed');
      }
      
    } catch (error) {
      this.ethereumHealth = {
        isHealthy: false,
        lastCheck: new Date(),
        error: error.message,
        uptime: this.calculateUptime('ethereum'),
        errorCount: this.ethereumHealth.errorCount + 1,
        successCount: this.ethereumHealth.successCount
      };
      
      console.error('❌ Ethereum health check error:', error);
      
      // Store error log
      await this.storeHealthLog('ethereum', false, null, error.message);
    }
  }

  /**
   * Check SCITT CCF system health
   */
  async checkScittCcfHealth() {
    try {
      const startTime = Date.now();

      const health = await this.scittCcfService.getHealthStatus();
      const responseTime = Date.now() - startTime;
      const isHealthy = Boolean(health?.isHealthy);
      
      // Update health status
      const wasHealthy = this.scittCcfHealth.isHealthy;
      this.scittCcfHealth = {
        isHealthy: isHealthy,
        lastCheck: new Date(),
        metrics: {
          responseTime: responseTime,
          statusCode: health?.statusCode ?? (isHealthy ? 200 : 503),
          isEnabled: this.scittCcfService.isEnabled,
          isInitialized: health?.isInitialized ?? this.scittCcfService.isInitialized,
          error: health?.error,
          timestamp: new Date().toISOString()
        },
        uptime: this.calculateUptime('scittCcf'),
        errorCount: isHealthy ? this.scittCcfHealth.errorCount : this.scittCcfHealth.errorCount + 1,
        successCount: isHealthy ? this.scittCcfHealth.successCount + 1 : this.scittCcfHealth.successCount
      };
      
      // Track performance
      this.trackPerformance('scittCcf', responseTime, isHealthy);
      
      // Check for alerts
      if (wasHealthy && !isHealthy) {
        await this.triggerAlert('scittCcf', 'SYSTEM_DOWN', 'SCITT CCF system became unavailable');
      } else if (!wasHealthy && isHealthy) {
        await this.triggerAlert('scittCcf', 'SYSTEM_RECOVERED', 'SCITT CCF system recovered');
      }
      
      // Store health log
      await this.storeHealthLog('scittCcf', isHealthy, responseTime);
      
      if (!this.scittCcfService.isEnabled) {
        console.warn('⚠️  SCITT CCF is disabled (env/config) — health will report unavailable');
      } else if (!isHealthy) {
        console.warn('⚠️  SCITT CCF system health check failed');
      }
      
    } catch (error) {
      this.scittCcfHealth = {
        isHealthy: false,
        lastCheck: new Date(),
        error: error.message,
        uptime: this.calculateUptime('scittCcf'),
        errorCount: this.scittCcfHealth.errorCount + 1,
        successCount: this.scittCcfHealth.successCount
      };
      
      console.error('❌ SCITT CCF health check error:', error);
      
      // Store error log
      await this.storeHealthLog('scittCcf', false, null, error.message);
    }
  }

  /**
   * Simulate Ethereum health check (replace with actual implementation)
   */
  async simulateEthereumHealthCheck() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // Simulate occasional failures (5% failure rate)
    return Math.random() > 0.05;
  }

  // NOTE: simulateScittCcfHealthCheck() removed — health must be deterministic and reflect real SCITT status.

  /**
   * Calculate system uptime
   */
  calculateUptime(systemName) {
    const health = systemName === 'ethereum' ? this.ethereumHealth : this.scittCcfHealth;
    
    if (health.successCount === 0 && health.errorCount === 0) {
      return 0;
    }
    
    const totalChecks = health.successCount + health.errorCount;
    return (health.successCount / totalChecks) * 100;
  }

  /**
   * Track performance metrics
   */
  trackPerformance(systemName, responseTime, isHealthy) {
    const performance = {
      timestamp: new Date(),
      responseTime: responseTime,
      isHealthy: isHealthy
    };
    
    this.performanceHistory[systemName].push(performance);
    
    // Keep only last 100 entries
    if (this.performanceHistory[systemName].length > 100) {
      this.performanceHistory[systemName] = this.performanceHistory[systemName].slice(-100);
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    return {
      ethereum: this.ethereumHealth,
      scittCcf: this.scittCcfHealth,
      overall: this.ethereumHealth.isHealthy || this.scittCcfHealth.isHealthy,
      monitoringActive: this.monitoringActive,
      uptime: {
        ethereum: this.ethereumHealth.uptime,
        scittCcf: this.scittCcfHealth.uptime
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get detailed system metrics
   */
  async getDetailedMetrics() {
    try {
      const ethereumMetrics = await this.calculateDetailedMetrics('ethereum');
      const scittCcfMetrics = await this.calculateDetailedMetrics('scittCcf');
      
      return {
        ethereum: {
          ...this.ethereumHealth,
          ...ethereumMetrics
        },
        scittCcf: {
          ...this.scittCcfHealth,
          ...scittCcfMetrics
        },
        overall: {
          monitoringActive: this.monitoringActive,
          totalUptime: (this.ethereumHealth.uptime + this.scittCcfHealth.uptime) / 2,
          startTime: this.startTime
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to get detailed metrics:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate detailed metrics for a system
   */
  async calculateDetailedMetrics(systemName) {
    const performance = this.performanceHistory[systemName];
    
    if (performance.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        totalRequests: 0,
        successRate: 0
      };
    }
    
    const responseTimes = performance.map(p => p.responseTime);
    const healthyRequests = performance.filter(p => p.isHealthy).length;
    
    return {
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      totalRequests: performance.length,
      successRate: (healthyRequests / performance.length) * 100
    };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(systemName, limit = 50) {
    const performance = this.performanceHistory[systemName] || [];
    return performance.slice(-limit);
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(systemName, alertType, message) {
    try {
      console.log(`🚨 ALERT [${systemName}]: ${alertType} - ${message}`);
      
      // Store alert in database
      await this.storeAlert(systemName, alertType, message);
      
      // TODO: Implement actual alerting (email, Slack, etc.)
      
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  /**
   * Store health log in database
   */
  async storeHealthLog(systemName, healthStatus, responseTime, errorMessage = null) {
    try {
      await db.SystemHealthLog.create({
        systemName: systemName,
        healthStatus: healthStatus,
        responseTime: responseTime,
        errorMessage: errorMessage,
        metrics: {
          timestamp: new Date().toISOString(),
          uptime: this.calculateUptime(systemName)
        }
      });
      
    } catch (error) {
      console.error('Failed to store health log:', error);
    }
  }

  /**
   * Store alert in database
   */
  async storeAlert(systemName, alertType, message) {
    try {
      // This would store alerts in a separate alerts table
      // For now, just log to console
      console.log(`Alert stored: ${systemName} - ${alertType} - ${message}`);
      
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  /**
   * Log current health status
   */
  logHealthStatus() {
    const ethereumStatus = this.ethereumHealth.isHealthy ? '✅' : '❌';
    const scittCcfStatus = this.scittCcfHealth.isHealthy ? '✅' : '❌';
    
    console.log(`🔍 Health Status - Ethereum: ${ethereumStatus} SCITT CCF: ${scittCcfStatus}`);
  }

  /**
   * Reset health counters
   */
  resetHealthCounters() {
    this.ethereumHealth.errorCount = 0;
    this.ethereumHealth.successCount = 0;
    this.scittCcfHealth.errorCount = 0;
    this.scittCcfHealth.successCount = 0;
    
    console.log('🔄 Health counters reset');
  }

  /**
   * Update alert thresholds
   */
  updateAlertThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    console.log('🔧 Alert thresholds updated:', this.alertThresholds);
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig() {
    return {
      checkInterval: this.checkInterval,
      monitoringActive: this.monitoringActive,
      alertThresholds: this.alertThresholds,
      startTime: this.startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    try {
      console.log('🔄 Shutting down System Health Monitor...');
      
      await this.stopMonitoring();
      
      // Clear performance history
      this.performanceHistory = {
        ethereum: [],
        scittCcf: []
      };
      
      console.log('✅ System Health Monitor shut down successfully');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

module.exports = SystemHealthMonitor;
