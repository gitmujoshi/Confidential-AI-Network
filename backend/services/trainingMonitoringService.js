/**
 * Training Monitoring Service
 * 
 * Handles real-time monitoring of training jobs including progress tracking,
 * performance metrics, compliance monitoring, and alerting.
 */

const { EventEmitter } = require('events');

class TrainingMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.activeMonitors = new Map();
    this.monitoringIntervals = new Map();
    this.alertThresholds = {
      progress: {
        stalled: 300000, // 5 minutes without progress
        slow: 0.1 // Less than 10% progress per hour
      },
      performance: {
        highCpu: 90, // 90% CPU usage
        highMemory: 90, // 90% memory usage
        lowDiskSpace: 10 // Less than 10% disk space remaining
      },
      compliance: {
        dataAccess: true, // Monitor data access compliance
        privacy: true, // Monitor privacy compliance
        security: true // Monitor security compliance
      }
    };
  }

  /**
   * Start monitoring a training job
   * @param {Object} trainingJob - Training job to monitor
   */
  async startMonitoring(trainingJob) {
    try {
      console.log(`📊 Starting monitoring for training job: ${trainingJob.jobId}`);
      
      // Create monitoring configuration
      const monitoringConfig = {
        jobId: trainingJob.jobId,
        contractId: trainingJob.contractId,
        environmentId: trainingJob.environmentId,
        containerId: trainingJob.containerId,
        startTime: new Date(),
        lastProgressUpdate: new Date(),
        progressHistory: [],
        performanceHistory: [],
        complianceHistory: [],
        alerts: []
      };
      
      // Store monitoring configuration
      this.activeMonitors.set(trainingJob.jobId, monitoringConfig);
      
      // Start monitoring intervals
      await this.startProgressMonitoring(trainingJob.jobId);
      await this.startPerformanceMonitoring(trainingJob.jobId);
      await this.startComplianceMonitoring(trainingJob.jobId);
      
      // Emit monitoring started event
      this.emit('monitoringStarted', {
        jobId: trainingJob.jobId,
        contractId: trainingJob.contractId,
        timestamp: new Date()
      });
      
      console.log(`✅ Monitoring started for job: ${trainingJob.jobId}`);
      
    } catch (error) {
      console.error(`❌ Failed to start monitoring for job: ${trainingJob.jobId}`, error);
      throw error;
    }
  }

  /**
   * Stop monitoring a training job
   * @param {string} jobId - Job ID
   */
  async stopMonitoring(jobId) {
    try {
      console.log(`🛑 Stopping monitoring for job: ${jobId}`);
      
      // Clear monitoring intervals
      const progressInterval = this.monitoringIntervals.get(`${jobId}_progress`);
      const performanceInterval = this.monitoringIntervals.get(`${jobId}_performance`);
      const complianceInterval = this.monitoringIntervals.get(`${jobId}_compliance`);
      
      if (progressInterval) clearInterval(progressInterval);
      if (performanceInterval) clearInterval(performanceInterval);
      if (complianceInterval) clearInterval(complianceInterval);
      
      // Remove from active monitors
      this.activeMonitors.delete(jobId);
      
      // Emit monitoring stopped event
      this.emit('monitoringStopped', {
        jobId,
        timestamp: new Date()
      });
      
      console.log(`✅ Monitoring stopped for job: ${jobId}`);
      
    } catch (error) {
      console.error(`❌ Failed to stop monitoring for job: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Start progress monitoring
   * @param {string} jobId - Job ID
   */
  async startProgressMonitoring(jobId) {
    const interval = setInterval(async () => {
      try {
        await this.checkProgress(jobId);
      } catch (error) {
        console.error(`❌ Progress monitoring error for job: ${jobId}`, error);
      }
    }, 30000); // Check every 30 seconds
    
    this.monitoringIntervals.set(`${jobId}_progress`, interval);
  }

  /**
   * Start performance monitoring
   * @param {string} jobId - Job ID
   */
  async startPerformanceMonitoring(jobId) {
    const interval = setInterval(async () => {
      try {
        await this.checkPerformance(jobId);
      } catch (error) {
        console.error(`❌ Performance monitoring error for job: ${jobId}`, error);
      }
    }, 60000); // Check every minute
    
    this.monitoringIntervals.set(`${jobId}_performance`, interval);
  }

  /**
   * Start compliance monitoring
   * @param {string} jobId - Job ID
   */
  async startComplianceMonitoring(jobId) {
    const interval = setInterval(async () => {
      try {
        await this.checkCompliance(jobId);
      } catch (error) {
        console.error(`❌ Compliance monitoring error for job: ${jobId}`, error);
      }
    }, 120000); // Check every 2 minutes
    
    this.monitoringIntervals.set(`${jobId}_compliance`, interval);
  }

  /**
   * Check training progress
   * @param {string} jobId - Job ID
   */
  async checkProgress(jobId) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) return;
    
    try {
      // Get current progress from training container
      const progress = await this.getTrainingProgress(jobId);
      
      // Update progress history
      monitor.progressHistory.push({
        timestamp: new Date(),
        progress: progress
      });
      
      // Keep only last 100 progress updates
      if (monitor.progressHistory.length > 100) {
        monitor.progressHistory = monitor.progressHistory.slice(-100);
      }
      
      // Check for stalled training
      await this.checkStalledTraining(jobId, progress);
      
      // Check for slow progress
      await this.checkSlowProgress(jobId, progress);
      
      // Emit progress update event
      this.emit('progressUpdate', {
        jobId,
        progress,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`❌ Progress check failed for job: ${jobId}`, error);
    }
  }

  /**
   * Check training performance
   * @param {string} jobId - Job ID
   */
  async checkPerformance(jobId) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) return;
    
    try {
      // Get current performance metrics
      const performance = await this.getPerformanceMetrics(jobId);
      
      // Update performance history
      monitor.performanceHistory.push({
        timestamp: new Date(),
        performance: performance
      });
      
      // Keep only last 50 performance updates
      if (monitor.performanceHistory.length > 50) {
        monitor.performanceHistory = monitor.performanceHistory.slice(-50);
      }
      
      // Check performance thresholds
      await this.checkPerformanceThresholds(jobId, performance);
      
      // Emit performance update event
      this.emit('performanceUpdate', {
        jobId,
        performance,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`❌ Performance check failed for job: ${jobId}`, error);
    }
  }

  /**
   * Check compliance
   * @param {string} jobId - Job ID
   */
  async checkCompliance(jobId) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) return;
    
    try {
      // Get compliance status
      const compliance = await this.getComplianceStatus(jobId);
      
      // Update compliance history
      monitor.complianceHistory.push({
        timestamp: new Date(),
        compliance: compliance
      });
      
      // Keep only last 25 compliance updates
      if (monitor.complianceHistory.length > 25) {
        monitor.complianceHistory = monitor.complianceHistory.slice(-25);
      }
      
      // Check compliance violations
      await this.checkComplianceViolations(jobId, compliance);
      
      // Emit compliance update event
      this.emit('complianceUpdate', {
        jobId,
        compliance,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`❌ Compliance check failed for job: ${jobId}`, error);
    }
  }

  /**
   * Get training progress from container
   * @param {string} jobId - Job ID
   * @returns {Object} Training progress
   */
  async getTrainingProgress(jobId) {
    // Mock implementation - in real implementation, this would:
    // 1. Query the training container for current progress
    // 2. Parse progress data from logs or API
    // 3. Calculate progress percentage and metrics
    
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) {
      throw new Error(`Monitor not found for job: ${jobId}`);
    }
    
    // Simulate progress based on time elapsed
    const elapsed = Date.now() - monitor.startTime.getTime();
    const estimatedDuration = 30 * 60 * 1000; // 30 minutes
    const progressPercentage = Math.min((elapsed / estimatedDuration) * 100, 100);
    
    return {
      percentage: Math.round(progressPercentage * 100) / 100,
      currentEpoch: Math.floor(progressPercentage / 10),
      totalEpochs: 10,
      currentLoss: Math.max(1.0 - (progressPercentage / 100), 0.1),
      validationAccuracy: Math.min(progressPercentage / 100, 0.95),
      estimatedTimeRemaining: Math.max(estimatedDuration - elapsed, 0),
      lastUpdate: new Date()
    };
  }

  /**
   * Get performance metrics from container
   * @param {string} jobId - Job ID
   * @returns {Object} Performance metrics
   */
  async getPerformanceMetrics(jobId) {
    // Mock implementation - in real implementation, this would:
    // 1. Query container metrics from cloud provider
    // 2. Get CPU, memory, disk, network usage
    // 3. Calculate performance indicators
    
    return {
      cpu: {
        usage: Math.random() * 100,
        cores: 2,
        load: Math.random() * 2
      },
      memory: {
        usage: Math.random() * 100,
        total: 4096, // 4GB
        available: Math.random() * 4096
      },
      disk: {
        usage: Math.random() * 100,
        total: 50000, // 50GB
        available: Math.random() * 50000
      },
      network: {
        bytesIn: Math.random() * 1000000,
        bytesOut: Math.random() * 1000000,
        packetsIn: Math.random() * 10000,
        packetsOut: Math.random() * 10000
      },
      gpu: {
        usage: Math.random() * 100,
        memory: Math.random() * 100,
        temperature: 45 + Math.random() * 20
      }
    };
  }

  /**
   * Get compliance status
   * @param {string} jobId - Job ID
   * @returns {Object} Compliance status
   */
  async getComplianceStatus(jobId) {
    // Mock implementation - in real implementation, this would:
    // 1. Check data access logs
    // 2. Verify privacy compliance
    // 3. Check security policies
    // 4. Validate audit requirements
    
    return {
      dataAccess: {
        compliant: true,
        violations: [],
        lastCheck: new Date()
      },
      privacy: {
        compliant: true,
        techniques: ['differential_privacy', 'data_anonymization'],
        violations: [],
        lastCheck: new Date()
      },
      security: {
        compliant: true,
        encryption: 'AES-256-GCM',
        accessControl: 'enforced',
        violations: [],
        lastCheck: new Date()
      },
      audit: {
        compliant: true,
        logsGenerated: true,
        retentionPolicy: 'compliant',
        violations: [],
        lastCheck: new Date()
      }
    };
  }

  /**
   * Check for stalled training
   * @param {string} jobId - Job ID
   * @param {Object} progress - Current progress
   */
  async checkStalledTraining(jobId, progress) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) return;
    
    const timeSinceLastUpdate = Date.now() - monitor.lastProgressUpdate.getTime();
    const stalledThreshold = this.alertThresholds.progress.stalled;
    
    if (timeSinceLastUpdate > stalledThreshold) {
      const alert = {
        type: 'TRAINING_STALLED',
        severity: 'HIGH',
        message: `Training appears to be stalled for ${Math.round(timeSinceLastUpdate / 1000)} seconds`,
        timestamp: new Date(),
        jobId,
        details: {
          timeSinceLastUpdate,
          currentProgress: progress.percentage
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
      
      console.warn(`⚠️ Training stalled alert for job: ${jobId}`);
    }
  }

  /**
   * Check for slow progress
   * @param {string} jobId - Job ID
   * @param {Object} progress - Current progress
   */
  async checkSlowProgress(jobId, progress) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) return;
    
    if (monitor.progressHistory.length < 2) return;
    
    const recentProgress = monitor.progressHistory.slice(-2);
    const progressDelta = recentProgress[1].progress.percentage - recentProgress[0].progress.percentage;
    const timeDelta = recentProgress[1].timestamp.getTime() - recentProgress[0].timestamp.getTime();
    const progressRate = progressDelta / (timeDelta / 1000 / 60 / 60); // Progress per hour
    
    const slowThreshold = this.alertThresholds.progress.slow;
    
    if (progressRate < slowThreshold) {
      const alert = {
        type: 'SLOW_PROGRESS',
        severity: 'MEDIUM',
        message: `Training progress is slow: ${progressRate.toFixed(2)}% per hour`,
        timestamp: new Date(),
        jobId,
        details: {
          progressRate,
          currentProgress: progress.percentage
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
      
      console.warn(`⚠️ Slow progress alert for job: ${jobId}`);
    }
  }

  /**
   * Check performance thresholds
   * @param {string} jobId - Job ID
   * @param {Object} performance - Current performance
   */
  async checkPerformanceThresholds(jobId, performance) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) return;
    
    // Check CPU usage
    if (performance.cpu.usage > this.alertThresholds.performance.highCpu) {
      const alert = {
        type: 'HIGH_CPU_USAGE',
        severity: 'MEDIUM',
        message: `High CPU usage: ${performance.cpu.usage.toFixed(1)}%`,
        timestamp: new Date(),
        jobId,
        details: {
          cpuUsage: performance.cpu.usage,
          threshold: this.alertThresholds.performance.highCpu
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
    }
    
    // Check memory usage
    if (performance.memory.usage > this.alertThresholds.performance.highMemory) {
      const alert = {
        type: 'HIGH_MEMORY_USAGE',
        severity: 'HIGH',
        message: `High memory usage: ${performance.memory.usage.toFixed(1)}%`,
        timestamp: new Date(),
        jobId,
        details: {
          memoryUsage: performance.memory.usage,
          threshold: this.alertThresholds.performance.highMemory
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
    }
    
    // Check disk space
    if (performance.disk.usage > (100 - this.alertThresholds.performance.lowDiskSpace)) {
      const alert = {
        type: 'LOW_DISK_SPACE',
        severity: 'HIGH',
        message: `Low disk space: ${(100 - performance.disk.usage).toFixed(1)}% remaining`,
        timestamp: new Date(),
        jobId,
        details: {
          diskUsage: performance.disk.usage,
          availableSpace: 100 - performance.disk.usage
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
    }
  }

  /**
   * Check compliance violations
   * @param {string} jobId - Job ID
   * @param {Object} compliance - Current compliance status
   */
  async checkComplianceViolations(jobId, compliance) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) return;
    
    // Check data access compliance
    if (!compliance.dataAccess.compliant) {
      const alert = {
        type: 'DATA_ACCESS_VIOLATION',
        severity: 'HIGH',
        message: 'Data access compliance violation detected',
        timestamp: new Date(),
        jobId,
        details: {
          violations: compliance.dataAccess.violations
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
    }
    
    // Check privacy compliance
    if (!compliance.privacy.compliant) {
      const alert = {
        type: 'PRIVACY_VIOLATION',
        severity: 'CRITICAL',
        message: 'Privacy compliance violation detected',
        timestamp: new Date(),
        jobId,
        details: {
          violations: compliance.privacy.violations
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
    }
    
    // Check security compliance
    if (!compliance.security.compliant) {
      const alert = {
        type: 'SECURITY_VIOLATION',
        severity: 'CRITICAL',
        message: 'Security compliance violation detected',
        timestamp: new Date(),
        jobId,
        details: {
          violations: compliance.security.violations
        }
      };
      
      monitor.alerts.push(alert);
      this.emit('alert', alert);
    }
  }

  /**
   * Get job progress
   * @param {string} jobId - Job ID
   * @returns {Object} Job progress
   */
  async getJobProgress(jobId) {
    const monitor = this.activeMonitors.get(jobId);
    if (!monitor) {
      throw new Error(`Monitor not found for job: ${jobId}`);
    }
    
    const latestProgress = monitor.progressHistory[monitor.progressHistory.length - 1];
    const latestPerformance = monitor.performanceHistory[monitor.performanceHistory.length - 1];
    const latestCompliance = monitor.complianceHistory[monitor.complianceHistory.length - 1];
    
    return {
      jobId,
      progress: latestProgress?.progress || null,
      performance: latestPerformance?.performance || null,
      compliance: latestCompliance?.compliance || null,
      alerts: monitor.alerts.slice(-10), // Last 10 alerts
      monitoringStartTime: monitor.startTime,
      lastUpdate: new Date()
    };
  }

  /**
   * Get all active monitors
   * @returns {Array} List of active monitors
   */
  getAllActiveMonitors() {
    return Array.from(this.activeMonitors.values());
  }

  /**
   * Get monitoring statistics
   * @returns {Object} Monitoring statistics
   */
  getMonitoringStatistics() {
    const activeMonitors = this.getAllActiveMonitors();
    
    return {
      totalActiveMonitors: activeMonitors.length,
      totalAlerts: activeMonitors.reduce((sum, monitor) => sum + monitor.alerts.length, 0),
      alertsByType: this.getAlertsByType(activeMonitors),
      averageProgress: this.getAverageProgress(activeMonitors),
      complianceStatus: this.getOverallComplianceStatus(activeMonitors)
    };
  }

  /**
   * Get alerts by type
   * @param {Array} monitors - Active monitors
   * @returns {Object} Alerts grouped by type
   */
  getAlertsByType(monitors) {
    const alertsByType = {};
    
    monitors.forEach(monitor => {
      monitor.alerts.forEach(alert => {
        if (!alertsByType[alert.type]) {
          alertsByType[alert.type] = 0;
        }
        alertsByType[alert.type]++;
      });
    });
    
    return alertsByType;
  }

  /**
   * Get average progress across all monitors
   * @param {Array} monitors - Active monitors
   * @returns {number} Average progress percentage
   */
  getAverageProgress(monitors) {
    const progressValues = monitors
      .map(monitor => monitor.progressHistory[monitor.progressHistory.length - 1])
      .filter(progress => progress)
      .map(progress => progress.progress.percentage);
    
    if (progressValues.length === 0) return 0;
    
    return progressValues.reduce((sum, progress) => sum + progress, 0) / progressValues.length;
  }

  /**
   * Get overall compliance status
   * @param {Array} monitors - Active monitors
   * @returns {Object} Overall compliance status
   */
  getOverallComplianceStatus(monitors) {
    const complianceStatuses = monitors
      .map(monitor => monitor.complianceHistory[monitor.complianceHistory.length - 1])
      .filter(compliance => compliance)
      .map(compliance => compliance.compliance);
    
    if (complianceStatuses.length === 0) {
      return { dataAccess: true, privacy: true, security: true, audit: true };
    }
    
    return {
      dataAccess: complianceStatuses.every(status => status.dataAccess.compliant),
      privacy: complianceStatuses.every(status => status.privacy.compliant),
      security: complianceStatuses.every(status => status.security.compliant),
      audit: complianceStatuses.every(status => status.audit.compliant)
    };
  }
}

module.exports = TrainingMonitoringService;
