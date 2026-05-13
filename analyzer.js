/**
 * Alert Analysis Engine
 * Analyzes alerts and correlates with historical incidents
 */

const similarity = require('./similarity.js');

class Analyzer {
  constructor(incidents) {
    this.incidents = incidents;
    this.commonActions = [
      'Check service logs for error patterns',
      'Verify infrastructure health status',
      'Review resource utilization metrics',
      'Execute automated remediation procedures',
      'Notify on-call engineering team'
    ];
  }

  /**
   * Find top N similar incidents
   * @param {object} alert - Alert to analyze
   * @param {number} topN - Number of top results (default 3)
   * @returns {array} - Top similar incidents with scores
   */
  findSimilarIncidents(alert, topN = 3) {
    const scored = this.incidents.map(incident => ({
      ...incident,
      similarityScore: similarity.calculateWeightedSimilarity(alert, incident)
    }));

    return scored
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topN);
  }

  /**
   * Extract likely root cause from similar incidents
   * @param {array} similarIncidents - Similar incidents array
   * @returns {string} - Most likely root cause
   */
  extractRootCause(similarIncidents) {
    if (similarIncidents.length === 0) {
      return 'Unknown - insufficient historical data';
    }

    // Weight root causes by similarity score
    const rootCauseMap = {};
    let totalScore = 0;

    similarIncidents.forEach(incident => {
      const cause = incident.root_cause;
      rootCauseMap[cause] = (rootCauseMap[cause] || 0) + incident.similarityScore;
      totalScore += incident.similarityScore;
    });

    // Find highest weighted root cause
    let topCause = Object.entries(rootCauseMap)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];

    return topCause ? topCause[0] : 'Unknown root cause';
  }

  /**
   * Calculate confidence score
   * @param {array} similarIncidents - Similar incidents array
   * @returns {number} - Confidence 0-100
   */
  calculateConfidence(similarIncidents) {
    if (similarIncidents.length === 0) return 0;
    
    const avgScore = similarIncidents.reduce((sum, inc) => sum + inc.similarityScore, 0) / similarIncidents.length;
    return Math.round(avgScore);
  }

  /**
   * Generate suggested actions
   * @param {array} similarIncidents - Similar incidents array
   * @param {object} alert - Original alert
   * @returns {array} - Suggested actions
   */
  generateActions(similarIncidents, alert) {
    const actions = new Set();

    // Add actions from similar incidents
    similarIncidents.forEach(incident => {
      if (incident.closure_notes) {
        const steps = incident.closure_notes
          .split(/[,;.]/)
          .map(s => s.trim())
          .filter(s => s.length > 10);
        
        steps.forEach(step => actions.add(step));
      }
    });

    // Add common actions for severity level
    if (alert.severity.toLowerCase() === 'critical') {
      actions.add('Escalate to on-call senior engineer immediately');
      actions.add('Start incident commander bridge call');
    }

    // Convert to array and limit to 5
    return Array.from(actions).slice(0, 5);
  }

  /**
   * Comprehensive alert analysis
   * @param {object} alert - Alert object to analyze
   * @returns {object} - Complete analysis results
   */
  analyzeAlert(alert) {
    // Find similar incidents
    const similarIncidents = this.findSimilarIncidents(alert, 3);

    // Extract insights
    const likelyRootCause = this.extractRootCause(similarIncidents);
    const confidenceScore = this.calculateConfidence(similarIncidents);
    const suggestedActions = this.generateActions(similarIncidents, alert);

    return {
      alert,
      likelyRootCause,
      confidenceScore,
      similarIncidents,
      suggestedActions
    };
  }

  /**
   * Get incident statistics
   * @returns {object} - Statistics about incident patterns
   */
  getIncidentStats() {
    const stats = {
      totalIncidents: this.incidents.length,
      severityDistribution: {},
      serviceDistribution: {},
      averageResolutionTime: 0,
      mostCommonRootCauses: []
    };

    let totalResolutionTime = 0;
    const rootCauseFreq = {};

    this.incidents.forEach(incident => {
      // Severity distribution
      const sev = incident.severity.toLowerCase();
      stats.severityDistribution[sev] = (stats.severityDistribution[sev] || 0) + 1;

      // Service distribution
      const service = incident.service;
      stats.serviceDistribution[service] = (stats.serviceDistribution[service] || 0) + 1;

      // Resolution time
      totalResolutionTime += incident.resolution_time_minutes;

      // Root cause frequency
      const cause = incident.root_cause;
      rootCauseFreq[cause] = (rootCauseFreq[cause] || 0) + 1;
    });

    stats.averageResolutionTime = Math.round(totalResolutionTime / this.incidents.length);
    stats.mostCommonRootCauses = Object.entries(rootCauseFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cause, count]) => ({ cause, count }));

    return stats;
  }
}

module.exports = Analyzer;
