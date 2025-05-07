// Cache DOM elements frequently used
const DOM = {
  countdownSpan: document.querySelector(".refresh-btn .countdown"),
  loadingOverlay: document.getElementById("loadingOverlay"), // Updated ID
  metricSearch: document.getElementById("metric-search"),
  timeRange: document.getElementById("timeRange"),
  performanceChart: document.getElementById("performance-chart"),
  trendChart: document.getElementById("trendChart"),
  progressChart: document.getElementById("progressChart"),
  patternsList: document.getElementById("patternsList"),
  predictiveInsights: document.getElementById("predictiveInsights"),
  achievementsList: document.getElementById("achievementsList"),
  errorContainer: document.getElementById("error-container")
};

// Global state variables
let currentTimeframe = 'year';
let allMetrics = {};
let activeTab = 'failbase'; // Add activeTab state

// Add learning history cache
const learningCache = {
  patterns: {},
  weights: {},
  lastUpdate: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if required elements exist
  const requiredElements = [
    { id: 'loadingOverlay', name: 'Loading Overlay' },
    { id: 'error-container', name: 'Error Container' },
    { id: 'performance-chart', name: 'Performance Chart' },
    { id: 'trendChart', name: 'Trend Chart' },
    { id: 'progressChart', name: 'Progress Chart' },
    { id: 'patternsList', name: 'Patterns List' },
    { id: 'predictiveInsights', name: 'Predictive Insights' },
    { id: 'achievementsList', name: 'Achievements List' }
  ];

  const missingElements = requiredElements.filter(el => !document.getElementById(el.id));
  if (missingElements.length > 0) {
    console.error('Missing required elements:', missingElements.map(el => el.name));
    showError(`Missing required elements: ${missingElements.map(el => el.name).join(', ')}`);
  }

  // Initialize global elements
  DOM.metricSearch?.addEventListener('input', handleSearch);
  DOM.timeRange?.addEventListener('change', handleTimeframeChange);
  
  // Add navigation handlers
  initializeNavigation();
  
  // Set initial timeframe
  currentTimeframe = DOM.timeRange?.value || 'year';
  
  // Initial data load
  fetchMetrics().catch(error => {
    console.error('Failed to fetch metrics:', error);
    showError('Failed to load metrics data. Please try again later.');
  });
  
  startAutoRefresh();

  // Add tab click handlers with state management
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and its content
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      activeTab = tabId; // Update active tab state
      document.getElementById(tabId)?.classList.add('active');
      
      // Clear existing charts before updating
      destroyCharts();
      updateDashboard();
    });
  });

  // Add view toggle functionality
  document.querySelectorAll('[data-action="toggleView"]').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-view');
      document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('.metric-grid').forEach(grid => {
        grid.className = `metric-grid view-mode-${view}`;
      });
    });
  });
});

function initializeNavigation() {
  const navLinks = document.querySelectorAll('.main-nav a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      
      // Update active state
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Hide all sections
      document.querySelectorAll('.main-content > .container > section').forEach(section => {
        section.style.display = 'none';
      });
      
      // Show target section
      if (targetId === '') {
        document.querySelector('.dashboard-overview').style.display = 'block';
      } else {
        const targetSection = document.getElementById(`${targetId}-section`);
        if (targetSection) {
          targetSection.style.display = 'block';
          // Trigger analytics update when switching to analytics section
          if (targetId === 'analytics') {
            updateAnalytics();
          }
        }
      }
    });
  });
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  document.querySelectorAll('.metric-box').forEach(box => {
    const metricName = box.querySelector('.metric-name').textContent.toLowerCase();
    box.style.display = metricName.includes(searchTerm) ? 'block' : 'none';
  });
}

function handleTimeframeChange(event) {
  currentTimeframe = event.target.value;
  fetchMetrics();
}

