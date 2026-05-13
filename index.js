#!/usr/bin/env node

/**
 * Alert Analyzer Agent - Main Entry Point
 * Monitors incoming alerts and compares against historical incidents
 */

const fs = require('fs');
const path = require('path');
const Analyzer = require('./analyzer.js');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function loadJSONFile(filename) {
  const filepath = path.join(__dirname, 'data', filename);
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error loading ${filename}:`, error.message);
    process.exit(1);
  }
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

function printAlert(alert) {
  console.log('📋 INCOMING ALERT:');
  console.log(`   ID: ${alert.id}`);
  console.log(`   Timestamp: ${formatTimestamp(alert.timestamp)}`);
  console.log(`   Service: ${alert.service}`);
  console.log(`   Severity: ${alert.severity.toUpperCase()}`);
  console.log(`   Message: ${alert.message}`);
  console.log(`   Error Code: ${alert.error_code}`);
  console.log();
}

function printAnalysis(result) {
  console.log('🔍 ANALYSIS RESULTS:');
  console.log(`   Likely Root Cause: ${result.likelyRootCause}`);
  console.log(`   Confidence Score: ${result.confidenceScore}%`);
  console.log();
}

function printSimilarIncidents(incidents) {
  console.log('📚 TOP 3 SIMILAR INCIDENTS:');
  incidents.forEach((incident, index) => {
    console.log(`\n   ${index + 1}. ${incident.title}`);
    console.log(`      ID: ${incident.id}`);
    console.log(`      Similarity: ${incident.similarityScore}%`);
    console.log(`      Service: ${incident.service}`);
    console.log(`      Severity: ${incident.severity.toUpperCase()}`);
    console.log(`      Root Cause: ${incident.root_cause}`);
    console.log(`      Resolution Time: ${incident.resolution_time_minutes} minutes`);
  });
  console.log();
}

function printActions(actions) {
  console.log('💡 SUGGESTED ACTIONS:');
  actions.forEach((action, index) => {
    console.log(`   ${index + 1}. ${action}`);
  });
  console.log();
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('\n' + '='.repeat(80));
  console.log('ALERT ANALYSIS AGENT - AI-Powered Incident Correlation');
  console.log('='.repeat(80) + '\n');

  // Load data files
  const alerts = loadJSONFile('alerts.json');
  const incidents = loadJSONFile('incidents.json');

  console.log(`📊 Loaded ${alerts.length} incoming alert(s)`);
  console.log(`📚 Loaded ${incidents.length} historical incident(s)\n`);

  // Initialize analyzer
  const analyzer = new Analyzer(incidents);

  // Display statistics
  const stats = analyzer.getIncidentStats();
  console.log('📈 INCIDENT STATISTICS:');
  console.log(`   Total Incidents: ${stats.totalIncidents}`);
  console.log(`   Average Resolution Time: ${stats.averageResolutionTime} minutes`);
  console.log(`   Severity Levels: ${Object.entries(stats.severityDistribution).map(([k, v]) => `${k}(${v})`).join(', ')}`);
  console.log(`\n`);

  // Process each alert
  alerts.forEach((alert, index) => {
    if (index > 0) {
      console.log('─'.repeat(80) + '\n');
    }

    console.log(`\n🔔 PROCESSING ALERT ${index + 1} of ${alerts.length}:`);
    console.log('─'.repeat(80) + '\n');

    // Print alert details
    printAlert(alert);

    // Analyze alert
    const analysis = analyzer.analyzeAlert(alert);

    // Print results
    printAnalysis(analysis);
    printSimilarIncidents(analysis.similarIncidents);
    printActions(analysis.suggestedActions);
  });

  console.log('='.repeat(80));
  console.log('✅ Analysis Complete');
  console.log('='.repeat(80) + '\n');
}

// Run main function
main();
