// Global variables
let currentView = 'grid';
let currentTimeframe = 'year'; // Default timeframe
let allMetrics = {};
let filteredMetrics = {};
let refreshInterval = 60; // Refresh interval in seconds
let countdownTimer = null;
let remainingTime = refreshInterval;

// API endpoint for the Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbyRTgsufzTG5NZUA2BPKQsuw0tDs_ZZmtVInU9x_uUhb4RRgs7MtZ0W77VgWiW-fi9w/exec';

// DOM ready function
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tabs
  initTabs();
  
  // Initialize view toggle
  initViewToggle();
  
  // Initialize search functionality
  initSearch();
  
  // Initialize timeframe selector
  initTimeframeSelector();
  
  // Fetch metrics on page load
  fetchMetrics();
  
  // Initialize theme toggle
  initThemeToggle();
  
  // Initialize refresh button with countdown
  initRefreshButton();
  
  // Start the refresh countdown timer
  startRefreshTimer();
});

// Initialize tab functionality
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Get tab ID
      const tabId = this.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to current tab and content
      this.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      // Update summary cards based on the selected tab
      updateSummaryCards(tabId);
    });
  });
}

// Initialize view toggle functionality
function initViewToggle() {
  const viewButtons = document.querySelectorAll('.view-btn');
  
  viewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Get view mode
      const viewMode = this.getAttribute('data-view');
      
      // Update current view
      currentView = viewMode;
      
      // Update active button
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Update metric grids
      updateMetricGridView();
    });
  });
}

// Initialize search functionality
function initSearch() {
  const searchInput = document.getElementById('metric-search');
  
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    filterMetrics(searchTerm);
  });
}

// Initialize timeframe selector
function initTimeframeSelector() {
  const timeframeSelect = document.getElementById('timeRange');
  
  // Set initial value
  timeframeSelect.value = currentTimeframe;
  
  timeframeSelect.addEventListener('change', function() {
    currentTimeframe = this.value;
    fetchMetrics();
  });
}

// Initialize theme toggle functionality
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    enableLightTheme();
  }
  
  themeToggle.addEventListener('click', function() {
    const icon = this.querySelector('i');
    
    if (icon.classList.contains('fa-moon')) {
      // Switch to light theme
      enableLightTheme();
      localStorage.setItem('theme', 'light');
    } else {
      // Switch back to dark theme
      enableDarkTheme();
      localStorage.setItem('theme', 'dark');
    }
  });
  
  function enableLightTheme() {
    root.style.setProperty('--primary-color', '#2196f3');
    root.style.setProperty('--primary-dark', '#1976d2');
    root.style.setProperty('--primary-light', '#bbdefb');
    root.style.setProperty('--text-primary', '#333333');
    root.style.setProperty('--text-secondary', '#666666');
    root.style.setProperty('--bg-primary', '#f5f5f5');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--bg-card', '#ffffff');
    
    document.querySelector('.theme-toggle i').classList.remove('fa-moon');
    document.querySelector('.theme-toggle i').classList.add('fa-sun');
  }
  
  function enableDarkTheme() {
    root.style.setProperty('--primary-color', '#03a9f4');
    root.style.setProperty('--primary-dark', '#0288d1');
    root.style.setProperty('--primary-light', '#b3e5fc');
    root.style.setProperty('--text-primary', '#e0e0e0');
    root.style.setProperty('--text-secondary', '#b0b0b0');
    root.style.setProperty('--bg-primary', '#121212');
    root.style.setProperty('--bg-secondary', '#1e1e1e');
    root.style.setProperty('--bg-card', '#272727');
    
    document.querySelector('.theme-toggle i').classList.remove('fa-sun');
    document.querySelector('.theme-toggle i').classList.add('fa-moon');
  }
}

// Initialize refresh button with countdown
function initRefreshButton() {
  const refreshBtn = document.querySelector('.refresh-btn');
  if (!refreshBtn) return;
  
  // Create countdown span if it doesn't exist
  let countdownSpan = refreshBtn.querySelector('.countdown');
  if (!countdownSpan) {
    countdownSpan = document.createElement('span');
    countdownSpan.className = 'countdown';
    refreshBtn.appendChild(countdownSpan);
  }
  
  // Update the initial countdown display
  updateCountdownDisplay();
}

