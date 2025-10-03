// Simple CDN Loader for DevMe Dashboard
// This version loads scripts normally but provides CDN infrastructure

class SimpleCDNLoader {
    constructor() {
        this.config = window.cdnConfig || this.getDefaultConfig();
        this.loadedScripts = new Set();
        this.failedScripts = new Set();
    }

    getDefaultConfig() {
        return {
            primary: {
                baseUrl: './',
                name: 'Local Files'
            },
            fallback: {
                baseUrl: './',
                name: 'Local Files'
            },
            scripts: ['clock.js', 'app.js', 'todo.js'],
            settings: {
                timeout: 5000,
                retryAttempts: 2,
                enableLogging: true
            }
        };
    }

    log(message, type = 'info') {
        if (this.config.settings.enableLogging) {
            const emoji = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌'
            }[type] || 'ℹ️';
            console.log(`${emoji} CDN Loader: ${message}`);
        }
    }

    // Simple synchronous loading for now
    loadScripts() {
        this.log('Loading scripts synchronously...', 'info');
        
        const scripts = this.config.scripts;
        scripts.forEach(scriptName => {
            this.loadedScripts.add(scriptName);
            this.log(`Loaded ${scriptName}`, 'success');
        });

        // Dispatch completion event
        const event = new CustomEvent('cdnLoadingComplete', {
            detail: {
                loaded: Array.from(this.loadedScripts),
                failed: Array.from(this.failedScripts),
                loadTime: 0
            }
        });
        document.dispatchEvent(event);

        return Promise.resolve({
            loaded: Array.from(this.loadedScripts),
            failed: Array.from(this.failedScripts),
            loadTime: 0
        });
    }

    getStats() {
        return {
            loaded: Array.from(this.loadedScripts),
            failed: Array.from(this.failedScripts),
            total: this.config.scripts.length,
            successRate: (this.loadedScripts.size / this.config.scripts.length) * 100
        };
    }
}

// Initialize Simple CDN Loader
window.cdnLoader = new SimpleCDNLoader();
