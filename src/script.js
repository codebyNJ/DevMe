/* ================= TIME ================= */

function updateTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  document.getElementById("clock").textContent = `${hours}:${minutes}`;
  document.querySelector(".ampm").textContent = ` ${ampm}`;

  document.getElementById("date").textContent =
    now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
}

updateTime();
setInterval(updateTime, 1000);

/* ================= YEAR DOTS ================= */

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date - start +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
  return Math.floor(diff / 86400000);
}

function renderYearDots(date = new Date()) {
  const container = document.getElementById("yearDots");
  container.innerHTML = "";

  const year = date.getFullYear();
  const totalDays = isLeapYear(year) ? 366 : 365;
  const completedDays = getDayOfYear(date);

  for (let day = 1; day <= totalDays; day++) {
    const dot = document.createElement("div");
    dot.className = "dot";

    if (day <= completedDays) dot.classList.add("completed");

    dot.dataset.tooltip = new Date(year, 0, day).toDateString();
    container.appendChild(dot);
  }
}

renderYearDots();

/* ================= GITHUB STATS ================= */

async function fetchGitHubStats() {
  // Check if configManager is available and get the GitHub username
  if (!window.configManager) {
    console.log('Config manager not available, using fallback values');
    setFallbackStats();
    return;
  }

  try {
    const config = await window.configManager.getConfig();
    const githubUsername = config?.profile?.githubUsername;
    
    if (!githubUsername) {
      console.log('No GitHub username configured, using fallback values');
      setFallbackStats();
      return;
    }

    // Use the app.js implementation if available
    if (window.devDashboard) {
      await window.devDashboard.fetchGitHubStats(githubUsername);
      return;
    }

    // Fallback implementation if app.js isn't loaded yet
    const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100`);
    if (!response.ok) {
      throw new Error('GitHub API request failed');
    }
    
    const repos = await response.json();
    
    let totalStars = 0;
    let totalForks = 0;
    const languages = {};
    
    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });
    
    const topLanguage = Object.keys(languages).length > 0 
      ? Object.entries(languages).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';
    
    // Update the UI
    document.querySelector('#gh-repos .stat-value').textContent = repos.length;
    document.querySelector('#gh-stars .stat-value').textContent = totalStars;
    document.querySelector('#gh-forks .stat-value').textContent = totalForks;
    document.querySelector('#gh-top-language .stat-value').textContent = topLanguage;
    
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    setFallbackStats();
  }
}

function setFallbackStats() {
  document.querySelector('#gh-repos .stat-value').textContent = 'N/A';
  document.querySelector('#gh-stars .stat-value').textContent = '0';
  document.querySelector('#gh-forks .stat-value').textContent = '0';
  document.querySelector('#gh-top-language .stat-value').textContent = 'N/A';
}

// Initialize GitHub stats after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to ensure dashboard is initialized
  setTimeout(() => {
    fetchGitHubStats();
  }, 1000);
});