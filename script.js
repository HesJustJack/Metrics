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
          text: getChartTitle(currentTimeframe),
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

// Function to get a more descriptive chart title
function getChartTitle(timeframe) {
  switch(timeframe) {
    case 'today':
      return 'Today\'s Quiz Performance';
    case 'week':
      return 'Weekly Quiz Performance';
    case 'month':
      return 'Monthly Quiz Performance';
    case 'year':
      return 'Annual Quiz Performance';
    case 'all':
      return 'Overall Quiz Performance';
    default:
      return `Quiz Performance (${timeframe})`;
  }
}

// Get average score from data
function getAverageScoreFromData(data) {
  const avgScoreMetric = data.find(metric => metric.name === 'Average First Test Result');
  return avgScoreMetric ? avgScoreMetric.value : '0';
}

// Updated insight description function with better wording
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
    let insightText = "";
    
    // Check if we have valid scores to compare
    if (!isNaN(highestQuiz.value) && !isNaN(lowestQuiz.value)) {
      // Only mention comparison if there's an actual difference
      if (highestQuiz.value !== lowestQuiz.value) {
        insightText = `For the selected ${currentTimeframe} timeframe, ${highestQuiz.name} has the highest average score (${highestQuiz.value})`;
        
        // Only add lowest if there's a meaningful difference
        if (Math.abs(highestQuiz.value - lowestQuiz.value) > 0.1) {
          insightText += ` compared to ${lowestQuiz.name} (${lowestQuiz.value}).`;
        } else {
          insightText += ".";
        }
      } else {
        // If all scores are the same
        insightText = `For the selected ${currentTimeframe} timeframe, all quizzes have the same average score (${highestQuiz.value}).`;
      }
    } else {
      insightText = `Not enough data available for the ${currentTimeframe} timeframe to generate insights.`;
    }
    
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
      
      // Filter for only positive trends
      const positiveTrends = trends.filter(t => !isNaN(t.value) && t.value > 0);
      
      if (positiveTrends.length > 0) {
        // Sort by value (highest first)
        positiveTrends.sort((a, b) => b.value - a.value);
        
        const improvingQuiz = positiveTrends[0];
        
        // Only mention significant improvements (more than 1%)
        if (improvingQuiz.value > 1) {
          insightText += ` ${improvingQuiz.name} is showing improvement with a ${improvingQuiz.value}% change compared to the previous period.`;
        }
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
    
    // Check participation rates - use more measured language
    if (failbaseRate && parseFloat(failbaseRate.value) < 70) {
      items.push(`Consider strategies to increase Failbase Quiz participation (currently at ${failbaseRate.value})`);
    }
    
    if (jobRate && parseFloat(jobRate.value) < 70) {
      items.push(`Job Quiz participation could be improved (currently at ${jobRate.value})`);
    }
    
    if (roleplayRate && parseFloat(roleplayRate.value) < 70) {
      items.push(`Roleplay Quiz may need participation incentives (currently at ${roleplayRate.value})`);
    }
    
    // Check pass rates - use more varied and constructive language
    if (failbasePass && parseFloat(failbasePass.value) < 80) {
      items.push(`Review Failbase Quiz content to help improve pass rate (currently at ${failbasePass.value})`);
    }
    
    if (jobPass && parseFloat(jobPass.value) < 80) {
      items.push(`Consider additional preparation resources for Job Quiz (pass rate: ${jobPass.value})`);
    }
    
    if (roleplayPass && parseFloat(roleplayPass.value) < 80) {
      items.push(`Explore ways to better prepare staff for Roleplay Quiz (pass rate: ${roleplayPass.value})`);
    }
    
    // If no specific improvements found, add supportive suggestion
    if (items.length === 0) {
      items.push('Current metrics are on target. Consider setting more challenging goals for the next period.');
      items.push('Explore opportunities to introduce new training content or quiz modules.');
    }
    
    // Add items to the list
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      improvementList.appendChild(li);
    });
  } catch (error) {
    console.error('Error updating improvement areas:', error);
    improvementList.innerHTML = '<li>Insufficient data available to generate specific improvement recommendations.</li>';
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
}// Filter metrics based on search term
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
}// Global variables
let currentView = 'grid';
let currentTimeframe = 'year'; // Default timeframe
let allMetrics = {};
let filteredMetrics = {};
let refreshInterval = 60; // Refresh interval in seconds
let countdownTimer = null;
let remainingTime = refreshInterval;
let enableAutoRefresh = true; // Whether auto-refresh is enabled

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
  
  // Initialize navigation
  initNavigation();
  
  // Load saved settings
  loadSettings();
  
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