function startAutoRefresh() {
  const REFRESH_INTERVAL = 300; // 5 minutes in seconds
  let countdown = REFRESH_INTERVAL;
  
  const updateCountdown = () => {
    if (DOM.countdownSpan) {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      DOM.countdownSpan.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
    }
    countdown--;
    
    if (countdown < 0) {
      countdown = REFRESH_INTERVAL;
      fetchMetrics();
    }
  };
  
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

async function fetchMetrics() {
  toggleLoading(true);
  try {
    // This is your Google Apps Script web app URL
    const response = await fetch('https://script.google.com/macros/s/AKfycbyRTgsufzTG5NZUA2BPKQsuw0tDs_ZZmtVInU9x_uUhb4RRgs7MtZ0W77VgWiW-fi9w/exec?action=getMetrics&timeframe=' + currentTimeframe);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    allMetrics = data;
    updateDashboard();
  } catch (error) {
    console.error('Error fetching metrics:', error);
    showError('Failed to load metrics data: ' + error.message);
  } finally {
    toggleLoading(false);
  }
}

function updateDashboard() {
  updateSummaryCards(activeTab);
  updateAnalytics();
  
  // Display metrics for active tab
  if (allMetrics[activeTab]) {
    displayMetrics(allMetrics[activeTab], `${activeTab}-metrics`);
  }
  
  initPerformanceChart(allMetrics);
}

// Combine trend calculation into a single function
function getTrendData(metrics, metric) {
  const trendMetric = metrics.find((m) => m.name === metric);
  const trendValue = trendMetric ? parseFloat(trendMetric.value) : 0;
  return {
    isPositive: trendValue >= 0,
    value: trendMetric ? trendMetric.value : "0%",
  };
}

// Optimize metric updates with a single function
function updateMetric(elementId, value, trend) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.querySelector(".card-value").textContent = value;
  const trendElement = element.querySelector(".card-trend");
  const iconElement = trendElement.querySelector("i");

  trendElement.classList.toggle("positive", trend.isPositive);
  trendElement.classList.toggle("negative", !trend.isPositive);
  iconElement.className = `fas fa-arrow-${trend.isPositive ? "up" : "down"}`;
  trendElement.querySelector(".trend-value").textContent = trend.value;
}

// Combine loading states
function toggleLoading(show) {
  DOM.loadingOverlay?.classList.toggle("show", show);
}

