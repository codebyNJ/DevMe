// Snapshot System - Instant Load via Cached HTML
// Saves the rendered dashboard state for immediate display on next load

(function () {
    const SNAPSHOT_KEY = 'dashboardSnapshot';

    function hasChromeLocalStorage() {
        return typeof chrome !== 'undefined' && chrome?.storage?.local;
    }

    async function getSnapshot() {
        if (hasChromeLocalStorage()) {
            return new Promise((resolve) => {
                chrome.storage.local.get([SNAPSHOT_KEY], (result) => {
                    resolve(result?.[SNAPSHOT_KEY] || null);
                });
            });
        }
        try {
            return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
        } catch {
            return null;
        }
    }

    async function saveSnapshot(snapshot) {
        if (hasChromeLocalStorage()) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [SNAPSHOT_KEY]: snapshot }, () => resolve());
            });
        }
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    }

    async function clearSnapshot() {
        if (hasChromeLocalStorage()) {
            return new Promise((resolve) => {
                chrome.storage.local.remove([SNAPSHOT_KEY], () => resolve());
            });
        }
        localStorage.removeItem(SNAPSHOT_KEY);
    }

    /**
     * Get CSS variables from :root
     */
    function getCSSVariables() {
        const vars = {};
        const style = getComputedStyle(document.documentElement);

        // Common CSS variables used by themes
        const varNames = [
            '--bg-primary', '--bg-secondary', '--bg-tertiary',
            '--text-primary', '--text-secondary',
            '--primary-color', '--accent-color',
            '--border-color', '--box-shadow',
            '--font-primary', '--font-secondary'
        ];

        varNames.forEach(name => {
            const value = style.getPropertyValue(name).trim();
            if (value) {
                vars[name] = value;
            }
        });

        return vars;
    }

    /**
     * Apply CSS variables to :root
     */
    function applyCSSVariables(vars) {
        if (!vars) return;
        Object.entries(vars).forEach(([name, value]) => {
            document.documentElement.style.setProperty(name, value);
        });
    }

    /**
     * Clean HTML before saving (remove event handlers, scripts, etc.)
     */
    function cleanHTMLForSnapshot(html) {
        // Remove inline event handlers
        html = html.replace(/\s(on\w+)="[^"]*"/gi, '');
        // Remove script tags that might have been injected
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        return html;
    }

    const snapshotManager = {
        /**
         * Check if a valid snapshot exists
         */
        async hasSnapshot() {
            const snapshot = await getSnapshot();
            return Boolean(snapshot?.html && snapshot?.themeId);
        },

        /**
         * Load and apply the cached snapshot
         * @returns {Promise<{success: boolean, themeId: string | null}>}
         */
        async loadSnapshot() {
            const snapshot = await getSnapshot();

            if (!snapshot?.html) {
                return { success: false, themeId: null };
            }

            // Check if snapshot is too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000;
            if (snapshot.timestamp && Date.now() - snapshot.timestamp > maxAge) {
                await clearSnapshot();
                return { success: false, themeId: null };
            }

            const dashboardRoot = document.getElementById('dashboardRoot');
            if (!dashboardRoot) {
                return { success: false, themeId: null };
            }

            // Apply cached CSS variables first
            if (snapshot.cssVariables) {
                applyCSSVariables(snapshot.cssVariables);
            }

            // Inject cached HTML
            dashboardRoot.innerHTML = snapshot.html;
            dashboardRoot.style.display = 'block';

            // Mark that we rendered from cache
            window.__DEVME_CACHE_RENDERED__ = true;
            window.__DEVME_CACHE_THEME__ = snapshot.themeId;
            window.__DEVME_SNAPSHOT_TIME__ = snapshot.timestamp;

            return { success: true, themeId: snapshot.themeId };
        },

        /**
         * Save current dashboard state as snapshot
         * @param {string} themeId - Current theme ID
         */
        async saveSnapshot(themeId) {
            const dashboardRoot = document.getElementById('dashboardRoot');
            if (!dashboardRoot) return;

            // Don't save if dashboard is not visible
            if (dashboardRoot.style.display === 'none') return;

            const html = cleanHTMLForSnapshot(dashboardRoot.innerHTML);
            const cssVariables = getCSSVariables();

            const snapshot = {
                html,
                cssVariables,
                themeId,
                timestamp: Date.now()
            };

            await saveSnapshot(snapshot);
        },

        /**
         * Clear the snapshot cache
         */
        async clearSnapshot() {
            await clearSnapshot();
            window.__DEVME_CACHE_RENDERED__ = false;
            window.__DEVME_CACHE_THEME__ = null;
        },

        /**
         * Check if current render matches the cached theme
         */
        isCacheValid(currentThemeId) {
            return window.__DEVME_CACHE_RENDERED__ &&
                window.__DEVME_CACHE_THEME__ === currentThemeId;
        },

        /**
         * Schedule snapshot save (debounced)
         */
        scheduleSave(themeId, delay = 2000) {
            if (this._saveTimeout) {
                clearTimeout(this._saveTimeout);
            }
            this._saveTimeout = setTimeout(() => {
                this.saveSnapshot(themeId);
            }, delay);
        },

        /**
         * Get snapshot info without loading it
         */
        async getInfo() {
            const snapshot = await getSnapshot();
            if (!snapshot) return null;

            return {
                themeId: snapshot.themeId,
                timestamp: snapshot.timestamp,
                age: Date.now() - snapshot.timestamp,
                htmlSize: snapshot.html?.length || 0
            };
        }
    };

    window.snapshotManager = snapshotManager;
})();