// Initialize navigation
function initNavigation() {
  const navLinks = document.querySelectorAll('.main-nav a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the link target
      const target = this.getAttribute('href');
      
      // Remove 'active' class from all links
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      
      // Add 'active' class to clicked link
      this.classList.add('active');
      
      // Handle navigation based on target
      if (target === '#settings') {
        showSettingsPage();
      } else if (target === '#history') {
        // In the future, we'll show the history page here
        hideSettingsPage();
      } else {
        // For Dashboard or default, show dashboard
        hideSettingsPage();
      }
    });
  });
}

// Function to show settings page and hide dashboard
function showSettingsPage() {
  // Hide dashboard content
  const dashboardOverview = document.querySelector('.dashboard-overview');
  const insightsSection = document.querySelector('.insights-section');
  
  if (dashboardOverview) dashboardOverview.style.display = 'none';
  if (insightsSection) insightsSection.style.display = 'none';
  
  // Show settings page
  let settingsPage = document.getElementById('settings-page');
  if (!settingsPage) {
    // Create settings page if it doesn't exist yet
    createSettingsPage();
    settingsPage = document.getElementById('settings-page');
  }
  
  // Show the settings page
  if (settingsPage) {
    settingsPage.style.display = 'block';
  }
  
  // Always load settings into form whenever the page is shown
  loadSettingsIntoForm();
}

// Function to hide settings page and show dashboard
function hideSettingsPage() {
  // Show dashboard content
  const dashboardOverview = document.querySelector('.dashboard-overview');
  const insightsSection = document.querySelector('.insights-section');
  
  if (dashboardOverview) dashboardOverview.style.display = 'block';
  if (insightsSection) insightsSection.style.display = 'block';
  
  // Hide settings page
  const settingsPage = document.getElementById('settings-page');
  if (settingsPage) {
    settingsPage.style.display = 'none';
  }
  
  // Hide history page if it exists
  const historyPage = document.getElementById('history-page');
  if (historyPage) {
    historyPage.style.display = 'none';
  }
}

