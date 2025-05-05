// Global variables
let currentView = 'grid';
let allMetrics = {};
let filteredMetrics = {};

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
