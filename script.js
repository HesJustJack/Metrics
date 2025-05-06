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
  // Add History and Settings pages to the document
  addHistoryAndSettingsPages();
  
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
  
  // Initialize navigation links
  initNavigation();
  
  // Initialize settings page
  initSettings();
  
  // Set up refresh interval (every 60 seconds by default)
  startRefreshTimer();
  
  // Add event listener for reset settings button
  document.getElementById('reset-settings')?.addEventListener('click', function() {
    resetSettingsToDefaults();
  });
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
  
  // Create countdown span
  const countdownSpan = document.createElement('span');
  countdownSpan.className = 'countdown';
  countdownSpan.textContent = `(${refreshInterval}s)`;
  refreshBtn.appendChild(countdownSpan);
  
  // Add click event listener
  refreshBtn.addEventListener('click', function() {
    fetchMetrics();
    resetRefreshTimer();
  });
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
    countdownSpan.textContent = `(${remainingTime}s)`;
  }
}

// Reset settings to defaults
function resetSettingsToDefaults() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    // Default settings
    const defaultSettings = {
      refreshInterval: 60,
      defaultTimeframe: 'year',
      defaultView: 'grid',
      enableAutoRefresh: true,
      enableNotifications: true
    };
    
    // Save default settings
    localStorage.setItem('quizAnalyticsSettings', JSON.stringify(defaultSettings));
    
    // Update form fields
    document.getElementById('refreshInterval').value = defaultSettings.refreshInterval;
    document.getElementById('defaultTimeframe').value = defaultSettings.defaultTimeframe;
    document.getElementById('defaultView').value = defaultSettings.defaultView;
    document.getElementById('enableAutoRefresh').checked = defaultSettings.enableAutoRefresh;
    document.getElementById('enableNotifications').checked = defaultSettings.enableNotifications;
    
    // Apply settings
    refreshInterval = defaultSettings.refreshInterval;
    currentTimeframe = defaultSettings.defaultTimeframe;
    currentView = defaultSettings.defaultView;
    
    // Reset timer
    resetRefreshTimer();
    
    // Update UI
    document.getElementById('timeRange').value = currentTimeframe;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === currentView) {
        btn.classList.add('active');
      }
    });
    
    // Update view mode
    updateMetricGridView();
    
    // Fetch metrics with new timeframe
    fetchMetrics();
    
    // Show success message
    showSuccessMessage('Settings have been reset to defaults');
  }
}

// Initialize navigation links
function initNavigation() {
  const navLinks = document.querySelectorAll('.main-nav a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the page id from the href
      const pageId = this.getAttribute('href').substring(1);
      
      // Only proceed if it's a valid page
      if (pageId === '' || pageId === '#') return;
      
      // Hide all pages
      document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
      });
      
      // Show the selected page
      const selectedPage = document.getElementById(pageId);
      if (selectedPage) {
        selectedPage.style.display = 'block';
        
        // Load page-specific content
        if (pageId === 'history') {
          loadHistoryPage();
        } else if (pageId === 'settings') {
          loadSettingsPage();
        }
      }
      
      // Update active nav link
      document.querySelectorAll('.main-nav a').forEach(navLink => {
        navLink.classList.remove('active');
      });
      this.classList.add('active');
    });
  });
}

// Initialize settings functionality
function initSettings() {
  // Load saved settings
  loadSettings();
  
  // Set up settings form
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveSettings();
    });
  }
}