// Start the refresh countdown timer
function startRefreshTimer() {
  // Clear any existing interval
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  
  // Reset remaining time
  remainingTime = refreshInterval;
  updateCountdownDisplay();
  
  // Start new interval
  countdownTimer = setInterval(function() {
    remainingTime--;
    updateCountdownDisplay();
    
    if (remainingTime <= 0) {
      fetchMetrics();
      resetRefreshTimer();
    }
  }, 1000);
}

// Reset the refresh timer
function resetRefreshTimer() {
  remainingTime = refreshInterval;
  updateCountdownDisplay();
}

// Update countdown display
function updateCountdownDisplay() {
  const countdownSpan = document.querySelector('.refresh-btn .countdown');
  if (countdownSpan) {
    countdownSpan.textContent = ` (${remainingTime}s)`;
  }
}

// Fetch metrics from the API with timeframe
function fetchMetrics() {
  showLoading();
  
  // Construct URL with timeframe parameter
  const url = `${API_URL}?timeframe=${currentTimeframe}`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Data received:', data);
      allMetrics = data;
      filteredMetrics = { ...data };
      
      // Populate metrics for each tab
      populateMetrics('failbase', data.failbase);
      populateMetrics('job', data.job);
      populateMetrics('roleplay', data.roleplay);
      
      // Update summary cards for the active tab
      const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
      updateSummaryCards(activeTab);
      
      // Initialize performance chart
      initPerformanceChart(data);
      
      // Update timeframe indicator
      updateTimeframeIndicator();
      
      hideLoading();
      
      // Reset the refresh timer when new data is loaded
      resetRefreshTimer();
    })
    .catch(error => {
      console.error('Error fetching metrics:', error);
      hideLoading();
      showErrorMessage(`Failed to load metrics data for ${currentTimeframe}. Please try again later.`);
    });
}

// Update timeframe indicator in UI
function updateTimeframeIndicator() {
  // Find all trend elements and update them
  const trendElements = document.querySelectorAll('.card-trend .trend-value');
  
  trendElements.forEach(el => {
    let periodText = '';
    
    switch(currentTimeframe) {
      case 'today':
        periodText = 'yesterday';
        break;
      case 'week':
        periodText = 'last week';
        break;
      case 'month':
        periodText = 'last month';
        break;
      case 'year':
        periodText = 'last year';
        break;
      case 'all':
        periodText = 'average';
        break;
      default:
        periodText = 'last period';
    }
    
    // Update the parent's text content
    const parentText = el.parentElement.textContent;
    const newText = parentText.replace(/from [^)]+/, `from ${periodText}`);
    el.parentElement.innerHTML = el.parentElement.innerHTML.replace(parentText, newText);
  });
}

// Populate metrics for a specific tab
function populateMetrics(tabId, metrics) {
  const metricContainer = document.getElementById(`${tabId}-metrics`);
  
  // Clear existing content
  metricContainer.innerHTML = '';
  
  // Check if metrics exist
  if (!metrics || metrics.length === 0) {
    metricContainer.innerHTML = '<div class="no-data">No metrics available for this quiz.</div>';
    return;
  }
  
  // If first metric is a "No Data" message, show that
  if (metrics.length === 1 && metrics[0].name === 'No Data') {
    metricContainer.innerHTML = `<div class="no-data">${metrics[0].value}</div>`;
    return;
  }
  
  // Add metrics to the container (skip the Timeframe metric)
  metrics.filter(metric => metric.name !== 'Timeframe').forEach(metric => {
    const metricBox = document.createElement('div');
    metricBox.className = `metric-box view-mode-${currentView}`;
    
    if (currentView === 'grid') {
      metricBox.innerHTML = `
        <h4 class="metric-name">${metric.name}</h4>
        <div class="metric-value">${metric.value}</div>
      `;
    } else {
      metricBox.innerHTML = `
        <h4 class="metric-name">${metric.name}</h4>
        <div class="metric-value">${metric.value}</div>
      `;
    }
    
    metricContainer.appendChild(metricBox);
  });
}

// Update metric grid view
function updateMetricGridView() {
  document.querySelectorAll('.metric-grid').forEach(grid => {
    if (currentView === 'grid') {
      grid.className = 'metric-grid view-mode-grid';
    } else {
      grid.className = 'metric-grid view-mode-list';
    }
  });
  
  document.querySelectorAll('.metric-box').forEach(box => {
    box.className = `metric-box view-mode-${currentView}`;
  });
  
  // Re-populate metrics with the current view
  if (filteredMetrics.failbase) {
    populateMetrics('failbase', filteredMetrics.failbase);
    populateMetrics('job', filteredMetrics.job);
    populateMetrics('roleplay', filteredMetrics.roleplay);
  }
}