// Function to create the settings page dynamically
function createSettingsPage() {
  console.log("Creating settings page");
  
  // Create settings page element
  const settingsPage = document.createElement('section');
  settingsPage.id = 'settings-page';
  settingsPage.className = 'main-content-section';
  
  // Set HTML content for settings page
  settingsPage.innerHTML = `
    <div class="container">
      <div class="section-header">
        <h2><i class="fas fa-cog"></i> Dashboard Settings</h2>
        <p class="section-description">Customize your dashboard preferences and settings.</p>
      </div>
      
      <div id="settings-success-message" class="success-message">
        <i class="fas fa-check-circle"></i>
        <span>Settings saved successfully!</span>
      </div>
      
      <div class="settings-container">
        <form id="settings-form" class="settings-form">
          <!-- Display Settings -->
          <div class="settings-section">
            <h3><i class="fas fa-desktop"></i> Display Settings</h3>
            
            <div class="form-group">
              <label for="defaultTimeframe">Default Timeframe:</label>
              <select id="defaultTimeframe" name="defaultTimeframe">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year" selected>This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="defaultView">Default View:</label>
              <select id="defaultView" name="defaultView">
                <option value="grid" selected>Grid</option>
                <option value="list">List</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="darkMode">
                <input type="checkbox" id="darkMode" name="darkMode" checked>
                Use Dark Mode
              </label>
            </div>
          </div>
          
          <!-- Auto-Refresh Settings -->
          <div class="settings-section">
            <h3><i class="fas fa-sync-alt"></i> Auto-Refresh Settings</h3>
            
            <div class="form-group">
              <label for="refreshInterval">Refresh Interval (seconds):</label>
              <input type="number" id="refreshInterval" name="refreshInterval" min="10" max="3600" value="60">
              <small>Minimum 10 seconds, maximum 1 hour (3600 seconds)</small>
            </div>
            
            <div class="form-group">
              <label for="enableAutoRefresh">
                <input type="checkbox" id="enableAutoRefresh" name="enableAutoRefresh" checked>
                Enable Auto-Refresh
              </label>
            </div>
          </div>
          
          <!-- Data Display Settings -->
          <div class="settings-section">
            <h3><i class="fas fa-chart-pie"></i> Data Display Settings</h3>
            
            <div class="form-group">
              <label for="showImprovementAreas">
                <input type="checkbox" id="showImprovementAreas" name="showImprovementAreas" checked>
                Show Improvement Areas
              </label>
            </div>
            
            <div class="form-group">
              <label for="showPerformanceChart">
                <input type="checkbox" id="showPerformanceChart" name="showPerformanceChart" checked>
                Show Performance Chart
              </label>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="settings-actions">
            <button type="submit" class="primary-btn">
              <i class="fas fa-save"></i> Save Settings
            </button>
            <button type="button" id="reset-settings-btn" class="secondary-btn">
              <i class="fas fa-undo"></i> Reset to Defaults
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add the settings page to the main content area
  document.querySelector('.main-content').appendChild(settingsPage);
  
  // Hide the success message by default
  const successMessage = document.getElementById('settings-success-message');
  if (successMessage) {
    successMessage.style.display = 'none';
  }
  
  // Initialize settings form events
  initSettingsForm();
  
  console.log("Settings page created and initialized");
}

// Function to initialize settings form
function initSettingsForm() {
  const settingsForm = document.getElementById('settings-form');
  const resetButton = document.getElementById('reset-settings-btn');
  
  if (settingsForm) {
    // Add event listener for form submission
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveSettings();
      showSuccessMessage();
    });
    
    console.log("Settings form submit event listener added");
  } else {
    console.error("Settings form not found");
  }
  
  if (resetButton) {
    // Add event listener for reset button
    resetButton.addEventListener('click', function() {
      resetSettingsToDefaults();
    });
    
    console.log("Reset button event listener added");
  } else {
    console.error("Reset button not found");
  }
}

// Function to show success message
function showSuccessMessage() {
  // Try to find the existing success message element
  let successMessage = document.getElementById('settings-success-message');
  
  // If it doesn't exist, create it
  if (!successMessage) {
    successMessage = document.createElement('div');
    successMessage.id = 'settings-success-message';
    successMessage.className = 'success-message inline-success';
    successMessage.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>Settings saved successfully!</span>
    `;
    
    // Add the element after the save button
    const settingsActions = document.querySelector('.settings-actions');
    if (settingsActions) {
      settingsActions.appendChild(successMessage);
    }
  }
  
  // Show the success message
  successMessage.style.display = 'flex';
  successMessage.classList.add('show');
  
  // Auto hide after 3 seconds
  setTimeout(function() {
    successMessage.classList.remove('show');
    setTimeout(function() {
      successMessage.style.display = 'none';
    }, 300);
  }, 3000);
}

