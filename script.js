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
  
  return Object.entries(allMetrics).map(([quizType, metrics]) => {
    const performanceMetrics = metrics.find(category => 
      category.category === 'Performance')?.metrics || [];
    const progressMetrics = metrics.find(category => 
      category.category === 'Progress')?.metrics || [];
    
    const avgScore = parseFloat(performanceMetrics.find(m => 
      m.name === 'Average First Test Result')?.value) || 0;
    const perfectScores = parseInt(performanceMetrics.find(m => 
      m.name === 'Perfect Scores')?.value) || 0;
    const firstTimePassRate = parseFloat(progressMetrics.find(m => 
      m.name === 'First-Time Pass Rate')?.value) || 0;
    
    return {
      title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Analysis`,
      description: `Average score: ${avgScore.toFixed(1)}, Perfect scores: ${perfectScores}, First-time pass rate: ${firstTimePassRate}%`
    };
  });
}

function updatePatternAnalysis() {
  const patterns = analyzePatterns();
  const patternsList = document.getElementById('patternsList');
  if (!patternsList) return;

  patternsList.innerHTML = patterns.map(pattern => `
    <div class="pattern-item">
      <h4>${pattern.title}</h4>
      <p>${pattern.description}</p>
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
    const performanceMetrics = metrics.find(category => 
      category.category === 'Performance')?.metrics || [];
    const progressMetrics = metrics.find(category => 
      category.category === 'Progress')?.metrics || [];
    
    const avgScore = parseFloat(performanceMetrics.find(m => 
      m.name === 'Average First Test Result')?.value) || 0;
    const firstTimePassRate = parseFloat(progressMetrics.find(m => 
      m.name === 'First-Time Pass Rate')?.value) || 0;
    
    let recommendation;
    if (avgScore < 14) {
      recommendation = 'Focus on improving initial scores through better preparation.';
    } else if (firstTimePassRate < 70) {
      recommendation = 'Maintain good average scores while working on consistency.';
    } else {
      recommendation = 'Strong performance. Consider helping others improve.';
    }
    
    return {
      title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Insights`,
      description: recommendation
    };
  });

  predictiveInsights.innerHTML = insights.map(insight => `
    <div class="insight-item">
      <h4>${insight.title}</h4>
      <p>${insight.description}</p>
    </div>
  `).join('');
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