// Update trend calculation to use actual period comparisons
function calculateTrend(currentValue, previousValue) {
  if (!currentValue || !previousValue) return { isPositive: true, value: '0%' };
  
  const difference = currentValue - previousValue;
  const percentChange = (difference / previousValue) * 100;
  
  return {
    isPositive: percentChange >= 0,
    value: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`
  };
}

// Update summary cards based on the selected tab
function updateSummaryCards(tabId) {
  const metrics = allMetrics[tabId] || [];
  const categoryMetrics = metrics.find(category => 
    category.category === 'Overview')?.metrics || [];

  const participationMetrics = metrics.find(category => 
    category.category === 'Participation')?.metrics || [];

  // Get current period values
  const currentPeriod = {
    total: parseInt(categoryMetrics.find(m => m.name === 'Total Entries')?.value) || 0,
    completion: parseFloat(participationMetrics.find(m => 
      m.name === 'General Participation Rate')?.value.replace('%', '')) || 0,
    score: parseFloat(metrics.find(category => 
      category.category === 'Performance')?.metrics.find(m => 
      m.name === 'Average First Test Result')?.value) || 0
  };

  // Calculate trends
  const trends = {
    total: { isPositive: true, value: '0%' },
    completion: { isPositive: true, value: '0%' },
    score: { isPositive: true, value: '0%' }
  };

  // Update cards
  updateMetric('total-attempts', currentPeriod.total.toString(), trends.total);
  updateMetric('completion-rate', `${currentPeriod.completion.toFixed(1)}%`, trends.completion);
  updateMetric('avg-score', currentPeriod.score.toString(), trends.score);
}

// Initialize performance chart
const chartInstances = {
  performance: null,
  trend: null,
  progress: null
};

function destroyCharts() {
  Object.values(chartInstances).forEach(chart => {
    if (chart) {
      chart.destroy();
    }
  });
  Object.keys(chartInstances).forEach(key => {
    chartInstances[key] = null;
  });
}

// Add chart cleanup on page unload
window.addEventListener('beforeunload', () => {
  destroyCharts();
});

// Fix chartData bug in initPerformanceChart
function initPerformanceChart(data) {
  if (!data || typeof data !== "object") {
    console.error("Invalid chart data:", data);
    return;
  }

  const chartContainer = document.getElementById("performance-chart");
  if (!chartContainer) {
    console.error("Performance chart container not found");
    return;
  }

  try {
    chartContainer.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.id = "quizScoreChart";
    chartContainer.appendChild(canvas);

    // Get performance metrics from each quiz type
    const scores = Object.entries(data).map(([quizType, metrics]) => {
      const performanceCategory = metrics.find(category => 
        category.category === 'Performance');
      return parseFloat(performanceCategory?.metrics.find(m => 
        m.name === 'Average First Test Result')?.value) || 0;
    });

    if (scores.some(score => score > 0)) {
      if (chartInstances.performance) {
        chartInstances.performance.destroy();
      }

      const ctx = canvas.getContext("2d");
      chartInstances.performance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Failbase Quiz", "Job Quiz", "Roleplay Quiz"],
          datasets: [{
            label: "Average Score",
            data: scores,
            backgroundColor: [
              "rgba(3, 169, 244, 0.6)",
              "rgba(255, 87, 34, 0.6)",
              "rgba(76, 175, 80, 0.6)",
            ],
            borderColor: [
              "rgba(3, 169, 244, 1)",
              "rgba(255, 87, 34, 1)",
              "rgba(76, 175, 80, 1)",
            ],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 20
            }
          }
        }
      });
    } else {
      chartContainer.innerHTML = '<div class="chart-placeholder"><i class="fas fa-chart-line"></i><p>No valid scores available</p></div>';
    }
  } catch (error) {
    console.error("Error creating performance chart:", error);
    showError('Failed to initialize performance chart');
  }
}

// Function to get a more descriptive chart title
function getChartTitle(timeframe) {
  switch (timeframe) {
    case "today":
      return "Today's Quiz Performance";
    case "week":
      return "Weekly Quiz Performance";
    case "month":
      return "Monthly Quiz Performance";
    case "year":
      return "Annual Quiz Performance";
    case "all":
      return "Overall Quiz Performance";
    default:
      return `Quiz Performance (${timeframe})`;
  }
}

// Get average score from data
function getAverageScoreFromData(data) {
  const avgScoreMetric = data.find(
    (metric) => metric.name === "Average First Test Result"
  );
  return avgScoreMetric ? avgScoreMetric.value : "0";
}

// Replace analytics section with simplified metrics
function updateAnalytics() {
  try {
    const analyticsSection = document.getElementById('analytics-section');
    if (!analyticsSection) {
      console.error('Analytics section not found');
      return;
    }

    updateTrendChart();
    updatePatternAnalysis();
    updateProgressTracking();
    updatePredictiveInsights();
  } catch (error) {
    console.error('Error updating analytics:', error);
    showError('Failed to update analytics');
  }
}

function updateTrendChart() {
  const ctx = document.getElementById('trendChart')?.getContext('2d');
  if (!ctx) return;

  const trendData = Object.entries(allMetrics).map(([quizType, metrics]) => {
    const performanceCategory = metrics.find(category => 
      category.category === 'Performance');
    return performanceCategory?.metrics.find(m => 
      m.name === 'Average First Test Result')?.value || 0;
  });

  const labels = ['Failbase', 'Job', 'Roleplay'];
  
  try {
    if (chartInstances.trend) {
      chartInstances.trend.destroy();
    }

    chartInstances.trend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Average Scores',
          data: trendData,
          borderColor: 'rgba(3, 169, 244, 1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 20
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating trend chart:', error);
  }
}

function analyzePatterns() {
  if (!allMetrics) return [];
  
  // Load previous patterns if they exist
  loadLearningPatterns();
  
  return Object.entries(allMetrics).map(([quizType, metrics]) => {
    const performanceHistory = extractPerformanceHistory(metrics);
    const learningTrends = analyzeLearningTrends(quizType, performanceHistory);
    
    // Update pattern weights based on prediction accuracy
    updatePatternWeights(quizType, learningTrends);
    
    // Generate insights based on weighted patterns
    const patterns = generateWeightedPatterns(quizType, learningTrends);
    
    // Save updated patterns
    saveLearningPatterns(quizType, patterns, learningTrends);
    
    return {
      title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Learning Pattern`,
      description: patterns.join('. '),
      confidence: calculatePatternConfidence(learningTrends)
    };
  });
}

