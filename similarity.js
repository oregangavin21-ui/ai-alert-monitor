/**
 * Similarity Analysis Module
 * Uses Levenshtein distance for text comparison
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // deletion
        matrix[j - 1][i] + 1,      // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate similarity score (0-100) between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score 0-100
 */
function calculateSimilarity(str1, str2) {
  const str1Lower = str1.toLowerCase().trim();
  const str2Lower = str2.toLowerCase().trim();
  
  const maxLen = Math.max(str1Lower.length, str2Lower.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(str1Lower, str2Lower);
  const similarity = (1 - distance / maxLen) * 100;
  return Math.round(Math.max(0, similarity));
}

/**
 * Extract keywords from text
 * @param {string} text - Input text
 * @returns {Set<string>} - Set of keywords
 */
function extractKeywords(text) {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'is',
    'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did'
  ]);

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return new Set(
    words.filter(word => word.length > 3 && !stopwords.has(word))
  );
}

/**
 * Calculate keyword overlap percentage
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Overlap percentage 0-100
 */
function keywordOverlap(text1, text2) {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  if (keywords1.size === 0 && keywords2.size === 0) return 100;
  if (keywords1.size === 0 || keywords2.size === 0) return 0;

  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);

  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Calculate normalized severity similarity
 * @param {string} sev1 - First severity level
 * @param {string} sev2 - Second severity level
 * @returns {number} - Similarity 0-100
 */
function severitySimilarity(sev1, sev2) {
  const severityLevels = {
    'critical': 1,
    'high': 2,
    'medium': 3,
    'low': 4,
    'info': 5
  };

  const level1 = severityLevels[sev1.toLowerCase()] || 3;
  const level2 = severityLevels[sev2.toLowerCase()] || 3;
  
  const maxDiff = 4;
  const diff = Math.abs(level1 - level2);
  return Math.round(((maxDiff - diff) / maxDiff) * 100);
}

/**
 * Calculate weighted similarity between alert and incident
 * @param {object} alert - Alert object
 * @param {object} incident - Incident object
 * @returns {number} - Weighted similarity 0-100
 */
function calculateWeightedSimilarity(alert, incident) {
  // Message similarity (60% weight)
  const messageSimilarity = calculateSimilarity(alert.message, incident.description);
  
  // Service matching (25% weight)
  const serviceMatch = alert.service.toLowerCase() === incident.service.toLowerCase() ? 100 : 0;
  
  // Severity similarity (15% weight)
  const severityMatch = severitySimilarity(alert.severity, incident.severity);

  const weightedScore = 
    (messageSimilarity * 0.60) +
    (serviceMatch * 0.25) +
    (severityMatch * 0.15);

  return Math.round(weightedScore);
}

module.exports = {
  levenshteinDistance,
  calculateSimilarity,
  extractKeywords,
  keywordOverlap,
  severitySimilarity,
  calculateWeightedSimilarity
};