// Filter metrics based on search term
function filterMetrics(searchTerm) {
  if (!searchTerm) {
    filteredMetrics = { ...allMetrics };
  } else {
    filteredMetrics = {
      failbase: allMetrics.failbase ? allMetrics.failbase.filter(metric => 
        metric.name.toLowerCase().includes(searchTerm)) : [],
      job: allMetrics.job ? allMetrics.job.filter(metric => 
        metric.name.toLowerCase().includes(searchTerm)) : [],
      roleplay: allMetrics.roleplay ? allMetrics.roleplay.filter(metric => 
        metric.name.toLowerCase().includes(searchTerm)) : []
    };
  }
  
  // Re-populate metrics with filtered data
  populateMetrics('failbase', filteredMetrics.failbase);
  populateMetrics('job', filteredMetrics.job);
  populateMetrics('roleplay', filteredMetrics.roleplay);
}

// Get trend indicators and values based on timeframe
function getTrendData(metrics, tabId) {
  const weeklyTrendMetric = metrics.find(m => m.name === 'Weekly Trend');
  
  if (weeklyTrendMetric) {
    const trendValue = parseFloat(weeklyTrendMetric.value);
    
    if (!isNaN(trendValue)) {
      return {
        isPositive: trendValue >= 0,
        value: weeklyTrendMetric.value
      };
    }
  }
  
  // Default trend if not found
  return {
    isPositive: true,
    value: '0%'
  };
}

// Update summary cards based on the selected tab
function updateSummaryCards(tabId) {
  let metrics;
  
  switch (tabId) {
    case 'failbase':
      metrics = allMetrics.failbase || [];
      break;
    case 'job':
      metrics = allMetrics.job || [];
      break;
    case 'roleplay':
      metrics = allMetrics.roleplay || [];
      break;
    default:
      metrics = allMetrics.failbase || [];
  }
  
  // Find total entries
  const totalEntriesMetric = metrics.find(m => m.name === 'Total Entries');
  if (totalEntriesMetric) {
    document.querySelector('#total-attempts .card-value').textContent = totalEntriesMetric.value;
    
    // Update trend
    const totalTrend = getTrendData(metrics, tabId);
    const totalTrendElement = document.querySelector('#total-attempts .card-trend');
    
    totalTrendElement.classList.remove('positive', 'negative');
    totalTrendElement.classList.add(totalTrend.isPositive ? 'positive' : 'negative');
    
    const iconElement = totalTrendElement.querySelector('i');
    iconElement.classList.remove('fa-arrow-up', 'fa-arrow-down');
    iconElement.classList.add(totalTrend.isPositive ? 'fa-arrow-up' : 'fa-arrow-down');
    
    totalTrendElement.querySelector('.trend-value').textContent = totalTrend.value;
  }
  
  // Find completion rate
  let completionRateMetric;
  if (tabId === 'failbase') {
    completionRateMetric = metrics.find(m => m.name === 'General Participation Rate');
  } else if (tabId === 'job') {
    completionRateMetric = metrics.find(m => m.name === 'General Participation Rate');
  } else {
    completionRateMetric = metrics.find(m => m.name === 'General Participation Rate');
  }
  
  if (completionRateMetric) {
    document.querySelector('#completion-rate .card-value').textContent = completionRateMetric.value;
    
    // Update trend (assume positive for completion rate)
    const completionTrend = { isPositive: true, value: '5%' };
    const completionTrendElement = document.querySelector('#completion-rate .card-trend');
    
    completionTrendElement.classList.remove('positive', 'negative');
    completionTrendElement.classList.add(completionTrend.isPositive ? 'positive' : 'negative');
    
    const iconElement = completionTrendElement.querySelector('i');
    iconElement.classList.remove('fa-arrow-up', 'fa-arrow-down');
    iconElement.classList.add(completionTrend.isPositive ? 'fa-arrow-up' : 'fa-arrow-down');
    
    completionTrendElement.querySelector('.trend-value').textContent = completionTrend.value;
  }
  
  // Find average score
  const avgScoreMetric = metrics.find(m => m.name === 'Average First Test Result');
  if (avgScoreMetric) {
    document.querySelector('#avg-score .card-value').textContent = avgScoreMetric.value;
    
    // Update trend (assume negative for average score as example)
    const scoreTrend = { isPositive: false, value: '2%' };
    const scoreTrendElement = document.querySelector('#avg-score .card-trend');
    
    scoreTrendElement.classList.remove('positive', 'negative');
    scoreTrendElement.classList.add(scoreTrend.isPositive ? 'positive' : 'negative');
    
    const iconElement = scoreTrendElement.querySelector('i');
    iconElement.classList.remove('fa-arrow-up', 'fa-arrow-down');
    iconElement.classList.add(scoreTrend.isPositive ? 'fa-arrow-up' : 'fa-arrow-down');
    
    scoreTrendElement.querySelector('.trend-value').textContent = scoreTrend.value;
  }
}

