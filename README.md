# Alert Analyzer Agent

A Node.js agentic AI prototype that monitors incoming alerts, compares them against historical incidents, and suggests likely root causes based on similarity analysis.

## 🎯 Features

- 📊 Analyzes incoming alerts from JSON data
- 🔄 Compares alerts against historical incident database
- 📈 Calculates text similarity using Levenshtein distance algorithm
- 🎯 Identifies top 3 most similar incidents with confidence scores
- 💡 Suggests likely root causes and recommended actions
- 📋 Generates detailed analysis reports

## 📁 Project Structure

```
.
├── index.js              # Main entry point - orchestrates analysis
├── analyzer.js           # Analysis engine - generates insights
├── similarity.js         # Text similarity matching module
├── package.json          # Project metadata
└── data/
    ├── alerts.json       # Incoming alerts to analyze
    └── incidents.json    # Historical incident database
```

## 🚀 Installation & Usage

```bash
# Install dependencies
npm install

# Run the alert analyzer
npm start
```

## 🧠 How It Works

### 1. Alert Monitoring
The system reads incoming alerts from `data/alerts.json` containing:
- Alert ID, timestamp, severity level
- Service name and error message
- Error codes for tracking

### 2. Similarity Analysis
Uses a weighted similarity algorithm combining:
- **Message similarity** (60%) - Levenshtein distance between alert and incident descriptions
- **Service matching** (25%) - Exact match on service name
- **Severity alignment** (15%) - Comparison of severity levels

### 3. Root Cause Identification
- Finds top 3 most similar historical incidents
- Extracts root causes from matching incidents
- Scores confidence based on similarity matches
- Groups similar root causes to identify patterns

### 4. Recommendations
Generates actionable suggestions based on:
- Resolution steps from similar historical incidents
- Industry best practices
- Service-specific insights

## 📊 Example Output

```
================================================================================
ALERT ANALYSIS AGENT - AI-Powered Incident Correlation
================================================================================

📊 Loaded 3 incoming alert(s)
📚 Loaded 6 historical incident(s)

────────────────────────────────────────────────────────────────────────────────

🔔 PROCESSING ALERT 1 of 3:
────────────────────────────────────────────────────────────────────────────────

📋 INCOMING ALERT:
   ID: alert_001
   Timestamp: 5/13/2026, 10:30:00 AM
   Service: payment-api
   Severity: CRITICAL
   Message: Database connection timeout - unable to reach primary database server after 30 second wait
   Error Code: DB_TIMEOUT_001

🔍 ANALYSIS RESULTS:
   Likely Root Cause: Missing database indexes on frequently queried columns
   Confidence Score: 87%

📚 TOP 3 SIMILAR INCIDENTS:

   1. Timeout due to slow database queries
      ID: incident_005
      Similarity: 87%
      Service: payment-api
      Severity: CRITICAL
      Root Cause: Missing database indexes on frequently queried columns
      Resolution Time: 55 minutes

   2. Database connection failure - cascading service outage
      ID: incident_001
      Similarity: 78%
      Service: payment-api
      Severity: CRITICAL
      Root Cause: Network switch misconfiguration caused interface to shut down
      Resolution Time: 45 minutes

   3. Database query performance degradation
      ID: incident_004
      Similarity: 75%
      Service: payment-api
      Severity: CRITICAL
      Root Cause: Missing database indexes on frequently queried columns combined with query plan regression
      Resolution Time: 60 minutes

💡 SUGGESTED ACTIONS:
   1. Added proper indexes, optimized query plans, tested query performance under load
   2. Restarted network switch, verified routing tables, implemented automated failover
   3. Check database connection pool utilization

================================================================================
```

## 🔧 Algorithm Details

### Levenshtein Distance
Calculates the minimum number of single-character edits (insertions, deletions, substitutions) needed to transform one string into another.

- **Time Complexity:** O(m×n) where m and n are string lengths
- **Space Complexity:** O(m×n)

### Similarity Scoring
- Normalizes Levenshtein distance to 0-1 range
- Applies weighted scoring across multiple dimensions
- Higher scores indicate more similar incidents