function analyzeLearningTrends(quizType, history) {
  const previousPatterns = learningCache.patterns[quizType] || {};
  const weights = learningCache.weights[quizType] || initializeWeights();
  
  // Calculate score progression
  const scoreProgression = calculateScoreProgression(history.scores);
  
  // Analyze learning velocity
  const learningVelocity = calculateLearningVelocity(history.scores);
  
  // Detect learning plateaus
  const plateaus = detectPlateaus(history.scores);
  
  // Identify breakthrough points
  const breakthroughs = findBreakthroughs(history.scores);
  
  // Compare with previous patterns
  const patternEvolution = compareWithPreviousPatterns(
    previousPatterns,
    { scoreProgression, learningVelocity, plateaus, breakthroughs }
  );
  
  return {
    currentTrends: {
      scoreProgression,
      learningVelocity,
      plateaus,
      breakthroughs
    },
    evolution: patternEvolution,
    weights
  };
}

function calculateScoreProgression(scores) {
  if (scores.length < 2) return { trend: 'insufficient_data', rate: 0 };
  
  const changes = scores.slice(1).map((score, i) => score - scores[i]);
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  
  return {
    trend: avgChange > 0.5 ? 'improving' : avgChange < -0.5 ? 'declining' : 'stable',
    rate: avgChange,
    consistency: calculateConsistency(changes)
  };
}

function calculateLearningVelocity(scores) {
  if (scores.length < 3) return { velocity: 0, acceleration: 0 };
  
  const velocities = scores.slice(1).map((score, i) => score - scores[i]);
  const acceleration = velocities.slice(1).map((v, i) => v - velocities[i]);
  
  return {
    velocity: average(velocities),
    acceleration: average(acceleration),
    pattern: identifyVelocityPattern(velocities)
  };
}

function detectPlateaus(scores) {
  const plateaus = [];
  let currentPlateau = { start: 0, length: 1, score: scores[0] };
  
  for (let i = 1; i < scores.length; i++) {
    if (Math.abs(scores[i] - currentPlateau.score) < 0.5) {
      currentPlateau.length++;
    } else {
      if (currentPlateau.length > 2) {
        plateaus.push({ ...currentPlateau });
      }
      currentPlateau = { start: i, length: 1, score: scores[i] };
    }
  }
  
  return plateaus;
}

function findBreakthroughs(scores) {
  const breakthroughs = [];
  const threshold = 2; // Minimum improvement to be considered a breakthrough
  
  for (let i = 1; i < scores.length; i++) {
    const improvement = scores[i] - scores[i-1];
    if (improvement >= threshold) {
      breakthroughs.push({
        index: i,
        improvement,
        score: scores[i],
        previousScore: scores[i-1]
      });
    }
  }
  
  return breakthroughs;
}

function updatePatternWeights(quizType, learningTrends) {
  const weights = learningCache.weights[quizType] || initializeWeights();
  const accuracy = calculatePredictionAccuracy(quizType, learningTrends);
  
  // Adjust weights based on prediction accuracy
  Object.keys(weights).forEach(factor => {
    const factorAccuracy = accuracy[factor] || 0.5;
    weights[factor] = weights[factor] * 0.8 + factorAccuracy * 0.2;
  });
  
  learningCache.weights[quizType] = weights;
}

function generateWeightedPatterns(quizType, learningTrends) {
  const patterns = [];
  const { currentTrends, weights } = learningTrends;
  
  // Generate patterns based on weighted factors
  if (currentTrends.learningVelocity.velocity * weights.velocity > 0.3) {
    patterns.push(
      currentTrends.learningVelocity.velocity > 0 
        ? 'Showing consistent improvement velocity'
        : 'Learning pace has slowed'
    );
  }
  
  if (currentTrends.plateaus.length > 0 && weights.plateaus > 0.6) {
    const lastPlateau = currentTrends.plateaus[currentTrends.plateaus.length - 1];
    patterns.push(`Reached learning plateau at score ${lastPlateau.score}`);
  }
  
  if (currentTrends.breakthroughs.length > 0 && weights.breakthroughs > 0.7) {
    const recentBreakthrough = currentTrends.breakthroughs[currentTrends.breakthroughs.length - 1];
    patterns.push(`Achieved breakthrough with ${recentBreakthrough.improvement.toFixed(1)} point improvement`);
  }
  
  return patterns;
}