// Initialize performance chart
function initPerformanceChart(data) {
  const chartContainer = document.getElementById('performance-chart');
  
  // Clear existing content
  chartContainer.innerHTML = '';
  
  // Create canvas for chart
  const canvas = document.createElement('canvas');
  canvas.id = 'quizScoreChart';
  chartContainer.appendChild(canvas);
  
  // Check if we have valid data
  if (!data.failbase || !data.job || !data.roleplay) {
    chartContainer.innerHTML = '<div class="chart-placeholder"><i class="fas fa-chart-line"></i><p>No data available for the selected timeframe</p></div>';
    return;
  }
  
  // Prepare data for chart
  const chartData = {
    labels: ['Failbase Quiz', 'Job Quiz', 'Roleplay Quiz'],
    datasets: [{
      label: 'Average Score',
      data: [
        parseFloat(getAverageScoreFromData(data.failbase)),
        parseFloat(getAverageScoreFromData(data.job)),
        parseFloat(getAverageScoreFromData(data.roleplay))
      ],
      backgroundColor: [
        'rgba(3, 169, 244, 0.6)',
        'rgba(255, 87, 34, 0.6)',
        'rgba(76, 175, 80, 0.6)'
      ],
      borderColor: [
        'rgba(3, 169, 244, 1)',
        'rgba(255, 87, 34, 1)',
        'rgba(76, 175, 80, 1)'
      ],
      borderWidth: 1
    }]
  };
  
  // Create chart
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 20,
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
          }
        },
        title: {
          display: true,
          text: `Quiz Performance (${currentTimeframe})`,
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
          font: {
            size: 16
          }
        }
      }
    }
  });
  
  // Update insight description
  updateInsightDescription(data);
}

// Get average score from data
function getAverageScoreFromData(data) {
  const avgScoreMetric = data.find(metric => metric.name === 'Average First Test Result');
  return avgScoreMetric ? avgScoreMetric.value : '0';
}

// Update insight description
function updateInsightDescription(data) {
  const insightDescription = document.querySelector('.insight-description');
  if (!insightDescription) return;
  
  try {
    // Get average scores
    const failbaseAvg = parseFloat(getAverageScoreFromData(data.failbase));
    const jobAvg = parseFloat(getAverageScoreFromData(data.job));
    const roleplayAvg = parseFloat(getAverageScoreFromData(data.roleplay));
    
    // Find highest and lowest performing quizzes
    const scores = [
      { name: 'Failbase Quiz', value: failbaseAvg },
      { name: 'Job Quiz', value: jobAvg },
      { name: 'Roleplay Quiz', value: roleplayAvg }
    ];
    
    scores.sort((a, b) => b.value - a.value);
    
    const highestQuiz = scores[0];
    const lowestQuiz = scores[scores.length - 1];
    
    // Create insight text
    let insightText = `Based on the data for ${currentTimeframe}, ${highestQuiz.name} has the highest average score of ${highestQuiz.value}, while ${lowestQuiz.name} has the lowest average of ${lowestQuiz.value}.`;
    
    // Add trend insight if available
    const failbaseTrend = data.failbase.find(m => m.name === 'Weekly Trend');
    const jobTrend = data.job.find(m => m.name === 'Weekly Trend');
    const roleplayTrend = data.roleplay.find(m => m.name === 'Weekly Trend');
    
    if (failbaseTrend && jobTrend && roleplayTrend) {
      const fbTrend = parseFloat(failbaseTrend.value);
      const jTrend = parseFloat(jobTrend.value);
      const rpTrend = parseFloat(roleplayTrend.value);
      
      const trends = [
        { name: 'Failbase Quiz', value: fbTrend },
        { name: 'Job Quiz', value: jTrend },
        { name: 'Roleplay Quiz', value: rpTrend }
      ];
      
      trends.sort((a, b) => b.value - a.value);
      
      const improvingQuiz = trends[0];
      
      if (improvingQuiz.value > 0) {
        insightText += ` ${improvingQuiz.name} is showing the strongest improvement with a ${improvingQuiz.value}% increase.`;
      }
    }
    
    insightDescription.textContent = insightText;
    
    // Update improvement areas
    updateImprovementAreas(data);
  } catch (error) {
    console.error('Error updating insights:', error);
    insightDescription.textContent = 'Unable to generate insights from the current data.';
  }
}

