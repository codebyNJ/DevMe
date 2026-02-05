// Theme Loader - Loads and applies themes with caching support

(function () {
    const THEME_KEY = 'selectedTheme';
    const WIDGET_PREFS_KEY = 'enabledWidgets';
    const THEME_CACHE_KEY = 'themeCache';
    const THEMES_PATH = 'src/themes';

    function hasChromeLocalStorage() {
        return typeof chrome !== 'undefined' && chrome?.storage?.local;
    }

    function hasChromeSyncStorage() {
        return typeof chrome !== 'undefined' && chrome?.storage?.sync;
    }

    // Theme cache helpers
    async function getThemeCache() {
        if (hasChromeLocalStorage()) {
            return new Promise(resolve => {
                chrome.storage.local.get([THEME_CACHE_KEY], result => {
                    resolve(result[THEME_CACHE_KEY] || {});
                });
            });
        }
        try {
            return JSON.parse(localStorage.getItem(THEME_CACHE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    async function saveThemeCache(cache) {
        if (hasChromeLocalStorage()) {
            return new Promise(resolve => {
                chrome.storage.local.set({ [THEME_CACHE_KEY]: cache }, resolve);
            });
        }
        localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cache));
    }

    const themeLoader = {
        currentTheme: null,
        currentThemeId: null,
        registry: null,

        // Initialize theme system
        async init() {
            try {
                // Load theme registry
                this.registry = await this.loadRegistry();

                // Get selected theme (or null for first-time)
                const selectedId = await this.getSelectedThemeId();

                if (!selectedId) {
                    // First time - needs theme selection
                    return { needsSelection: true, themes: this.registry.themes };
                }

                // Load the theme config (from cache if available)
                const themeConfig = await this.loadThemeConfig(selectedId);
                if (!themeConfig) {
                    // Theme not found, fallback to first available
                    const fallbackId = this.registry.themes[0]?.id;
                    if (fallbackId) {
                        return { needsSelection: false, themeId: fallbackId };
                    }
                    return { needsSelection: true, themes: this.registry.themes };
                }

                // Store for later use
                this.currentTheme = themeConfig;
                this.currentThemeId = selectedId;

                return { needsSelection: false, themeId: selectedId, themeConfig };
            } catch (error) {
                console.error('Theme loader init failed:', error);
                return { needsSelection: true, themes: [], error };
            }
        },

        // Load themes registry
        async loadRegistry() {
            try {
                const response = await fetch(`${THEMES_PATH}/registry.json`);
                if (!response.ok) throw new Error('Failed to load registry');
                return await response.json();
            } catch (error) {
                console.error('Failed to load theme registry:', error);
                return { version: '1.0', themes: [] };
            }
        },

        // Load a specific theme's config (with caching)
        async loadThemeConfig(themeId) {
            try {
                // Try cache first
                const cache = await getThemeCache();
                if (cache[themeId]?.config) {
                    console.log(`DevMe: Theme ${themeId} loaded from cache`);
                    return cache[themeId].config;
                }

                // Fetch from network
                const response = await fetch(`${THEMES_PATH}/${themeId}/theme.json`);
                if (!response.ok) return null;
                const config = await response.json();

                // Cache for next time
                cache[themeId] = cache[themeId] || {};
                cache[themeId].config = config;
                cache[themeId].cachedAt = Date.now();
                await saveThemeCache(cache);

                return config;
            } catch (error) {
                console.error(`Failed to load theme config for ${themeId}:`, error);
                return null;
            }
        },

        // Load a theme's HTML template (with caching)
        async loadTemplate(themeId, templateFile) {
            try {
                // Try cache first
                const cache = await getThemeCache();
                if (cache[themeId]?.template) {
                    console.log(`DevMe: Theme template ${themeId} loaded from cache`);
                    return cache[themeId].template;
                }

                // Fetch from network
                const response = await fetch(`${THEMES_PATH}/${themeId}/${templateFile}`);
                if (!response.ok) throw new Error('Template not found');
                const template = await response.text();

                // Cache for next time
                cache[themeId] = cache[themeId] || {};
                cache[themeId].template = template;
                await saveThemeCache(cache);

                return template;
            } catch (error) {
                console.error(`Failed to load template for ${themeId}:`, error);
                return null;
            }
        },

        // Apply a theme
        async applyTheme(themeId) {
            const themeConfig = await this.loadThemeConfig(themeId);
            if (!themeConfig) {
                console.error(`Theme ${themeId} not found`);
                return false;
            }

            this.currentTheme = themeConfig;
            this.currentThemeId = themeId;

            // 1. Load and inject theme CSS
            this.loadThemeStyles(themeId, themeConfig.styles);

            // 2. Apply CSS variables
            this.applyCssVariables(themeConfig.cssVariables);

            // 3. Load template HTML
            const template = await this.loadTemplate(themeId, themeConfig.template);
            if (!template) {
                console.error(`Failed to load template for theme ${themeId}`);
                return false;
            }

            // 4. Inject template into dashboard root
            const dashboardRoot = document.getElementById('dashboardRoot');
            if (dashboardRoot) {
                dashboardRoot.innerHTML = template;
            }

            // 5. Load theme-specific scripts (if any)
            if (themeConfig.scripts && Array.isArray(themeConfig.scripts)) {
                this.loadThemeScripts(themeId, themeConfig.scripts);
            }

            // Save selection
            await this.saveSelectedTheme(themeId);

            return true;
        },

        // Mount widgets after theme is applied
        async mountWidgets(config) {
            if (!this.currentTheme || !window.widgetRegistry) {
                console.warn('Cannot mount widgets: theme or registry not ready');
                return;
            }

            const enabledWidgets = await this.getEnabledWidgets(this.currentTheme);
            const positions = this.currentTheme.widgets?.positions || {};

            for (const widgetId of enabledWidgets) {
                const containerId = positions[widgetId];
                if (containerId) {
                    await window.widgetRegistry.mount(widgetId, containerId, config);
                }
            }
        },

        // Load theme-specific stylesheet
        loadThemeStyles(themeId, stylesFile) {
            // Remove previous theme styles
            const existing = document.getElementById('theme-styles');
            if (existing) existing.remove();

            if (!stylesFile) return;

            const link = document.createElement('link');
            link.id = 'theme-styles';
            link.rel = 'stylesheet';
            link.href = `${THEMES_PATH}/${themeId}/${stylesFile}`;
            document.head.appendChild(link);
        },

        // Load theme-specific scripts
        loadThemeScripts(themeId, scriptFiles) {
            // Remove previous theme scripts
            const existingScripts = document.querySelectorAll('script[data-theme-script]');
            existingScripts.forEach(script => script.remove());

            if (!scriptFiles || !Array.isArray(scriptFiles)) return;

            scriptFiles.forEach(scriptFile => {
                const script = document.createElement('script');
                script.setAttribute('data-theme-script', themeId);
                script.src = `${THEMES_PATH}/${themeId}/${scriptFile}`;
                document.body.appendChild(script);
            });
        },

        // Apply CSS variables to :root
        applyCssVariables(variables) {
            if (!variables) return;

            const root = document.documentElement;
            Object.entries(variables).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
        },

        // Get user's enabled widgets (with defaults)
        async getEnabledWidgets(themeConfig = null) {
            const theme = themeConfig || this.currentTheme;
            const stored = await this.getStoredWidgetPrefs();
            if (stored && stored.length > 0) return stored;

            // Fall back to theme defaults
            return theme?.widgets?.default || [];
        },

        // Save enabled widgets preference
        async saveEnabledWidgets(widgetIds) {
            await this.setStoredWidgetPrefs(widgetIds);
        },

        // Get supported widgets for current theme
        getSupportedWidgets() {
            return this.currentTheme?.widgets?.supported || [];
        },

        // Get current theme config (alias for backwards compatibility)
        getCurrentTheme() {
            return this.currentTheme;
        },

        // Get current theme config (used by bootstrap for hydration)
        getCurrentThemeConfig() {
            return this.currentTheme;
        },

        // Get current theme ID
        getCurrentThemeId() {
            return this.currentThemeId;
        },

        // Get all available themes
        getAvailableThemes() {
            return this.registry?.themes || [];
        },

        // Clear theme cache (useful for development/debugging)
        async clearThemeCache() {
            if (hasChromeLocalStorage()) {
                return new Promise(resolve => {
                    chrome.storage.local.remove([THEME_CACHE_KEY], resolve);
                });
            }
            localStorage.removeItem(THEME_CACHE_KEY);
        },

        // Storage helpers
        async getSelectedThemeId() {
            if (hasChromeSyncStorage()) {
                return new Promise(resolve => {
                    chrome.storage.sync.get([THEME_KEY], result => {
                        resolve(result[THEME_KEY] || null);
                    });
                });
            }
            return localStorage.getItem(THEME_KEY);
        },

        async saveSelectedTheme(themeId) {
            if (hasChromeSyncStorage()) {
                return new Promise(resolve => {
                    chrome.storage.sync.set({ [THEME_KEY]: themeId }, resolve);
                });
            }
            localStorage.setItem(THEME_KEY, themeId);
        },

        async getStoredWidgetPrefs() {
            if (hasChromeSyncStorage()) {
                return new Promise(resolve => {
                    chrome.storage.sync.get([WIDGET_PREFS_KEY], result => {
                        resolve(result[WIDGET_PREFS_KEY] || null);
                    });
                });
            }
            const raw = localStorage.getItem(WIDGET_PREFS_KEY);
            return raw ? JSON.parse(raw) : null;
        },

        async setStoredWidgetPrefs(widgetIds) {
            if (hasChromeSyncStorage()) {
                return new Promise(resolve => {
                    chrome.storage.sync.set({ [WIDGET_PREFS_KEY]: widgetIds }, resolve);
                });
            }
            localStorage.setItem(WIDGET_PREFS_KEY, JSON.stringify(widgetIds));
        },

        // Clear theme selection (for testing/reset)
        async clearThemeSelection() {
            if (hasChromeSyncStorage()) {
                return new Promise(resolve => {
                    chrome.storage.sync.remove([THEME_KEY], resolve);
                });
            }
            localStorage.removeItem(THEME_KEY);
        }
    };

    window.themeLoader = themeLoader;
})();
