// CDN Configuration for DevMe Dashboard
// This file contains CDN settings and can be easily modified

window.cdnConfig = {
    // Primary CDN (using local files for now - can be changed to actual CDN later)
    primary: {
        baseUrl: './',
        name: 'Local Files'
    },
    
    // Alternative CDN options (uncomment to use)
    alternatives: [
        {
            baseUrl: 'https://raw.githubusercontent.com/codebyNJ/DevMe/main/',
            name: 'GitHub Raw'
        },
        {
            baseUrl: 'https://unpkg.com/@codebynj/devme@latest/',
            name: 'unpkg (if published to npm)'
        }
    ],
    
    // Local fallback
    fallback: {
        baseUrl: './',
        name: 'Local Files'
    },
    
    // Scripts to load from CDN (config.js is always local)
    scripts: [
        'clock.js',
        'app.js', 
        'todo.js'
    ],
    
    // CDN settings
    settings: {
        timeout: 5000, // 5 seconds timeout for CDN requests
        retryAttempts: 2, // Number of retry attempts
        enableLogging: true // Enable console logging
    }
};