// Function to load settings from localStorage into form
function loadSettingsIntoForm() {
  console.log("Loading settings into form");
  
  // Get form elements
  const defaultTimeframeSelect = document.getElementById('defaultTimeframe');
  const defaultViewSelect = document.getElementById('defaultView');
  const refreshIntervalInput = document.getElementById('refreshInterval');
  const darkModeCheckbox = document.getElementById('darkMode');
  const enableAutoRefreshCheckbox = document.getElementById('enableAutoRefresh');
  const showImprovementAreasCheckbox = document.getElementById('showImprovementAreas');
  const showPerformanceChartCheckbox = document.getElementById('showPerformanceChart');
  
  // Check if elements exist
  if (!defaultTimeframeSelect || !defaultViewSelect || !refreshIntervalInput || 
      !darkModeCheckbox || !enableAutoRefreshCheckbox || 
      !showImprovementAreasCheckbox || !showPerformanceChartCheckbox) {
    console.error("Form elements not found", {
      defaultTimeframeSelect,
      defaultViewSelect,
      refreshIntervalInput,
      darkModeCheckbox,
      enableAutoRefreshCheckbox,
      showImprovementAreasCheckbox,
      showPerformanceChartCheckbox
    });
    return;
  }
  
  try {
    // Get saved settings
    const savedSettings = JSON.parse(localStorage.getItem('quizAnalyticsSettings') || '{}');
    console.log("Saved settings:", savedSettings);
    
    // Set form values based on saved settings
    if (savedSettings.defaultTimeframe) {
      defaultTimeframeSelect.value = savedSettings.defaultTimeframe;
    }
    
    if (savedSettings.defaultView) {
      defaultViewSelect.value = savedSettings.defaultView;
    }
    
    if (savedSettings.refreshInterval) {
      refreshIntervalInput.value = savedSettings.refreshInterval;
    }
    
    // Set checkbox values (with default to true if not specified)
    darkModeCheckbox.checked = savedSettings.darkMode !== false;
    enableAutoRefreshCheckbox.checked = savedSettings.enableAutoRefresh !== false;
    showImprovementAreasCheckbox.checked = savedSettings.showImprovementAreas !== false;
    showPerformanceChartCheckbox.checked = savedSettings.showPerformanceChart !== false;
    
    console.log("Settings loaded into form successfully");
  } catch (error) {
    console.error('Error loading settings into form:', error);
  }
}

// Function to save settings from form to localStorage
function saveSettings() {
  try {
    // Get form values
    const defaultTimeframe = document.getElementById('defaultTimeframe').value;
    const defaultView = document.getElementById('defaultView').value;
    const newRefreshInterval = parseInt(document.getElementById('refreshInterval').value, 10);
    const darkMode = document.getElementById('darkMode').checked;
    const newEnableAutoRefresh = document.getElementById('enableAutoRefresh').checked;
    const showImprovementAreas = document.getElementById('showImprovementAreas').checked;
    const showPerformanceChart = document.getElementById('showPerformanceChart').checked;
    
    // Validate refresh interval
    const validRefreshInterval = Math.max(10, Math.min(3600, newRefreshInterval || 60));
    
    // Create settings object
    const settings = {
      defaultTimeframe,
      defaultView,
      refreshInterval: validRefreshInterval,
      darkMode,
      enableAutoRefresh: newEnableAutoRefresh,
      showImprovementAreas,
      showPerformanceChart
    };
    
    // Save to localStorage
    localStorage.setItem('quizAnalyticsSettings', JSON.stringify(settings));
    
    // Apply settings
    applySettings(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Function to apply settings to the dashboard
function applySettings(settings) {
  // Apply timeframe if different from current
  if (settings.defaultTimeframe !== currentTimeframe) {
    currentTimeframe = settings.defaultTimeframe;
    document.getElementById('timeRange').value = currentTimeframe;
    fetchMetrics();
  }
  
  // Apply view mode if different from current
  if (settings.defaultView !== currentView) {
    currentView = settings.defaultView;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === currentView) {
        btn.classList.add('active');
      }
    });
    
    // Update view
    updateMetricGridView();
  }
  
  // Apply theme
  if (settings.darkMode) {
    enableDarkTheme();
  } else {
    enableLightTheme();
  }
  
  // Apply refresh interval and auto-refresh setting
  if (settings.refreshInterval !== refreshInterval || settings.enableAutoRefresh !== enableAutoRefresh) {
    refreshInterval = settings.refreshInterval;
    enableAutoRefresh = settings.enableAutoRefresh;
    
    // Clear existing timer
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    
    // Restart timer if auto-refresh is enabled
    if (enableAutoRefresh) {
      startRefreshTimer();
    } else {
      // Update display to show "paused"
      const countdownSpan = document.querySelector('.refresh-btn .countdown');
      if (countdownSpan) {
        countdownSpan.textContent = ' (paused)';
      }
    }
  }
  
  // Apply data display settings
  if (!settings.showImprovementAreas) {
    document.querySelector('.improvement-list')?.parentElement?.style.setProperty('display', 'none');
  } else {
    document.querySelector('.improvement-list')?.parentElement?.style.removeProperty('display');
  }
  
  if (!settings.showPerformanceChart) {
    document.querySelector('#performance-chart')?.parentElement?.style.setProperty('display', 'none');
  } else {
    document.querySelector('#performance-chart')?.parentElement?.style.removeProperty('display');
  }
}

