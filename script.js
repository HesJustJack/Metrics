// Function to fetch metrics from the Google Apps Script web app
async function fetchMetrics() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyRTgsufzTG5NZUA2BPKQsuw0tDs_ZZmtVInU9x_uUhb4RRgs7MtZ0W77VgWiW-fi9w/exec');
    const data = await response.json();
    
    // Map through the data and inject it into the correct tab's grid
    document.getElementById('failbase-metrics').innerHTML = data.failbase.map(metric => `
      <div class="metric-box">
        <div class="metric-name">${metric.name}</div>
        <div class="metric-value">${metric.value}</div>
      </div>
    `).join('');

    document.getElementById('job-metrics').innerHTML = data.job.map(metric => `
      <div class="metric-box">
        <div class="metric-name">${metric.name}</div>
        <div class="metric-value">${metric.value}</div>
      </div>
    `).join('');

    document.getElementById('roleplay-metrics').innerHTML = data.roleplay.map(metric => `
      <div class="metric-box">
        <div class="metric-name">${metric.name}</div>
        <div class="metric-value">${metric.value}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

// Fetch metrics when the page loads
fetchMetrics();

// Switch tabs function
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));

  document.querySelector(`.tab[onclick*="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');
}
