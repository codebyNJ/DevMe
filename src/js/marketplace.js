// Theme Marketplace - Browse and install themes from external sources

(function () {
    const MARKETPLACE_CACHE_KEY = 'marketplaceCache';
    const INSTALLED_THEMES_KEY = 'installedThemes';
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour

    function hasChromeLocalStorage() {
        return typeof chrome !== 'undefined' && chrome?.storage?.local;
    }

    async function getFromStorage(key) {
        if (hasChromeLocalStorage()) {
            return new Promise(resolve => {
                chrome.storage.local.get([key], result => {
                    resolve(result[key] || null);
                });
            });
        }
        try {
            return JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
            return null;
        }
    }

    async function saveToStorage(key, value) {
        if (hasChromeLocalStorage()) {
            return new Promise(resolve => {
                chrome.storage.local.set({ [key]: value }, resolve);
            });
        }
        localStorage.setItem(key, JSON.stringify(value));
    }

    const marketplace = {
        registryUrl: null,

        /**
         * Initialize marketplace with registry URL from theme registry
         */
        async init() {
            try {
                const response = await fetch('src/themes/registry.json');
                const registry = await response.json();
                this.registryUrl = registry.marketplaceUrl;
            } catch (error) {
                console.warn('Could not load marketplace URL:', error);
            }
        },

        /**
         * Browse available themes from marketplace
         * @param {boolean} forceRefresh - Force fetch from network
         * @returns {Promise<{themes: Array, categories: Array, lastUpdated: string}>}
         */
        async browse(forceRefresh = false) {
            if (!this.registryUrl) {
                await this.init();
            }

            if (!this.registryUrl) {
                return { themes: [], categories: [], error: 'Marketplace URL not configured' };
            }

            // Check cache first
            if (!forceRefresh) {
                const cached = await getFromStorage(MARKETPLACE_CACHE_KEY);
                if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
                    return cached.data;
                }
            }

            try {
                const response = await fetch(this.registryUrl);
                if (!response.ok) throw new Error('Failed to fetch marketplace');

                const data = await response.json();

                // Cache the result
                await saveToStorage(MARKETPLACE_CACHE_KEY, {
                    data,
                    fetchedAt: Date.now()
                });

                return data;
            } catch (error) {
                console.error('Marketplace fetch failed:', error);

                // Return cached data if available
                const cached = await getFromStorage(MARKETPLACE_CACHE_KEY);
                if (cached?.data) {
                    return { ...cached.data, offline: true };
                }

                return { themes: [], categories: [], error: error.message };
            }
        },

        /**
         * Get details for a specific theme
         * @param {string} themeId - Theme ID
         * @returns {Promise<Object|null>}
         */
        async getThemeDetails(themeId) {
            const { themes } = await this.browse();
            return themes.find(t => t.id === themeId) || null;
        },

        /**
         * Install a theme from marketplace
         * @param {string} themeId - Theme ID to install
         * @param {Function} onProgress - Progress callback
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async install(themeId, onProgress = () => {}) {
            try {
                onProgress({ stage: 'fetching', progress: 0 });

                // Get theme details
                const themeInfo = await this.getThemeDetails(themeId);
                if (!themeInfo) {
                    return { success: false, error: 'Theme not found in marketplace' };
                }

                onProgress({ stage: 'downloading', progress: 20 });

                // Fetch theme manifest
                const manifestResponse = await fetch(themeInfo.manifestUrl);
                if (!manifestResponse.ok) throw new Error('Failed to fetch theme manifest');
                const manifest = await manifestResponse.json();

                onProgress({ stage: 'downloading', progress: 40 });

                // Fetch theme template
                const templateUrl = themeInfo.manifestUrl.replace('theme.json', manifest.template);
                const templateResponse = await fetch(templateUrl);
                if (!templateResponse.ok) throw new Error('Failed to fetch theme template');
                const template = await templateResponse.text();

                onProgress({ stage: 'downloading', progress: 60 });

                // Fetch theme styles
                const stylesUrl = themeInfo.manifestUrl.replace('theme.json', manifest.styles);
                const stylesResponse = await fetch(stylesUrl);
                if (!stylesResponse.ok) throw new Error('Failed to fetch theme styles');
                const styles = await stylesResponse.text();

                onProgress({ stage: 'installing', progress: 80 });

                // Save to installed themes
                const installed = await this.getInstalledThemes();
                installed[themeId] = {
                    manifest,
                    template,
                    styles,
                    installedAt: Date.now(),
                    version: themeInfo.version,
                    source: 'marketplace'
                };

                await saveToStorage(INSTALLED_THEMES_KEY, installed);

                onProgress({ stage: 'complete', progress: 100 });

                return { success: true };
            } catch (error) {
                console.error(`Failed to install theme ${themeId}:`, error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Uninstall a theme
         * @param {string} themeId - Theme ID to uninstall
         * @returns {Promise<{success: boolean}>}
         */
        async uninstall(themeId) {
            try {
                const installed = await this.getInstalledThemes();

                if (!installed[themeId]) {
                    return { success: false, error: 'Theme not installed' };
                }

                delete installed[themeId];
                await saveToStorage(INSTALLED_THEMES_KEY, installed);

                // Clear theme cache
                if (window.themeLoader) {
                    await window.themeLoader.clearThemeCache();
                }

                return { success: true };
            } catch (error) {
                console.error(`Failed to uninstall theme ${themeId}:`, error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Get all installed marketplace themes
         * @returns {Promise<Object>}
         */
        async getInstalledThemes() {
            const installed = await getFromStorage(INSTALLED_THEMES_KEY);
            return installed || {};
        },

        /**
         * Check if a theme is installed
         * @param {string} themeId - Theme ID
         * @returns {Promise<boolean>}
         */
        async isInstalled(themeId) {
            const installed = await this.getInstalledThemes();
            return Boolean(installed[themeId]);
        },

        /**
         * Get installed theme data (for theme loader)
         * @param {string} themeId - Theme ID
         * @returns {Promise<Object|null>}
         */
        async getInstalledTheme(themeId) {
            const installed = await this.getInstalledThemes();
            return installed[themeId] || null;
        },

        /**
         * Check for theme updates
         * @returns {Promise<Array>} - Array of themes with available updates
         */
        async checkForUpdates() {
            const installed = await this.getInstalledThemes();
            const { themes: marketplaceThemes } = await this.browse(true);

            const updates = [];
            for (const [themeId, data] of Object.entries(installed)) {
                const marketplaceVersion = marketplaceThemes.find(t => t.id === themeId);
                if (marketplaceVersion && marketplaceVersion.version !== data.version) {
                    updates.push({
                        themeId,
                        currentVersion: data.version,
                        newVersion: marketplaceVersion.version
                    });
                }
            }

            return updates;
        },

        /**
         * Search themes by query
         * @param {string} query - Search query
         * @returns {Promise<Array>}
         */
        async search(query) {
            const { themes } = await this.browse();
            const lowerQuery = query.toLowerCase();

            return themes.filter(theme =>
                theme.name.toLowerCase().includes(lowerQuery) ||
                theme.description?.toLowerCase().includes(lowerQuery) ||
                theme.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        },

        /**
         * Get themes by category
         * @param {string} categoryId - Category ID
         * @returns {Promise<Array>}
         */
        async getByCategory(categoryId) {
            const { themes } = await this.browse();
            return themes.filter(theme => theme.category === categoryId);
        },

        /**
         * Get featured themes
         * @returns {Promise<Array>}
         */
        async getFeatured() {
            const { themes } = await this.browse();
            return themes.filter(theme => theme.featured);
        },

        /**
         * Clear marketplace cache
         */
        async clearCache() {
            await saveToStorage(MARKETPLACE_CACHE_KEY, null);
        }
    };

    window.marketplace = marketplace;
})();