### Weighted Scoring Formula
```
WeightedScore = (MessageSimilarity × 0.60) + (ServiceMatch × 0.25) + (SeverityMatch × 0.15)
```

## 📄 Data File Formats

### alerts.json
Incoming alerts to be analyzed:
```json
{
  "id": "alert_001",
  "timestamp": "2026-05-13T10:30:00Z",
  "severity": "critical",
  "service": "payment-api",
  "message": "Database connection timeout...",
  "error_code": "DB_TIMEOUT_001"
}
```

### incidents.json
Historical database of resolved incidents:
```json
{
  "id": "incident_001",
  "title": "Database connection failure",
  "description": "Primary database server became unreachable...",
  "service": "payment-api",
  "severity": "critical",
  "root_cause": "Network switch misconfiguration...",
  "closure_notes": "Restarted network switch, verified routing...",
  "resolution_time_minutes": 45,
  "date": "2026-04-15",
  "tags": ["network", "database", "connectivity"]
}
```

## 🎓 Extending the System

### Add More Alerts
Edit `data/alerts.json` to add new incoming alerts for analysis.

### Add Historical Incidents
Edit `data/incidents.json` to expand the incident database for better matching.

### Customize Similarity Weights
Modify the weights in `analyzer.js`:
```javascript
// Current: message (60%), service (25%), severity (15%)
// Adjust based on your needs
const weightedScore = 
  messageSimilarity * 0.6 +      // Adjust message weight
  serviceMatch * 0.25 +           // Adjust service weight
  severityMatch * 0.15;           // Adjust severity weight
```

### Integrate External Data
Modify `index.js` to load data from APIs or databases:
```javascript
// Replace loadJSONFile() with API calls to:
// - Alert management systems (PagerDuty, VictorOps)
// - Incident tracking systems (Jira, ServiceNow)
// - Monitoring platforms (Datadog, New Relic)
```

### Add ML-Based Similarity
Replace Levenshtein distance with:
- TF-IDF (Term Frequency-Inverse Document Frequency)
- Word embeddings (Word2Vec, GloVe)
- Transformer models (BERT for semantic similarity)

## 🔍 API Methods

### Analyzer Class

#### `analyzeAlert(alert)`
Main analysis function that returns comprehensive insights.
```javascript
const analysis = analyzer.analyzeAlert(alert);
// Returns: { alert, likelyRootCause, confidenceScore, similarIncidents, suggestedActions }
```

#### `findSimilarIncidents(alert, topN)`
Search for N most similar incidents.
```javascript
const matches = analyzer.findSimilarIncidents(alert, 3);
```

#### `getIncidentStats()`
Get statistics about incident patterns.
```javascript
const stats = analyzer.getIncidentStats();
// Returns: { totalIncidents, severityDistribution, serviceDistribution, averageResolutionTime }
```

### Similarity Module

#### `calculateSimilarity(str1, str2)`
Returns similarity score 0-100.

#### `calculateWeightedSimilarity(alert, incident)`
Returns weighted similarity score considering service and severity.

#### `extractKeywords(text)`
Extracts meaningful keywords from text.

#### `keywordOverlap(text1, text2)`
Calculates keyword overlap percentage.

## 📈 Performance Characteristics

- **Single Alert Analysis:** O(n×m) where n = number of incidents, m = avg string length
- **Memory Usage:** O(n×m) for storing incidents and similarity matrices
- **Scalability:** Handles 1000+ incidents efficiently with current algorithm

## 🛠 Future Enhancements

- [ ] Machine learning-based similarity scoring
- [ ] Natural language processing for closure notes
- [ ] Temporal analysis (detect if pattern frequency changes)
- [ ] Correlation between multiple alerts
- [ ] Predictive alerting based on patterns
- [ ] Integration with real monitoring platforms
- [ ] Web UI for alert visualization
- [ ] Database persistence layer
- [ ] REST API for external integration
- [ ] Slack/Teams notifications

## 📝 License

MIT

## 👥 Author

Alert Analyzer Agent Prototype - 2026
