// API Cache - Stale-While-Revalidate Pattern
// Shows cached data immediately, refreshes in background

(function () {
    const CACHE_KEY = 'widgetCache';
    const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    function hasChromeLocalStorage() {
        return typeof chrome !== 'undefined' && chrome?.storage?.local;
    }

    async function getAllCache() {
        if (hasChromeLocalStorage()) {
            return new Promise((resolve) => {
                chrome.storage.local.get([CACHE_KEY], (result) => {
                    resolve(result?.[CACHE_KEY] || {});
                });
            });
        }
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    async function saveAllCache(cache) {
        if (hasChromeLocalStorage()) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [CACHE_KEY]: cache }, () => resolve());
            });
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    const apiCache = {
        /**
         * Get cached data for a widget
         * @param {string} widgetId - Widget identifier (e.g., 'github-stats')
         * @returns {Promise<{data: any, fetchedAt: number, isStale: boolean} | null>}
         */
        async get(widgetId) {
            const cache = await getAllCache();
            const entry = cache[widgetId];

            if (!entry) return null;

            const ttl = entry.ttl || DEFAULT_TTL;
            const isStale = Date.now() - entry.fetchedAt > ttl;

            return {
                data: entry.data,
                fetchedAt: entry.fetchedAt,
                isStale
            };
        },

        /**
         * Save data to cache
         * @param {string} widgetId - Widget identifier
         * @param {any} data - Data to cache
         * @param {number} ttl - Time-to-live in milliseconds (optional)
         */
        async set(widgetId, data, ttl = DEFAULT_TTL) {
            const cache = await getAllCache();
            cache[widgetId] = {
                data,
                fetchedAt: Date.now(),
                ttl
            };
            await saveAllCache(cache);
        },

        /**
         * Remove cached data for a widget
         * @param {string} widgetId - Widget identifier
         */
        async remove(widgetId) {
            const cache = await getAllCache();
            delete cache[widgetId];
            await saveAllCache(cache);
        },

        /**
         * Clear all cached data
         */
        async clear() {
            await saveAllCache({});
        },

        /**
         * Fetch with stale-while-revalidate pattern
         * Returns cached data immediately if available, then refreshes in background
         *
         * @param {string} widgetId - Widget identifier for caching
         * @param {Function} fetchFn - Async function that fetches fresh data
         * @param {Object} options - Options
         * @param {number} options.ttl - Cache TTL in ms (default: 5 minutes)
         * @param {Function} options.onData - Callback when data is available (cached or fresh)
         * @param {Function} options.onError - Callback when fetch fails
         * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
         * @returns {Promise<any>} - The data (cached or fresh)
         */
        async fetchWithCache(widgetId, fetchFn, options = {}) {
            const { ttl = DEFAULT_TTL, onData, onError, forceRefresh = false } = options;

            // Try to get cached data first
            if (!forceRefresh) {
                const cached = await this.get(widgetId);

                if (cached) {
                    // Return cached data immediately
                    if (onData) onData(cached.data, { fromCache: true, isStale: cached.isStale });

                    // If not stale, we're done
                    if (!cached.isStale) {
                        return cached.data;
                    }

                    // Stale - refresh in background
                    this._refreshInBackground(widgetId, fetchFn, ttl, onData, onError);
                    return cached.data;
                }
            }

            // No cache or force refresh - fetch now
            try {
                const freshData = await fetchFn();
                await this.set(widgetId, freshData, ttl);
                if (onData) onData(freshData, { fromCache: false, isStale: false });
                return freshData;
            } catch (error) {
                if (onError) onError(error);
                throw error;
            }
        },

        /**
         * Refresh data in background without blocking
         */
        async _refreshInBackground(widgetId, fetchFn, ttl, onData, onError) {
            try {
                const freshData = await fetchFn();
                await this.set(widgetId, freshData, ttl);
                if (onData) onData(freshData, { fromCache: false, isStale: false });
            } catch (error) {
                console.warn(`Background refresh failed for ${widgetId}:`, error);
                if (onError) onError(error);
            }
        },

        /**
         * Get cache statistics
         * @returns {Promise<{widgetId: string, fetchedAt: number, isStale: boolean, ttl: number}[]>}
         */
        async getStats() {
            const cache = await getAllCache();
            const now = Date.now();

            return Object.entries(cache).map(([widgetId, entry]) => ({
                widgetId,
                fetchedAt: entry.fetchedAt,
                age: now - entry.fetchedAt,
                ttl: entry.ttl || DEFAULT_TTL,
                isStale: now - entry.fetchedAt > (entry.ttl || DEFAULT_TTL)
            }));
        }
    };

    window.apiCache = apiCache;
})();
