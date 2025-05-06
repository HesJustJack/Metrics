// Global variables
let currentView = 'grid';
let allMetrics = {};
let filteredMetrics = {};

// API endpoint for the Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbzKwoQTrSqTjS9DiGnJ7GQZUCcVbDI0-kZb36vxHKjfB1yirvQJqb2P4mRKs98EX9GZ/exec';

// DOM ready function
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tabs
  initTabs();
  
  // Initialize view toggle
  initViewToggle();
  
  // Initialize search functionality
  initSearch();
  
  // Fetch metrics on page load
  fetchMetrics();
  
  // Initialize theme toggle
  initThemeToggle();
  
  // Set up refresh interval (every 60 seconds)
  setInterval(fetchMetrics, 60000);
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

// Fetch metrics from the API
function fetchMetrics() {
  showLoading();
  
  fetch(API_URL)
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
      
      hideLoading();
    })
    .catch(error => {
      console.error('Error fetching metrics:', error);
      hideLoading();
      showErrorMessage('Failed to load metrics data. Please try again later.');
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
  
  // Add metrics to the container
  metrics.forEach(metric => {
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
  }
  
  // Find average score
  const avgScoreMetric = metrics.find(m => m.name === 'Average First Test Result');
  if (avgScoreMetric) {
    document.querySelector('#avg-score .card-value').textContent = avgScoreMetric.value;
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
        }
      }
    }
  });
  
  // Update insight description
  updateInsightDescription(data);
}

// Helper function to extract average score from data
function getAverageScoreFromData(data) {
  if (!data) return 0;
  
  const avgScoreMetric = data.find(m => m.name === 'Average First Test Result');
  if (avgScoreMetric && avgScoreMetric.value !== 'N/A') {
    return avgScoreMetric.value;
  }
  
  return 0;
}

// Update insight description based on data
function updateInsightDescription(data) {
  let description = '';
  
  // Find the quiz with highest average score
  const scores = [
    { name: 'Failbase', score: parseFloat(getAverageScoreFromData(data.failbase)) },
    { name: 'Job', score: parseFloat(getAverageScoreFromData(data.job)) },
    { name: 'Roleplay', score: parseFloat(getAverageScoreFromData(data.roleplay)) }
  ];
  
  scores.sort((a, b) => b.score - a.score);
  
  // Get improvement rates
  const failbaseImprovement = data.failbase.find(m => m.name === 'Improvement Rate')?.value || 'N/A';
  const jobImprovement = data.job.find(m => m.name === 'Improvement Rate')?.value || 'N/A';
  const roleplayImprovement = data.roleplay.find(m => m.name === 'Improvement Rate')?.value || 'N/A';
  
  // Create insight
  description = `${scores[0].name} Quiz has the highest average score at ${scores[0].score}. 
                 Improvement rates: Failbase (${failbaseImprovement}), Job (${jobImprovement}), 
                 Roleplay (${roleplayImprovement}).`;
  
  document.querySelector('.insight-description').textContent = description;
  
  // Update improvement areas
  updateImprovementAreas(data);
}

// Update improvement areas based on data
function updateImprovementAreas(data) {
  const improvementList = document.querySelector('.improvement-list');
  improvementList.innerHTML = '';
  
  // Compare participation rates
  const failbaseParticipation = parseFloat(data.failbase.find(m => m.name === 'General Participation Rate')?.value || '0');
  const jobParticipation = parseFloat(data.job.find(m => m.name === 'General Participation Rate')?.value || '0');
  const roleplayParticipation = parseFloat(data.roleplay.find(m => m.name === 'General Participation Rate')?.value || '0');
  
  // Find lowest participation
  const participationRates = [
    { name: 'Failbase', rate: failbaseParticipation },
    { name: 'Job', rate: jobParticipation },
    { name: 'Roleplay', rate: roleplayParticipation }
  ];
  
  participationRates.sort((a, b) => a.rate - b.rate);
  
  // Add improvement items
  const items = [
    `Increase participation rate for ${participationRates[0].name} Quiz (currently at ${participationRates[0].rate}%)`,
    `Improve retake submission rate across all quizzes`,
    `Focus on increasing lowest score areas in all quizzes`
  ];
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    improvementList.appendChild(li);
  });
}

// Show loading overlay
function showLoading() {
  document.getElementById('loading-overlay').style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

// Show error message
function showErrorMessage(message) {
  const errorBanner = document.createElement('div');
  errorBanner.className = 'error-banner';
  errorBanner.innerHTML = `
    <div class="error-content">
      <i class="fas fa-exclamation-circle"></i>
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(errorBanner);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorBanner.parentElement) {
      errorBanner.remove();
    }
  }, 5000);
}
