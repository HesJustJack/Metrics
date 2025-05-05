// Function to fetch metrics from the Google Apps Script web app
async function fetchMetrics() {
  // Show loading message
  document.getElementById('loading-message').style.display = 'block';

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyRTgsufzTG5NZUA2BPKQsuw0tDs_ZZmtVInU9x_uUhb4RRgs7MtZ0W77VgWiW-fi9w/exec', {
      cache: 'force-cache'  // Use cached data if available
    });
    const data = await response.json();

    // Prepare the HTML content for each tab's metrics in memory
    const failbaseContent = data.failbase.map(metric => `
      <div class="metric-box">
        <div class="metric-name">${metric.name}</div>
        <div class="metric-value">${metric.value}</div>
      </div>
    `).join('');

    const jobContent = data.job.map(metric => `
      <div class="metric-box">
        <div class="metric-name">${metric.name}</div>
        <div class="metric-value">${metric.value}</div>
      </div>
    `).join('');

    const roleplayContent = data.roleplay.map(metric => `
      <div class="metric-box">
        <div class="metric-name">${metric.name}</div>
        <div class="metric-value">${metric.value}</div>
      </div>
    `).join('');

    // Update all tab contents at once
    document.getElementById('failbase-metrics').innerHTML = failbaseContent;
    document.getElementById('job-metrics').innerHTML = jobContent;
    document.getElementById('roleplay-metrics').innerHTML = roleplayContent;
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }

  // Hide loading message once data is loaded
  document.getElementById('loading-message').style.display = 'none';
}

// Fetch metrics when the page loads
fetchMetrics();

// Poll the server every 30 seconds to fetch new data
setInterval(fetchMetrics, 30000);  // 30,000 ms = 30 seconds

// Switch tabs function
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));

  document.querySelector(`.tab[onclick*="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');
}
