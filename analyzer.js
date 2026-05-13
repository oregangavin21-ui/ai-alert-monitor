/**
 * Alert Analysis Engine
 * Analyzes alerts and correlates with historical incidents
 */

const similarity = require('./similarity.js');

class Analyzer {
  constructor(incidents) {
    this.incidents = incidents;
    this.actionTemplates = {
      'database': {
        'critical': [
          'Verify database connection pool status and available connections',
          'Check for blocked queries or table locks in database logs',
          'Review query execution plans for slow running queries',
          'Analyze database CPU and I/O utilization',
          'Check for missing or corrupted indexes on key tables'
        ],
        'high': [
          'Monitor database performance metrics (CPU, memory, I/O)',
          'Review recent schema changes or index modifications',
          'Analyze slow query log for performance bottlenecks',
          'Check replication lag if applicable',
          'Verify database backup and recovery procedures'
        ]
      },
      'memory': {
        'critical': [
          'Immediately restart affected service to free memory',
          'Identify and fix memory leak in application code',
          'Increase memory limits and monitor for recurrence',
          'Enable memory profiling to identify leak source',
          'Review recent code deployments for memory regressions'
        ],
        'high': [
          'Monitor memory usage trends and set up alerting',
          'Review application caching mechanisms',
          'Optimize data structures to reduce memory footprint',
          'Implement automatic memory cleanup routines',
          'Consider load balancing to distribute memory usage'
        ]
      },
      'latency': {
        'critical': [
          'Check downstream service health and response times',
          'Review network connectivity and bandwidth usage',
          'Scale up capacity if resource-constrained',
          'Enable detailed request tracing to identify bottleneck',
          'Implement circuit breaker to prevent cascading failures'
        ],
        'high': [
          'Analyze request patterns and implement caching',
          'Optimize slow database queries or API calls',
          'Review load balancer configuration and distribution',
          'Consider service mesh for better traffic management',
          'Monitor end-to-end latency metrics'
        ]
      },
      'network': {\n        'critical': [\n          'Verify network connectivity and routing tables',\n          'Check for packet loss or network congestion',\n          'Review switch/firewall configurations',\n          'Enable network monitoring and packet capture',\n          'Implement redundant network paths for failover'\n        ],\n        'high': [\n          'Monitor network bandwidth and latency',\n          'Review DNS resolution and service discovery',\n          'Check for network configuration drift',\n          'Implement network performance monitoring',\n          'Review network security policies'\n        ]\n      },\n      'load-balancer': {\n        'critical': [\n          'Verify health check configuration and sensitivity',\n          'Remove unhealthy instances from load balancer pool',\n          'Check load balancer CPU and connection limits',\n          'Review traffic distribution weights across backends',\n          'Enable connection draining before removing instances'\n        ],\n        'high': [\n          'Monitor load balancer metrics (active connections, requests/sec)',\n          'Review session persistence and stickiness settings',\n          'Optimize health check intervals and thresholds',\n          'Implement rate limiting at load balancer level',\n          'Verify SSL/TLS termination configuration'\n        ]\n      },\n      'cache': {\n        'critical': [\n          'Implement LRU or TTL-based eviction policy',\n          'Monitor cache hit/miss ratios',\n          'Increase cache size or add more cache nodes',\n          'Verify cache expiration and invalidation logic',\n          'Implement cache warming strategies'\n        ]\n      },\n      'performance': {\n        'critical': [\n          'Profile application code to identify bottlenecks',\n          'Optimize database queries and indexes',\n          'Implement caching for frequently accessed data',\n          'Scale horizontally by adding more instances',\n          'Review and optimize resource allocation'\n        ]\n      }\n    };\n  }\n\n  /**\n   * Find top N similar incidents\n   * @param {object} alert - Alert to analyze\n   * @param {number} topN - Number of top results (default 3)\n   * @returns {array} - Top similar incidents with scores\n   */\n  findSimilarIncidents(alert, topN = 3) {\n    const scored = this.incidents.map(incident => ({\n      ...incident,\n      similarityScore: similarity.calculateWeightedSimilarity(alert, incident)\n    }));\n\n    return scored\n      .sort((a, b) => b.similarityScore - a.similarityScore)\n      .slice(0, topN);\n  }\n\n  /**\n   * Extract likely root cause from similar incidents\n   * @param {array} similarIncidents - Similar incidents array\n   * @returns {string} - Most likely root cause\n   */\n  extractRootCause(similarIncidents) {\n    if (similarIncidents.length === 0) {\n      return 'Unknown - insufficient historical data';\n    }\n\n    // Weight root causes by similarity score\n    const rootCauseMap = {};\n    let totalScore = 0;\n\n    similarIncidents.forEach(incident => {\n      const cause = incident.root_cause;\n      rootCauseMap[cause] = (rootCauseMap[cause] || 0) + incident.similarityScore;\n      totalScore += incident.similarityScore;\n    });\n\n    // Find highest weighted root cause\n    let topCause = Object.entries(rootCauseMap)\n      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];\n\n    return topCause ? topCause[0] : 'Unknown root cause';\n  }\n\n  /**\n   * Calculate confidence score\n   * @param {array} similarIncidents - Similar incidents array\n   * @returns {number} - Confidence 0-100\n   */\n  calculateConfidence(similarIncidents) {\n    if (similarIncidents.length === 0) return 0;\n    \n    const avgScore = similarIncidents.reduce((sum, inc) => sum + inc.similarityScore, 0) / similarIncidents.length;\n    return Math.round(avgScore);\n  }\n\n  /**\n   * Detect problem category from alert message and metadata\n   * @param {object} alert - Alert object\n   * @returns {string} - Problem category (database, memory, latency, etc.)\n   */\n  detectProblemCategory(alert) {\n    const message = (alert.message + ' ' + alert.error_code).toLowerCase();\n    \n    const patterns = {\n      'database': /database|connection|timeout|query|sql|db_|postgres|mysql|table|index|lock|deadlock/,\n      'memory': /memory|oom|heap|out of memory|mem_|memleak|allocation/,\n      'latency': /latency|slow|timeout|response|delayed|lag|delay|5 second/,\n      'network': /network|connection refused|unreachable|dns|routing|switch|firewall/,\n      'load-balancer': /load balancer|lb|pool|health check|unhealthy|backend|upstream/,\n      'cache': /cache|evict|ttl|lru|miss|hit|buffer/,\n      'performance': /performance|degradation|bottleneck|cpu|utilization|throughput/\n    };\n\n    for (const [category, pattern] of Object.entries(patterns)) {\n      if (pattern.test(message)) {\n        return category;\n      }\n    }\n\n    return 'performance'; // default category\n  }\n\n  /**\n   * Generate smart suggested actions based on problem category and severity\n   * @param {array} similarIncidents - Similar incidents array\n   * @param {object} alert - Original alert\n   * @returns {array} - Suggested actions\n   */\n  generateActions(similarIncidents, alert) {\n    const actions = new Set();\n    const severity = alert.severity.toLowerCase();\n    const problemCategory = this.detectProblemCategory(alert);\n    \n    // Get template-based actions for the problem category\n    const severityKey = severity === 'critical' ? 'critical' : 'high';\n    const templates = this.actionTemplates[problemCategory]?.[severityKey] || [];\n    \n    templates.forEach(action => actions.add(action));\n\n    // Extract specific resolution steps from most similar incident's closure notes\n    if (similarIncidents.length > 0 && similarIncidents[0].similarityScore > 50) {\n      const topIncident = similarIncidents[0];\n      \n      if (topIncident.closure_notes) {\n        // Extract complete sentences from closure notes\n        const sentences = topIncident.closure_notes\n          .split(/[.!?]+/)\n          .map(s => s.trim())\n          .filter(s => s.length > 15 && s.split(' ').length > 2);\n        \n        sentences.forEach(sentence => {\n          if (actions.size < 5) {\n            actions.add(sentence);\n          }\n        });\n      }\n    }\n\n    // Add severity-specific escalation actions\n    if (severity === 'critical') {\n      actions.add('Page on-call engineer and establish incident bridge call');\n      actions.add('Implement temporary mitigation while root cause is investigated');\n    }\n\n    // Add monitoring and validation step\n    actions.add('Monitor metrics after fix to ensure stability and no regression');\n\n    // Convert to array, prioritize templates, and limit to 5\n    const actionArray = Array.from(actions);\n    \n    // Return template-based actions first, then specific actions\n    return [\n      ...actionArray.filter(a => templates.includes(a)).slice(0, 3),\n      ...actionArray.filter(a => !templates.includes(a)).slice(0, 2)\n    ].slice(0, 5);\n  }\n\n  /**\n   * Comprehensive alert analysis\n   * @param {object} alert - Alert object to analyze\n   * @returns {object} - Complete analysis results\n   */\n  analyzeAlert(alert) {\n    // Find similar incidents\n    const similarIncidents = this.findSimilarIncidents(alert, 3);\n\n    // Extract insights\n    const likelyRootCause = this.extractRootCause(similarIncidents);\n    const confidenceScore = this.calculateConfidence(similarIncidents);\n    const suggestedActions = this.generateActions(similarIncidents, alert);\n\n    return {\n      alert,\n      likelyRootCause,\n      confidenceScore,\n      similarIncidents,\n      suggestedActions\n    };\n  }\n\n  /**\n   * Get incident statistics\n   * @returns {object} - Statistics about incident patterns\n   */\n  getIncidentStats() {\n    const stats = {\n      totalIncidents: this.incidents.length,\n      severityDistribution: {},\n      serviceDistribution: {},\n      averageResolutionTime: 0,\n      mostCommonRootCauses: []\n    };\n\n    let totalResolutionTime = 0;\n    const rootCauseFreq = {};\n\n    this.incidents.forEach(incident => {\n      // Severity distribution\n      const sev = incident.severity.toLowerCase();\n      stats.severityDistribution[sev] = (stats.severityDistribution[sev] || 0) + 1;\n\n      // Service distribution\n      const service = incident.service;\n      stats.serviceDistribution[service] = (stats.serviceDistribution[service] || 0) + 1;\n\n      // Resolution time\n      totalResolutionTime += incident.resolution_time_minutes;\n\n      // Root cause frequency\n      const cause = incident.root_cause;\n      rootCauseFreq[cause] = (rootCauseFreq[cause] || 0) + 1;\n    });\n\n    stats.averageResolutionTime = Math.round(totalResolutionTime / this.incidents.length);\n    stats.mostCommonRootCauses = Object.entries(rootCauseFreq)\n      .sort(([, a], [, b]) => b - a)\n      .slice(0, 5)\n      .map(([cause, count]) => ({ cause, count }));\n\n    return stats;\n  }\n}\n\nmodule.exports = Analyzer;\n