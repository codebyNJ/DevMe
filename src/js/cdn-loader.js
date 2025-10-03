// CDN Loader for DevMe Dashboard
// Handles loading JavaScript files from CDN with fallback mechanisms

class CDNLoader {
    constructor() {
        this.config = window.cdnConfig || this.getDefaultConfig();
        this.loadedScripts = new Set();
        this.failedScripts = new Set();
    }

    getDefaultConfig() {
        return {
            primary: {
                baseUrl: 'https://cdn.jsdelivr.net/gh/codebyNJ/DevMe@main/',
                name: 'jsDelivr GitHub CDN'
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

    async loadScriptWithFallback(scriptName, attempt = 1) {
        const maxAttempts = this.config.settings.retryAttempts + 1;
        
        if (attempt > maxAttempts) {
            this.log(`Failed to load ${scriptName} after ${maxAttempts} attempts`, 'error');
            this.failedScripts.add(scriptName);
            return false;
        }

        // Try primary CDN first
        const cdnUrl = this.config.primary.baseUrl + scriptName;
        const fallbackUrl = this.config.fallback.baseUrl + scriptName;

        try {
            await this.loadScript(scriptName, cdnUrl, attempt === 1 ? 'CDN' : `CDN (attempt ${attempt})`);
            return true;
        } catch (error) {
            this.log(`CDN failed for ${scriptName}, trying fallback`, 'warning');
            
            try {
                await this.loadScript(scriptName, fallbackUrl, 'Local Fallback');
                return true;
            } catch (fallbackError) {
                if (attempt < maxAttempts) {
                    this.log(`Retrying ${scriptName} (attempt ${attempt + 1})`, 'warning');
                    return this.loadScriptWithFallback(scriptName, attempt + 1);
                } else {
                    this.log(`All attempts failed for ${scriptName}`, 'error');
                    this.failedScripts.add(scriptName);
                    return false;
                }
            }
        }
    }

    loadScript(scriptName, url, source) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            
            const timeout = setTimeout(() => {
                script.remove();
                reject(new Error(`Timeout loading ${scriptName} from ${source}`));
            }, this.config.settings.timeout);

            script.onload = () => {
                clearTimeout(timeout);
                this.loadedScripts.add(scriptName);
                this.log(`Loaded ${scriptName} from ${source}`, 'success');
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeout);
                script.remove();
                reject(new Error(`Failed to load ${scriptName} from ${source}`));
            };

            document.head.appendChild(script);
        });
    }

    async loadAllScripts() {
        this.log('Starting CDN script loading...', 'info');
        const startTime = performance.now();

        const loadPromises = this.config.scripts.map(scriptName => 
            this.loadScriptWithFallback(scriptName)
        );

        const results = await Promise.allSettled(loadPromises);
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);

        const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
        const failureCount = results.length - successCount;

        if (failureCount === 0) {
            this.log(`All ${successCount} scripts loaded successfully in ${loadTime}ms`, 'success');
        } else {
            this.log(`${successCount} scripts loaded, ${failureCount} failed in ${loadTime}ms`, 'warning');
        }

        // Dispatch custom event when loading is complete
        const event = new CustomEvent('cdnLoadingComplete', {
            detail: {
                loaded: Array.from(this.loadedScripts),
                failed: Array.from(this.failedScripts),
                loadTime: loadTime
            }
        });
        document.dispatchEvent(event);

        return {
            loaded: Array.from(this.loadedScripts),
            failed: Array.from(this.failedScripts),
            loadTime: loadTime
        };
    }

    // Method to check if a script is loaded
    isScriptLoaded(scriptName) {
        return this.loadedScripts.has(scriptName);
    }

    // Method to get loading statistics
    getStats() {
        return {
            loaded: Array.from(this.loadedScripts),
            failed: Array.from(this.failedScripts),
            total: this.config.scripts.length,
            successRate: (this.loadedScripts.size / this.config.scripts.length) * 100
        };
    }
}

// Initialize CDN Loader
window.cdnLoader = new CDNLoader();