// Load settings from localStorage
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem('quizAnalyticsSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // Apply saved settings
      refreshInterval = settings.refreshInterval || 60;
      document.getElementById('refreshInterval').value = refreshInterval;
      
      // Apply other settings as needed
      if (settings.defaultTimeframe) {
        currentTimeframe = settings.defaultTimeframe;
        document.getElementById('defaultTimeframe').value = currentTimeframe;
      }
      
      // Reset timer with new interval
      resetRefreshTimer();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings to localStorage
function saveSettings() {
  try {
    // Get values from form
    const newRefreshInterval = parseInt(document.getElementById('refreshInterval').value);
    const newDefaultTimeframe = document.getElementById('defaultTimeframe').value;
    
    // Validate refresh interval
    if (newRefreshInterval < 10) {
      showErrorMessage('Refresh interval must be at least 10 seconds');
      return;
    }
    
    // Create settings object
    const settings = {
      refreshInterval: newRefreshInterval,
      defaultTimeframe: newDefaultTimeframe
    };
    
    // Save to localStorage
    localStorage.setItem('quizAnalyticsSettings', JSON.stringify(settings));
    
    // Apply new settings
    refreshInterval = newRefreshInterval;
    currentTimeframe = newDefaultTimeframe;
    
    // Reset timer with new interval
    resetRefreshTimer();
    
    // Update the timeframe selector
    document.getElementById('timeRange').value = currentTimeframe;
    
    // Fetch metrics with new timeframe
    fetchMetrics();
    
    // Show success message
    showSuccessMessage('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    showErrorMessage('Failed to save settings');
  }
}

// Load history page content
function loadHistoryPage() {
  const historyContainer = document.getElementById('history-content');
  if (!historyContainer) return;
  
  // Show loading indicator
  historyContainer.innerHTML = '<div class="loading">Loading history data...</div>';
  
  // Get history data
  fetchHistoryData()
    .then(historyData => {
      // Create history table
      createHistoryTable(historyData, historyContainer);
    })
    .catch(error => {
      console.error('Error loading history:', error);
      historyContainer.innerHTML = '<div class="error">Failed to load history data</div>';
    });
}

// Fetch history data 
function fetchHistoryData() {
  // Fetch history data from API or create mock data
  return new Promise((resolve, reject) => {
    // For now, use mock data based on current metrics
    setTimeout(() => {
      // Generate mock history data
      const quizTypes = ['failbase', 'job', 'roleplay'];
      const mockHistory = [];
      
      quizTypes.forEach(quizType => {
        if (allMetrics[quizType]) {
          allMetrics[quizType].forEach(metric => {
            if (metric.name !== 'Timeframe') {
              mockHistory.push({
                date: new Date(),
                quizType: quizType,
                metricName: metric.name,
                value: metric.value,
                timeframe: currentTimeframe
              });
            }
          });
        }
      });
      
      // Add some older entries
      const pastDate1 = new Date();
      pastDate1.setDate(pastDate1.getDate() - 7);
      
      const pastDate2 = new Date();
      pastDate2.setDate(pastDate2.getDate() - 14);
      
      quizTypes.forEach(quizType => {
        if (allMetrics[quizType]) {
          allMetrics[quizType].slice(0, 3).forEach(metric => {
            if (metric.name !== 'Timeframe') {
              // Add record from a week ago
              mockHistory.push({
                date: pastDate1,
                quizType: quizType,
                metricName: metric.name,
                value: randomizeValue(metric.value),
                timeframe: currentTimeframe
              });
              
              // Add record from two weeks ago
              mockHistory.push({
                date: pastDate2,
                quizType: quizType,
                metricName: metric.name,
                value: randomizeValue(metric.value),
                timeframe: currentTimeframe
              });
            }
          });
        }
      });
      
      resolve(mockHistory);
    }, 500);
  });
}

// Helper function to randomize values for mock history data
function randomizeValue(value) {
  // Parse numeric values
  if (typeof value === 'string' && value.endsWith('%')) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return `${(numValue + (Math.random() * 10 - 5)).toFixed(1)}%`;
    }
  } else if (typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 2) {
      const num1 = parseInt(parts[0]);
      const num2 = parseInt(parts[1]);
      if (!isNaN(num1) && !isNaN(num2)) {
        return `${Math.max(0, num1 + Math.floor(Math.random() * 5 - 2))}/${num2}`;
      }
    }
  } else if (!isNaN(parseFloat(value))) {
    return (parseFloat(value) + (Math.random() * 2 - 1)).toFixed(1);
  }
  
  // Return original value if not numeric
  return value;
}