// Update improvement areas list
function updateImprovementAreas(data) {
  const improvementList = document.querySelector('.improvement-list');
  if (!improvementList) return;
  
  // Clear existing items
  improvementList.innerHTML = '';
  
  try {
    // Get participation rates
    const failbaseRate = data.failbase.find(m => m.name === 'General Participation Rate');
    const jobRate = data.job.find(m => m.name === 'General Participation Rate');
    const roleplayRate = data.roleplay.find(m => m.name === 'General Participation Rate');
    
    // Get pass rates
    const failbasePass = data.failbase.find(m => m.name === 'Pass Rate');
    const jobPass = data.job.find(m => m.name === 'Pass Rate');
    const roleplayPass = data.roleplay.find(m => m.name === 'Pass Rate');
    
    // Create improvement items
    const items = [];
    
    // Check participation rates
    if (failbaseRate && parseFloat(failbaseRate.value) < 70) {
      items.push('Increase participation in Failbase Quiz (currently ' + failbaseRate.value + ')');
    }
    
    if (jobRate && parseFloat(jobRate.value) < 70) {
      items.push('Improve participation in Job Quiz (currently ' + jobRate.value + ')');
    }
    
    if (roleplayRate && parseFloat(roleplayRate.value) < 70) {
      items.push('Boost participation in Roleplay Quiz (currently ' + roleplayRate.value + ')');
    }
    
    // Check pass rates
    if (failbasePass && parseFloat(failbasePass.value) < 80) {
      items.push('Work on improving Failbase Quiz pass rate (currently ' + failbasePass.value + ')');
    }
    
    if (jobPass && parseFloat(jobPass.value) < 80) {
      items.push('Focus on increasing Job Quiz pass rate (currently ' + jobPass.value + ')');
    }
    
    if (roleplayPass && parseFloat(roleplayPass.value) < 80) {
      items.push('Enhance Roleplay Quiz pass rate (currently ' + roleplayPass.value + ')');
    }
    
    // If no specific improvements found, add general suggestion
    if (items.length === 0) {
      items.push('All metrics are performing well. Consider setting higher targets for next period.');
    }
    
    // Add items to the list
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      improvementList.appendChild(li);
    });
  } catch (error) {
    console.error('Error updating improvement areas:', error);
    improvementList.innerHTML = '<li>Unable to generate improvement suggestions from the current data.</li>';
  }
}

// Show loading overlay
function showLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('show');
  }
}

// Hide loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('show');
  }
}

// Show error message
function showErrorMessage(message) {
  // Get error banner template
  const template = document.getElementById('error-banner-template');
  if (!template) return;
  
  // Create error banner from template
  const errorBanner = template.content.cloneNode(true);
  
  // Set message
  errorBanner.querySelector('p').textContent = message;
  
  // Add to DOM
  document.body.appendChild(errorBanner);
  
  // Set event listener for close button
  const closeButton = document.body.querySelector('.error-banner button');
  closeButton.addEventListener('click', function() {
    document.body.removeChild(document.querySelector('.error-banner'));
  });
  
  // Auto-hide after 5 seconds
  setTimeout(function() {
    const banner = document.querySelector('.error-banner');
    if (banner) {
      document.body.removeChild(banner);
    }
  }, 5000);
}

// Add CSS for countdown timer
const countdownStyle = document.createElement('style');
countdownStyle.textContent = `
  .refresh-btn .countdown {
    opacity: 0.8;
    margin-left: 5px;
    font-size: 0.9em;
  }
`;
document.head.appendChild(countdownStyle);