// Function to reset settings to defaults
function resetSettingsToDefaults() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    // Default settings
    const defaultSettings = {
      defaultTimeframe: 'year',
      defaultView: 'grid',
      refreshInterval: 60,
      darkMode: true,
      enableAutoRefresh: true,
      showImprovementAreas: true,
      showPerformanceChart: true
    };
    
    // Save to localStorage
    localStorage.setItem('quizAnalyticsSettings', JSON.stringify(defaultSettings));
    
    // Load settings into form
    loadSettingsIntoForm();
    
    // Apply settings
    applySettings(defaultSettings);
    
    // Show success message
    showSuccessMessage();
  }
}

// Function to load settings on page load
function loadSettings() {
  try {
    // Get saved settings
    const savedSettings = JSON.parse(localStorage.getItem('quizAnalyticsSettings') || '{}');
    
    // Apply default values for missing settings
    const settings = {
      defaultTimeframe: savedSettings.defaultTimeframe || 'year',
      defaultView: savedSettings.defaultView || 'grid',
      refreshInterval: savedSettings.refreshInterval || 60,
      darkMode: savedSettings.darkMode !== false,
      enableAutoRefresh: savedSettings.enableAutoRefresh !== false,
      showImprovementAreas: savedSettings.showImprovementAreas !== false,
      showPerformanceChart: savedSettings.showPerformanceChart !== false
    };
    
    // Apply settings
    applySettings(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Initialize theme toggle functionality
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  
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
}

function enableLightTheme() {
  const root = document.documentElement;
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
  const root = document.documentElement;
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
  
  // Make sure the click event calls resetRefreshTimer
  refreshBtn.addEventListener('click', function() {
    fetchMetrics();
    resetRefreshTimer();
  });
}

// Start the refresh countdown timer
function startRefreshTimer() {
  // Clear any existing timer
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  
  // Only start timer if auto-refresh is enabled
  if (!enableAutoRefresh) {
    const countdownSpan = document.querySelector('.refresh-btn .countdown');
    if (countdownSpan) {
      countdownSpan.textContent = ' (paused)';
    }
    return;
  }
  
  // Reset remaining time
  remainingTime = refreshInterval;
  updateCountdownDisplay();
  
  // Start new timer
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
    if (!enableAutoRefresh) {
      countdownSpan.textContent = ' (paused)';
    } else {
      countdownSpan.textContent = ` (${remainingTime}s)`;
    }
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

// Improved function for updating the timeframe indicator text
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
        periodText = 'previous week';
        break;
      case 'month':
        periodText = 'previous month';
        break;
      case 'year':
        periodText = 'previous year';
        break;
      case 'all':
        periodText = 'overall average';
        break;
      default:
        periodText = 'previous period';
    }
    
    // Update the parent's text content with more natural wording
    const parentText = el.parentElement.textContent;
    const newText = parentText.replace(/from [^)]+/, `compared to ${periodText}`);
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
