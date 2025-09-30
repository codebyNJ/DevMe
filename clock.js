// clock.js - Handles the clock functionality for the dashboard

// Simple clock function
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: true });
  const date = now.toLocaleDateString('en-GB'); // dd/mm/yyyy

  const timeElement = document.getElementById('time');
  const dateElement = document.getElementById('date');
  
  if (timeElement) timeElement.textContent = time;
  if (dateElement) dateElement.textContent = date;
}

// Start the clock when the script loads
document.addEventListener('DOMContentLoaded', () => {
  // Initial update
  updateClock();
  // Update every second
  setInterval(updateClock, 1000);
});
