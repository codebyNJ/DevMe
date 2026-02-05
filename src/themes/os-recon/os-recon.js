// OS_Recon Theme Controller - Single Screen Dashboard
// Text-based location via Open-Meteo Geocoding API, nature bg on zen card
(function() {
  'use strict';

  // DOM cache
  var elements = {};

  // State
  var startTime = Date.now();
  var intervals = [];
  var weatherIntervalId = null;
  var activeMetric = 'cpu';

  // Metric data histories (60 points = 60 seconds)
  var MAX_POINTS = 60;
  var metricData = {
    cpu: [],
    memory: [],
    gpu: [],
    disk: [],
    wifi: []
  };

  // Metric simulation state
  var metricState = {
    cpu: { value: 22, trend: 1, min: 5, max: 95, speed: 3, label: 'CPU_USAGE', unit: '%' },
    memory: { value: 55, trend: 1, min: 30, max: 85, speed: 1.5, label: 'MEMORY_USAGE', unit: '%' },
    gpu: { value: 15, trend: 1, min: 2, max: 80, speed: 4, label: 'GPU_USAGE', unit: '%' },
    disk: { value: 8, trend: 1, min: 1, max: 60, speed: 2, label: 'DISK_IO', unit: 'MB/s' },
    wifi: { value: 72, trend: -1, min: 20, max: 100, speed: 2.5, label: 'WIFI_SIGNAL', unit: '%' }
  };

  // Nature background seeds (picsum.photos)
  var natureBgSeeds = [400, 401, 403, 405, 409, 410, 411, 413, 415, 416, 417, 418, 419, 421, 425, 429];

  function pad(num) {
    return num.toString().padStart(2, '0');
  }

  function initElements() {
    elements.headerTime = document.getElementById('header-time');
    elements.date = document.getElementById('date-display');
    elements.cpuVal = document.getElementById('cpu-val');
    elements.cpuSparkline = document.getElementById('cpu-sparkline');
    elements.bioVal = document.getElementById('bio-val');
    elements.bioLeaf = document.getElementById('leaf-svg');
    elements.bioSparkline = document.getElementById('bio-sparkline');
    elements.tempVal = document.getElementById('temp-val');
    elements.tempSparkline = document.getElementById('temp-sparkline');
    elements.netVal = document.getElementById('net-val');
    elements.netSparkline = document.getElementById('net-sparkline');
    elements.humidity = document.getElementById('humidity-val');
    elements.uptime = document.getElementById('uptime-display');
    elements.profileCard = document.getElementById('profileCard');
    elements.profileName = document.getElementById('profileName');
    elements.profileTitle = document.getElementById('profileTitle');
    elements.socialGithub = document.getElementById('social-github');
    elements.socialLinkedin = document.getElementById('social-linkedin');
    elements.metricSelector = document.getElementById('metricSelector');
    elements.monitorCurrentVal = document.getElementById('monitorCurrentVal');
    elements.monitorMetricLabel = document.getElementById('monitorMetricLabel');
    elements.systemGraph = document.getElementById('systemGraph');
    elements.weatherTemp = document.getElementById('weather-temp');
    elements.weatherFeels = document.getElementById('weather-feels');
    elements.weatherWind = document.getElementById('weather-wind');
    elements.weatherLocation = document.getElementById('weather-location');
  }

  // ========== HEADER TIME ==========
  function updateHeaderTime() {
    if (!elements.headerTime) return;
    var now = new Date();
    elements.headerTime.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  }

  // ========== DATE / UPTIME ==========
  function updateDateTime() {
    var now = new Date();
    if (elements.date) {
      elements.date.textContent = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear();
    }
    if (elements.uptime) {
      var elapsed = Date.now() - startTime;
      var d = Math.floor(elapsed / 86400000);
      var h = Math.floor((elapsed % 86400000) / 3600000);
      var m = Math.floor((elapsed % 3600000) / 60000);
      var s = Math.floor((elapsed % 60000) / 1000);
      elements.uptime.textContent = 'UPTIME: ' + pad(d) + ':' + pad(h) + ':' + pad(m) + ':' + pad(s);
    }
  }

  // ========== HEADER METRICS (decorative) ==========
  function updateSparkline(sparklineEl, newValue, max) {
    if (!sparklineEl) return;
    var bars = sparklineEl.querySelectorAll('.spark-bar');
    // Shift all bars left
    for (var i = 0; i < bars.length - 1; i++) {
      bars[i].style.height = bars[i + 1].style.height;
    }
    // Set last bar to new value
    var percent = Math.min(100, Math.max(10, (newValue / max) * 100));
    bars[bars.length - 1].style.height = percent + '%';
  }

  function updateHeaderMetrics() {
    var cpu = Math.floor(Math.random() * 20) + 10;
    if (elements.cpuVal) {
      elements.cpuVal.textContent = cpu + '%';
      elements.cpuVal.classList.add('updating');
      setTimeout(function() { elements.cpuVal.classList.remove('updating'); }, 300);
    }
    updateSparkline(elements.cpuSparkline, cpu, 100);

    var bio = (Math.random() * 0.4 + 9.2).toFixed(1);
    if (elements.bioVal) elements.bioVal.textContent = bio;
    if (elements.bioLeaf) {
      elements.bioLeaf.style.transform = 'scale(' + (1 + cpu / 100) + ') rotate(' + (cpu / 2) + 'deg)';
    }
    updateSparkline(elements.bioSparkline, parseFloat(bio), 10);

    var temp = Math.floor(Math.random() * 5) + 38;
    if (elements.tempVal) elements.tempVal.textContent = temp + '\u00B0';
    updateSparkline(elements.tempSparkline, temp, 80);

    var net = (Math.random() * 5 + 12).toFixed(1);
    if (elements.netVal) elements.netVal.textContent = net;
    updateSparkline(elements.netSparkline, parseFloat(net), 25);
  }

  // ========== SYSTEM MONITOR GRAPH (Statistical) ==========
  function simulateMetric(key) {
    var s = metricState[key];
    var noise = (Math.random() - 0.5) * s.speed * 2;
    var drift = s.trend * s.speed * 0.3;
    s.value += noise + drift;

    if (s.value >= s.max * 0.9) s.trend = -1;
    if (s.value <= s.min * 1.1) s.trend = 1;
    if (Math.random() < 0.05) s.trend *= -1;

    s.value = Math.max(s.min, Math.min(s.max, s.value));
    return s.value;
  }

  function updateAllMetrics() {
    for (var key in metricData) {
      var val = simulateMetric(key);
      metricData[key].push(val);
      if (metricData[key].length > MAX_POINTS) metricData[key].shift();
    }
  }

  function drawGraph() {
    var canvas = elements.systemGraph;
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    var w = rect.width;
    var h = rect.height;
    var data = metricData[activeMetric];
    var state = metricState[activeMetric];

    ctx.clearRect(0, 0, w, h);

    // Graph area with left padding for Y-axis labels
    var leftPad = 35;
    var topPad = 5;
    var bottomPad = 5;
    var graphW = w - leftPad;
    var graphH = h - topPad - bottomPad;

    var styles = getComputedStyle(document.documentElement);
    var borderColor = styles.getPropertyValue('--border').trim() || '#262626';
    var textColor = styles.getPropertyValue('--text').trim() || '#ffffff';
    var accentColor = styles.getPropertyValue('--accent').trim() || '#ffffff';

    // Y-axis range
    var yMin = 0;
    var yMax = state.unit === 'MB/s' ? 60 : 100;
    var ySteps = 4; // 0%, 25%, 50%, 75%, 100% (or 0, 15, 30, 45, 60 for MB/s)

    // Draw major horizontal grid lines + Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '9px JetBrains Mono, monospace';

    for (var i = 0; i <= ySteps; i++) {
      var yVal = yMin + ((yMax - yMin) / ySteps) * i;
      var yPos = topPad + graphH - (graphH / ySteps) * i;

      // Major grid line (solid)
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(leftPad, yPos);
      ctx.lineTo(w, yPos);
      ctx.stroke();

      // Y-axis label
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.35;
      var labelText = state.unit === 'MB/s' ? Math.round(yVal) + '' : Math.round(yVal) + '%';
      ctx.fillText(labelText, leftPad - 5, yPos);
      ctx.globalAlpha = 1.0;
    }

    // Draw minor horizontal grid lines (dashed, between majors)
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.4;
    ctx.setLineDash([3, 4]);
    for (var mi = 0; mi < ySteps; mi++) {
      var minorY = topPad + graphH - (graphH / ySteps) * mi - (graphH / ySteps) * 0.5;
      ctx.beginPath();
      ctx.moveTo(leftPad, minorY);
      ctx.lineTo(w, minorY);
      ctx.stroke();
    }

    // Draw vertical grid lines (dashed, every ~10 seconds)
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.4;
    ctx.setLineDash([3, 4]);
    var vLines = 6; // 0s, 10s, 20s, 30s, 40s, 50s
    for (var vi = 1; vi < vLines; vi++) {
      var vx = leftPad + (graphW / vLines) * vi;
      ctx.beginPath();
      ctx.moveTo(vx, topPad);
      ctx.lineTo(vx, topPad + graphH);
      ctx.stroke();
    }

    // Left axis line
    ctx.setLineDash([]);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, topPad);
    ctx.lineTo(leftPad, topPad + graphH);
    ctx.stroke();

    // Bottom axis line
    ctx.beginPath();
    ctx.moveTo(leftPad, topPad + graphH);
    ctx.lineTo(w, topPad + graphH);
    ctx.stroke();

    ctx.setLineDash([]);

    if (data.length < 2) return;

    // Normalize data to graph coordinates
    function dataToY(val) {
      var normalized = (val - yMin) / (yMax - yMin);
      normalized = Math.max(0, Math.min(1, normalized));
      return topPad + graphH - (normalized * graphH);
    }

    function dataToX(index) {
      return leftPad + (index / (MAX_POINTS - 1)) * graphW;
    }

    // Filled area
    ctx.beginPath();
    ctx.moveTo(dataToX(0), topPad + graphH);

    for (var j = 0; j < data.length; j++) {
      var x = dataToX(j);
      var y = dataToY(data[j]);
      if (j === 0) {
        ctx.lineTo(x, y);
      } else {
        var prevX = dataToX(j - 1);
        var prevY = dataToY(data[j - 1]);
        var cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    }

    ctx.lineTo(dataToX(data.length - 1), topPad + graphH);
    ctx.closePath();

    // Gradient fill
    var gradient = ctx.createLinearGradient(0, topPad, 0, topPad + graphH);
    gradient.addColorStop(0, accentColor.indexOf('#') === 0
      ? accentColor + '25'
      : accentColor.replace(')', ', 0.15)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    for (var k = 0; k < data.length; k++) {
      var lx = dataToX(k);
      var ly = dataToY(data[k]);
      if (k === 0) {
        ctx.moveTo(lx, ly);
      } else {
        var lpx = dataToX(k - 1);
        var lpy = dataToY(data[k - 1]);
        var lcpx = (lpx + lx) / 2;
        ctx.bezierCurveTo(lcpx, lpy, lcpx, ly, lx, ly);
      }
    }
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Current value dot
    if (data.length > 0) {
      var lastX = dataToX(data.length - 1);
      var lastY = dataToY(data[data.length - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.fillStyle = accentColor.indexOf('#') === 0
        ? accentColor + '30'
        : accentColor.replace(')', ', 0.19)').replace('rgb', 'rgba');
      ctx.fill();
    }

    // Update current value display
    if (elements.monitorCurrentVal) {
      var current = data.length > 0 ? data[data.length - 1] : 0;
      if (state.unit === 'MB/s') {
        elements.monitorCurrentVal.textContent = current.toFixed(1) + ' ' + state.unit;
      } else {
        elements.monitorCurrentVal.textContent = Math.round(current) + state.unit;
      }
    }
  }

  function onMetricChange() {
    activeMetric = elements.metricSelector.value;
    var state = metricState[activeMetric];
    if (elements.monitorMetricLabel) {
      elements.monitorMetricLabel.textContent = state.label;
    }
    drawGraph();
  }

  // ========== WEATHER (Open-Meteo API + Text Location) ==========
  function fetchWeather(lat, lon) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
      '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m';

    fetch(url)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.current) return;
        var c = data.current;

        if (elements.weatherTemp) elements.weatherTemp.textContent = c.temperature_2m + '\u00B0C';
        if (elements.weatherFeels) elements.weatherFeels.textContent = c.apparent_temperature + '\u00B0C';
        if (elements.humidity) elements.humidity.textContent = c.relative_humidity_2m + '%';
        if (elements.weatherWind) elements.weatherWind.textContent = c.wind_speed_10m + ' km/h';

        updateEcosystemBars(c.relative_humidity_2m);
      })
      .catch(function(err) {
        console.warn('DevMe: Weather fetch failed:', err);
      });
  }

  function geocodeCity(cityName) {
    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(cityName) + '&count=1';

    return fetch(url)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.results && data.results.length > 0) {
          return {
            lat: data.results[0].latitude,
            lon: data.results[0].longitude,
            name: data.results[0].name
          };
        }
        return null;
      });
  }

  function initWeather() {
    if (weatherIntervalId) {
      clearInterval(weatherIntervalId);
      weatherIntervalId = null;
    }

    if (!window.configManager) return;

    window.configManager.getConfig().then(function(config) {
      var profile = config.profile || config;
      var locationText = (profile.location || '').trim();

      if (!locationText) {
        if (elements.weatherLocation) elements.weatherLocation.textContent = 'Set in Settings';
        return;
      }

      geocodeCity(locationText).then(function(geo) {
        if (!geo) {
          if (elements.weatherLocation) elements.weatherLocation.textContent = 'City not found';
          return;
        }

        if (elements.weatherLocation) elements.weatherLocation.textContent = geo.name;
        fetchWeather(geo.lat, geo.lon);

        weatherIntervalId = setInterval(function() {
          fetchWeather(geo.lat, geo.lon);
        }, 600000);
      }).catch(function(err) {
        console.warn('DevMe: Geocoding failed:', err);
        if (elements.weatherLocation) elements.weatherLocation.textContent = 'Error';
      });
    }).catch(function(err) {
      console.warn('DevMe: Weather init failed:', err);
    });
  }

  function updateEcosystemBars(humidity) {
    var bars = document.querySelectorAll('.eco-bar');
    if (!bars.length) return;
    var active = humidity > 70 ? 4 : humidity > 50 ? 3 : humidity > 30 ? 2 : 1;
    bars.forEach(function(bar, i) {
      if (i < active) {
        bar.classList.remove('inactive');
      } else {
        bar.classList.add('inactive');
      }
    });
  }

  // ========== NATURE BACKGROUND (on Zen Card) ==========
  function setNatureBackground() {
    if (!elements.natureBg) return;
    var seed = natureBgSeeds[Math.floor(Math.random() * natureBgSeeds.length)];
    elements.natureBg.style.backgroundImage = 'url(https://picsum.photos/seed/' + seed + '/1200/600)';
  }

  // ========== PROFILE ==========
  function loadProfile() {
    if (!window.configManager) return;

    window.configManager.getConfig().then(function(config) {
      if (!config) return;
      var profile = config.profile || config;

      if (profile.avatarImage && elements.profileCard) {
        elements.profileCard.style.backgroundImage = 'url(' + profile.avatarImage + ')';
      }
      if (profile.name && elements.profileName) {
        elements.profileName.textContent = profile.name.toUpperCase();
      }
      if (profile.title && elements.profileTitle) {
        elements.profileTitle.textContent = profile.title;
      }
      if (profile.githubUsername && elements.socialGithub) {
        elements.socialGithub.href = 'https://github.com/' + profile.githubUsername;
        elements.socialGithub.style.display = 'flex';
      }
      if (profile.linkedinUrl && elements.socialLinkedin) {
        elements.socialLinkedin.href = profile.linkedinUrl;
        elements.socialLinkedin.style.display = 'flex';
      }
    }).catch(function(e) {
      console.warn('DevMe: OS_Recon profile load failed:', e);
    });
  }

  // ========== INIT ==========
  function init() {
    console.log('DevMe: OS_Recon theme initializing...');
    initElements();

    // Seed initial metric data
    for (var key in metricData) {
      for (var i = 0; i < MAX_POINTS; i++) {
        simulateMetric(key);
        metricData[key].push(metricState[key].value);
      }
    }

    updateHeaderTime();
    updateDateTime();
    updateHeaderMetrics();
    drawGraph();
    loadProfile();
    setNatureBackground();
    initWeather();

    // Dropdown handler
    if (elements.metricSelector) {
      elements.metricSelector.addEventListener('change', onMetricChange);
    }

    // Update system monitor every second
    intervals.push(setInterval(function() {
      updateAllMetrics();
      drawGraph();
    }, 1000));

    // Header metrics every 2s
    intervals.push(setInterval(updateHeaderMetrics, 2000));

    // Clock + uptime every second
    intervals.push(setInterval(function() {
      updateHeaderTime();
      updateDateTime();
    }, 1000));

    // Config change listener - reload profile and weather
    document.addEventListener('devme:config-changed', function() {
      loadProfile();
      initWeather();
    });

    // Redraw graph on resize
    window.addEventListener('resize', drawGraph);

    console.log('DevMe: OS_Recon theme initialized');
  }

  function cleanup() {
    intervals.forEach(function(id) { clearInterval(id); });
    intervals = [];
    if (weatherIntervalId) {
      clearInterval(weatherIntervalId);
      weatherIntervalId = null;
    }
    window.removeEventListener('resize', drawGraph);
  }

  window.OSReconTheme = { init: init, cleanup: cleanup };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    if (document.querySelector('.os-recon-dashboard')) init();
  }

  window.addEventListener('beforeunload', cleanup);
})();