// Helper functions for learning pattern storage
function loadLearningPatterns() {
  const stored = localStorage.getItem('learningPatterns');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.lastUpdate && new Date(parsed.lastUpdate) > new Date(Date.now() - 86400000)) {
        Object.assign(learningCache, parsed);
      }
    } catch (e) {
      console.error('Error loading learning patterns:', e);
    }
  }
}

function saveLearningPatterns(quizType, patterns, trends) {
  learningCache.patterns[quizType] = patterns;
  learningCache.lastUpdate = new Date().toISOString();
  
  try {
    localStorage.setItem('learningPatterns', JSON.stringify(learningCache));
  } catch (e) {
    console.error('Error saving learning patterns:', e);
  }
}

function updatePatternAnalysis() {
  const patterns = analyzePatterns();
  const patternsList = document.getElementById('patternsList');
  if (!patternsList) return;

  patternsList.innerHTML = patterns.map(pattern => `
    <div class="pattern-item">
      <h4>${pattern.title}</h4>
      <p>${pattern.description}</p>
      ${pattern.description !== 'Insufficient data to determine patterns' ? 
        `<div class="pattern-indicators">
          <i class="fas fa-graduation-cap"></i>
          <span class="pattern-tag">Learning Pattern Identified</span>
        </div>` : ''}
    </div>
  `).join('');
}