// Create history table
function createHistoryTable(historyData, container) {
  // Create table structure
  const table = document.createElement('table');
  table.className = 'history-table';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  ['Date', 'Quiz Type', 'Metric', 'Value', 'Timeframe', 'Actions'].forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Sort history data by date (newest first)
  historyData.sort((a, b) => b.date - a.date);
  
  historyData.forEach(item => {
    const row = document.createElement('tr');
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = item.date.toLocaleDateString() + ' ' + item.date.toLocaleTimeString();
    row.appendChild(dateCell);
    
    // Quiz type cell
    const quizTypeCell = document.createElement('td');
    quizTypeCell.textContent = item.quizType.charAt(0).toUpperCase() + item.quizType.slice(1);
    row.appendChild(quizTypeCell);
    
    // Metric name cell
    const metricNameCell = document.createElement('td');
    metricNameCell.textContent = item.metricName;
    row.appendChild(metricNameCell);
    
    // Value cell
    const valueCell = document.createElement('td');
    valueCell.textContent = item.value;
    row.appendChild(valueCell);
    
    // Timeframe cell
    const timeframeCell = document.createElement('td');
    timeframeCell.textContent = item.timeframe;
    row.appendChild(timeframeCell);
    
    // Actions cell
    const actionsCell = document.createElement('td');
    const viewButton = document.createElement('button');
    viewButton.className = 'action-btn';
    viewButton.innerHTML = '<i class="fas fa-chart-line"></i>';
    viewButton.title = 'View Trend';
    viewButton.addEventListener('click', function() {
      showMetricTrend(item);
    });
    actionsCell.appendChild(viewButton);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  
  // Clear and append to container
  container.innerHTML = '';
  
  // Add filter controls
  const filterControls = document.createElement('div');
  filterControls.className = 'filter-controls';
  
  // Quiz type filter
  const quizTypeFilter = document.createElement('select');
  quizTypeFilter.id = 'quiz-type-filter';
  
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Quiz Types';
  quizTypeFilter.appendChild(allOption);
  
  ['failbase', 'job', 'roleplay'].forEach(quizType => {
    const option = document.createElement('option');
    option.value = quizType;
    option.textContent = quizType.charAt(0).toUpperCase() + quizType.slice(1);
    quizTypeFilter.appendChild(option);
  });
  
  quizTypeFilter.addEventListener('change', function() {
    filterHistoryTable();
  });
  
  // Date range filter
  const dateFilter = document.createElement('select');
  dateFilter.id = 'date-filter';
  
  ['all', 'today', 'week', 'month'].forEach(period => {
    const option = document.createElement('option');
    option.value = period;
    option.textContent = period === 'all' ? 'All Dates' : 
                        period === 'today' ? 'Today' :
                        period === 'week' ? 'This Week' : 'This Month';
    dateFilter.appendChild(option);
  });
  
  dateFilter.addEventListener('change', function() {
    filterHistoryTable();
  });
  
  // Add the filters to the controls
  filterControls.innerHTML = '<label>Quiz Type: </label>';
  filterControls.appendChild(quizTypeFilter);
  filterControls.innerHTML += '<label>Date Range: </label>';
  filterControls.appendChild(dateFilter);
  
  // Add export button
  const exportButton = document.createElement('button');
  exportButton.className = 'export-btn';
  exportButton.innerHTML = '<i class="fas fa-download"></i> Export CSV';
  exportButton.addEventListener('click', function() {
    exportHistoryToCSV(historyData);
  });
  filterControls.appendChild(exportButton);
  
  container.appendChild(filterControls);
  container.appendChild(table);
  
  // Store history data for filtering
  container.dataset.historyData = JSON.stringify(historyData);
}

// Filter history table
function filterHistoryTable() {
  const container = document.getElementById('history-content');
  if (!container) return;
  
  // Get filter values
  const quizTypeFilter = document.getElementById('quiz-type-filter').value;
  const dateFilter = document.getElementById('date-filter').value;
  
  // Get stored history data
  const historyData = JSON.parse(container.dataset.historyData);
  
  // Apply filters
  const now = new Date();
  const filtered = historyData.filter(item => {
    // Quiz type filter
    if (quizTypeFilter !== 'all' && item.quizType !== quizTypeFilter) {
      return false;
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const itemDate = new Date(item.date);
      
      if (dateFilter === 'today') {
        // Check if date is today
        return itemDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        // Check if date is within the last 7 days
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      } else if (dateFilter === 'month') {
        // Check if date is within the last 30 days
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      }
    }
    
    return true;
  });
  
  // Recreate table with filtered data
  const table = container.querySelector('.history-table');
  const tbody = document.createElement('tbody');
  
  filtered.forEach(item => {
    const row = document.createElement('tr');
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = new Date(item.date).toLocaleDateString() + ' ' + new Date(item.date).toLocaleTimeString();
    row.appendChild(dateCell);
    
    // Quiz type cell
    const quizTypeCell = document.createElement('td');
    quizTypeCell.textContent = item.quizType.charAt(0).toUpperCase() + item.quizType.slice(1);
    row.appendChild(quizTypeCell);
    
    // Metric name cell
    const metricNameCell = document.createElement('td');
    metricNameCell.textContent = item.metricName;
    row.appendChild(metricNameCell);
    
    // Value cell
    const valueCell = document.createElement('td');
    valueCell.textContent = item.value;
    row.appendChild(valueCell);
    
    // Timeframe cell
    const timeframeCell = document.createElement('td');
    timeframeCell.textContent = item.timeframe;
    row.appendChild(timeframeCell);
    
    // Actions cell
    const actionsCell = document.createElement('td');
    const viewButton = document.createElement('button');
    viewButton.className = 'action-btn';
    viewButton.innerHTML = '<i class="fas fa-chart-line"></i>';
    viewButton.title = 'View Trend';
    viewButton.addEventListener('click', function() {
      showMetricTrend(item);
    });
    actionsCell.appendChild(viewButton);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  // Replace old tbody with new one
  table.removeChild(table.querySelector('tbody'));
  table.appendChild(tbody);
}

// Export history data to CSV
function exportHistoryToCSV(historyData) {
  // Get filter values
  const quizTypeFilter = document.getElementById('quiz-type-filter').value;
  const dateFilter = document.getElementById('date-filter').value;
  
  // Apply filters if needed
  let dataToExport = historyData;
  
  if (quizTypeFilter !== 'all' || dateFilter !== 'all') {
    const now = new Date();
    dataToExport = historyData.filter(item => {
      // Quiz type filter
      if (quizTypeFilter !== 'all' && item.quizType !== quizTypeFilter) {
        return false;
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.date);
        
        if (dateFilter === 'today') {
          // Check if date is today
          return itemDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          // Check if date is within the last 7 days
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        } else if (dateFilter === 'month') {
          // Check if date is within the last 30 days
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= monthAgo;
        }
      }
      
      return true;
    });
  }
  
  // Create CSV content
  let csvContent = "Date,Quiz Type,Metric Name,Value,Timeframe\n";
  
  dataToExport.forEach(item => {
    const date = new Date(item.date).toISOString();
    const quizType = item.quizType;
    const metricName = item.metricName.replace(/,/g, ""); // Remove commas to avoid CSV issues
    const value = item.value.toString().replace(/,/g, "");
    const timeframe = item.timeframe;
    
    csvContent += `${date},${quizType},${metricName},${value},${timeframe}\n`;
  });
  
  // Create download link
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "quiz_analytics_history.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Show metric trend
function showMetricTrend(item) {
  // Create modal for trend visualization
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  // Close button
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-modal';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  // Modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  modalHeader.innerHTML = `<h2>Trend for ${item.metricName}</h2>`;
  modalHeader.appendChild(closeBtn);
  
  // Chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'trend-chart-container';
  chartContainer.style.height = '300px';
  
  // Add content to modal
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(chartContainer);
  modal.appendChild(modalContent);
  
  // Add modal to body
  document.body.appendChild(modal);
  
  // Generate trend data
  generateTrendData(item).then(trendData => {
    // Create the chart
    const canvas = document.createElement('canvas');
    canvas.id = 'trendChart';
    chartContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.dates,
        datasets: [{
          label: item.metricName,
          data: trendData.values,
          borderColor: '#03a9f4',
          backgroundColor: 'rgba(3, 169, 244, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
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
            text: `${item.quizType.charAt(0).toUpperCase() + item.quizType.slice(1)} - ${item.metricName}`,
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
          }
        }
      }
    });
  });
}

// Generate trend data for a metric
function generateTrendData(item) {
  // For now, generate mock trend data
  return new Promise(resolve => {
    const dates = [];
    const values = [];
    
    // Generate data points for the last 30 days
    const endDate = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(endDate.getTime() - (i * 24 * 60 * 60 * 1000));
      dates.push(date.toLocaleDateString());
      
      // Generate a value based on the item value
      const baseValue = parseNumericValue(item.value);
      
      // Add some random variation and a slight trend
      const trend = (30 - i) / 30 * 0.2; // 0-20% increase over time
      const random = Math.random() * 0.1 - 0.05; // +/- 5% random noise
      
      const value = baseValue * (1 + trend + random);
      
      // Format value according to the original format
      if (typeof item.value === 'string' && item.value.endsWith('%')) {
        values.push(value.toFixed(1));
      } else if (typeof item.value === 'string' && item.value.includes('/')) {
        // For ratios, only adjust the first number
        const parts = item.value.split('/');
        if (parts.length === 2) {
          const adjustedValue = Math.round(value);
          values.push(adjustedValue);
        } else {
          values.push(value.toFixed(1));
        }
      } else {
        values.push(value.toFixed(1));
      }
    }
    
    resolve({ dates, values });
  });
}

// Parse numeric value from various formats
function parseNumericValue(value) {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Handle percentage
    if (value.endsWith('%')) {
      return parseFloat(value.replace('%', ''));
    }
    
    // Handle ratio (e.g. 10/20)
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 2) {
        return parseInt(parts[0], 10);
      }
    }
    
    // Try to parse as a simple number
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  // Default value if parsing fails
  return 0;
}
