# OS_Recon Theme

A minimalist tech system dashboard theme with nature elements and real-time metrics visualization.

## Features

- **Real-time System Metrics**
  - CPU Load monitoring (10-30% range)
  - Bio Sync Load with animated leaf icon
  - Temperature monitoring
  - Network download speed

- **Traffic Analysis Graph**
  - Live updating bar chart
  - 50 data points visualization
  - Smooth transitions

- **Zen Interface**
  - Nature-inspired design elements
  - Air quality and humidity indicators
  - Ecosystem stability visualization

- **Quick Access Links**
  - 8 Google service shortcuts (Search, Gmail, Drive, Calendar, Docs, YouTube, Meet, Photos)
  - Clean grid layout

- **Technical Grid Background**
  - Automatic light/dark mode support
  - Monospace typography (JetBrains Mono)

## Performance Optimizations

- **No External Dependencies**: All CSS is native, no Tailwind CDN
- **DOM Element Caching**: Elements cached at initialization
- **Efficient Updates**: Only necessary DOM updates on intervals
- **CSP Compliant**: External JavaScript file (no inline scripts)
- **Smooth Animations**: Optimized transitions and updates

## Technical Details

- **Theme ID**: `os-recon`
- **Supported Widgets**: `clock`, `important-links`
- **Update Intervals**: 
  - Metrics: 2 seconds
  - Graph: 3 seconds
  - Clock/Uptime: 1 second

## Files

- `theme.json` - Theme configuration
- `template.html` - HTML structure
- `styles.css` - CSS styles with light/dark mode support
- `os-recon.js` - JavaScript controller (CSP compliant)

## Notes

This theme uses pseudo-random metrics for demonstration. In a production environment, you could integrate real system monitoring APIs.