function updateProgressTracking() {
  const ctx = document.getElementById('progressChart')?.getContext('2d');
  if (!ctx) return;
  
  const progressData = calculateProgress();
  if (!progressData || Object.keys(progressData).length === 0) {
    const container = document.querySelector('.progress-chart-container');
    if (container) {
      container.innerHTML = '<div class="chart-placeholder"><i class="fas fa-chart-line"></i><p>No progress data available</p></div>';
    }
    return;
  }
  
  try {
    if (chartInstances.progress) {
      chartInstances.progress.destroy();
    }

    chartInstances.progress = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(progressData),
        datasets: [{
          label: 'Completion Rate',
          data: Object.values(progressData).map(d => d.completion),
          backgroundColor: 'rgba(76, 175, 80, 0.6)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    // Update achievements list
    updateAchievements(progressData);
  } catch (error) {
    console.error('Error creating progress chart:', error);
    showError('Failed to create progress chart');
  }
}

function calculateProgress() {
  if (!allMetrics || Object.keys(allMetrics).length === 0) return {};
  
  return Object.entries(allMetrics).reduce((acc, [quizType, metrics]) => {
    const participationMetrics = metrics.find(category => 
      category.category === 'Participation')?.metrics || [];
    
    const generalDoneExpected = participationMetrics.find(m => 
      m.name === 'General Done/Expected')?.value || '0/0';
    
    const [done, total] = generalDoneExpected.split('/').map(Number);
    
    acc[quizType] = {
      completion: total > 0 ? (done / total) * 100 : 0,
      total: total,
      done: done
    };
    
    return acc;
  }, {});
}

function updateAchievements(progressData) {
  const achievementsList = document.getElementById('achievementsList');
  if (!achievementsList) return;

  const achievements = [];
  
  // Calculate overall completion
  const quizTypes = Object.keys(progressData);
  const totalCompletion = quizTypes.reduce((sum, type) => {
    return sum + (progressData[type].completion || 0);
  }, 0) / (quizTypes.length || 1);

  // Overall achievements
  if (totalCompletion >= 90) {
    achievements.push({
      icon: 'fa-trophy',
      title: 'Outstanding Performance',
      description: `${totalCompletion.toFixed(1)}% average completion across all quizzes!`
    });
  } else if (totalCompletion >= 75) {
    achievements.push({
      icon: 'fa-medal',
      title: 'High Achiever',
      description: `${totalCompletion.toFixed(1)}% average completion rate`
    });
  }

  // Individual quiz achievements
  Object.entries(progressData).forEach(([quizType, data]) => {
    const completion = data.completion;
    const done = data.done;
    const total = data.total;

    if (completion >= 80) {
      achievements.push({
        icon: 'fa-star',
        title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Expert`,
        description: `${completion.toFixed(1)}% completion (${done}/${total})`
      });
    }
  });

  // Render achievements or show placeholder
  achievementsList.innerHTML = achievements.length ? achievements.map(achievement => `
    <div class="achievement-item">
      <i class="fas ${achievement.icon}"></i>
      <div class="achievement-details">
        <h4>${achievement.title}</h4>
        <p>${achievement.description}</p>
      </div>
    </div>
  `).join('') : '<p class="no-data">Complete more quizzes to earn achievements!</p>';
}

function updatePredictiveInsights() {
  const predictiveInsights = document.getElementById('predictiveInsights');
  if (!predictiveInsights || !allMetrics) return;

  const insights = Object.entries(allMetrics).map(([quizType, metrics]) => {
    // Get historical data
    const performanceHistory = extractPerformanceHistory(metrics);
    const learningRate = calculateLearningRate(performanceHistory);
    const trend = calculateTrendLine(performanceHistory);
    
    // Current metrics for baseline
    const currentMetrics = {
      avgScore: parseFloat(metrics.find(category => 
        category.category === 'Performance')?.metrics.find(m => 
        m.name === 'Average First Test Result')?.value) || 0,
      passRate: parseFloat(metrics.find(category => 
        category.category === 'Progress')?.metrics.find(m => 
        m.name === 'First-Time Pass Rate')?.value) || 0,
      improvement: parseFloat(metrics.find(category => 
        category.category === 'Progress')?.metrics.find(m => 
        m.name === 'Average Score Improvement')?.value) || 0
    };

    // Calculate predictions
    const predictions = generatePredictions(currentMetrics, trend, learningRate);
    const confidence = calculateConfidenceScore(performanceHistory, trend.r2);

    return {
      title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Forecast`,
      shortTerm: predictions.shortTerm,
      longTerm: predictions.longTerm,
      confidence,
      trend: trend.slope
    };
  });

  predictiveInsights.innerHTML = insights.map(insight => `
    <div class="insight-item ${getConfidenceClass(insight.confidence)}">
      <h4>${insight.title}</h4>
      <div class="prediction-details">
        <div class="prediction-short-term">
          <p><i class="fas fa-clock"></i> Next Attempt:</p>
          <ul>
            <li>Predicted Score: ${insight.shortTerm.score.toFixed(1)}</li>
            <li>Pass Probability: ${insight.shortTerm.passProbability.toFixed(1)}%</li>
          </ul>
        </div>
        <div class="prediction-long-term">
          <p><i class="fas fa-calendar"></i> Next 30 Days:</p>
          <ul>
            <li>Average Score Trend: ${insight.longTerm.averageScore.toFixed(1)}</li>
            <li>Expected Improvement: ${insight.longTerm.improvement.toFixed(1)} points</li>
          </ul>
        </div>
        <div class="confidence-indicator">
          <span class="confidence-label">Model Confidence: ${insight.confidence.toFixed(1)}%</span>
          <div class="confidence-bar" style="--confidence: ${insight.confidence}%"></div>
        </div>
      </div>
    </div>
  `).join('');
}

function extractPerformanceHistory(metrics) {
  // Extract historical scores and timestamps from metrics
  const performanceMetrics = metrics.find(category => 
    category.category === 'Performance')?.metrics || [];
  const progressMetrics = metrics.find(category => 
    category.category === 'Progress')?.metrics || [];
  
  // Convert raw data into time series
  return {
    scores: performanceMetrics.map(m => parseFloat(m.value) || 0),
    timestamps: performanceMetrics.map((_, i) => i),
    improvements: progressMetrics.filter(m => 
      m.name === 'Average Score Improvement').map(m => parseFloat(m.value) || 0)
  };
}

function calculateTrendLine(history) {
  const n = history.scores.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  // Calculate linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  history.timestamps.forEach((x, i) => {
    const y = history.scores[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  let totalSS = 0, residualSS = 0;
  history.timestamps.forEach((x, i) => {
    const y = history.scores[i];
    const yPred = slope * x + intercept;
    totalSS += Math.pow(y - yMean, 2);
    residualSS += Math.pow(y - yPred, 2);
  });
  const r2 = 1 - (residualSS / totalSS);

  return { slope, intercept, r2 };
}

function calculateLearningRate(history) {
  if (!history.improvements.length) return 0;
  return history.improvements.reduce((sum, val) => sum + val, 0) / history.improvements.length;
}

function generatePredictions(currentMetrics, trend, learningRate) {
  // Short-term prediction (next attempt)
  const shortTerm = {
    score: Math.min(20, currentMetrics.avgScore + (trend.slope * learningRate)),
    passProbability: calculatePassProbability(currentMetrics.avgScore, trend.slope)
  };

  // Long-term prediction (30 days)
  const longTerm = {
    averageScore: Math.min(20, currentMetrics.avgScore + (trend.slope * 30 * learningRate)),
    improvement: learningRate * 30
  };

  return { shortTerm, longTerm };
}

function calculatePassProbability(currentScore, trend) {
  const base = currentScore >= 14 ? 85 : 50;
  const trendModifier = trend > 0 ? 15 : trend < 0 ? -15 : 0;
  return Math.min(100, Math.max(0, base + trendModifier));
}

function calculateConfidenceScore(history, r2) {
  const dataPoints = history.scores.length;
  const dataQuality = r2 * 100;
  const consistency = calculateConsistency(history.scores);
  
  // Weight factors
  const weights = {
    dataPoints: 0.3,
    dataQuality: 0.4,
    consistency: 0.3
  };
  
  // Calculate weighted score
  return Math.min(100, Math.max(0,
    (Math.min(dataPoints / 10, 1) * 100 * weights.dataPoints) +
    (dataQuality * weights.dataQuality) +
    (consistency * weights.consistency)
  ));
}

function calculateConsistency(scores) {
  if (scores.length < 2) return 100;
  
  const variations = scores.slice(1).map((score, i) => 
    Math.abs(score - scores[i]) / scores[i]);
  
  const avgVariation = variations.reduce((sum, val) => sum + val, 0) / variations.length;
  return Math.max(0, 100 - (avgVariation * 100));
}

function getConfidenceClass(confidence) {
  if (confidence >= 80) return 'high-confidence';
  if (confidence >= 60) return 'medium-confidence';
  return 'low-confidence';
}

function updateInsightDescription(data) {
  const insightDescription = document.querySelector('.insight-description');
  if (!insightDescription) return;

  const avgScores = {
    failbase: parseFloat(getAverageScoreFromData(data.failbase)),
    job: parseFloat(getAverageScoreFromData(data.job)),
    roleplay: parseFloat(getAverageScoreFromData(data.roleplay))
  };

  const bestQuiz = Object.entries(avgScores).reduce((a, b) => 
    avgScores[a] > avgScores[b[0]] ? a : b[0]);

  insightDescription.textContent = 
    `Based on current data, ${bestQuiz} shows the strongest performance with an average score of ${avgScores[bestQuiz].toFixed(1)}.`;
}

// Add data validation to metrics display
function displayMetrics(metrics, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!metrics || !Array.isArray(metrics)) {
    container.innerHTML = '<div class="no-data">No metrics available</div>';
    return;
  }

  // Check if the first item has a metrics array (indicating categorized data)
  if (metrics[0] && metrics[0].metrics) {
    // Data is already categorized
    const metricsHtml = metrics
      .filter(category => category.category !== 'Timeframe')
      .map(category => `
        <div class="metrics-category" data-category="${category.category}">
          <h3 class="category-title">${category.category}</h3>
          <div class="metric-grid view-mode-grid">
            ${category.metrics.map(metric => `
              <div class="metric-box">
                <h4 class="metric-name">${metric.name}</h4>
                <p class="metric-value">${metric.value}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

    container.innerHTML = metricsHtml;
  } else {
    // Handle legacy flat array format
    const metricsHtml = metrics
      .filter(metric => metric.name !== 'Timeframe')
      .map(metric => `
        <div class="metric-box">
          <h4 class="metric-name">${metric.name}</h4>
          <p class="metric-value">${metric.value}</p>
        </div>
      `).join('');

    container.innerHTML = `<div class="metric-grid view-mode-grid">${metricsHtml}</div>`;
  }
}

// Add missing showError function
function showError(message) {
  console.error(message);
  const container = document.getElementById('error-container');
  if (!container) return;

  const template = document.getElementById('error-banner-template');
  if (!template) return;

  const clone = template.content.cloneNode(true);
  const errorMessage = clone.querySelector('p');
  if (errorMessage) errorMessage.textContent = message;

  const banner = clone.querySelector('.error-banner');
  container.appendChild(banner);

  // Auto remove after 5 seconds
  setTimeout(() => banner.remove(), 5000);
}

// Additional functions and logic remain unchanged
// ...
