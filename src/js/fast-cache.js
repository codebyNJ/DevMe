// Fast Cache - Multi-tier caching for instant access
// Tier 1: Memory (instant)
// Tier 2: localStorage (sync, fast)
// Tier 3: chrome.storage.local (async, persistent cross-device)

(function () {
    'use strict';

    // In-memory cache (Tier 1) - Instant access
    const memoryCache = new Map();

    // Cache configuration
    const CONFIG = {
        PREFIX: 'devme_',
        SNAPSHOT_KEY: 'devme_snapshot',
        WIDGET_CACHE_KEY: 'devme_widgets',
        THEME_CACHE_KEY: 'devme_themes',
        MAX_MEMORY_ITEMS: 50,
        COMPRESSION_THRESHOLD: 10000 // Compress if > 10KB
    };

    // Simple LZ compression for large data
    const compress = (str) => {
        if (str.length < CONFIG.COMPRESSION_THRESHOLD) return str;
        try {
            return LZString.compressToUTF16(str);
        } catch {
            return str;
        }
    };

    const decompress = (str) => {
        if (!str) return str;
        try {
            const decompressed = LZString.decompressFromUTF16(str);
            return decompressed || str;
        } catch {
            return str;
        }
    };

    // LZ-String compression (inline minimal version)
    const LZString = {
        compressToUTF16: function(input) {
            if (input == null) return "";
            return this._compress(input, 15, function(a) { return String.fromCharCode(a + 32); }) + " ";
        },
        decompressFromUTF16: function(input) {
            if (input == null) return "";
            if (input === "") return null;
            return this._decompress(input.length, 16384, function(index) { return input.charCodeAt(index) - 32; });
        },
        _compress: function(uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            let i, value, context_dictionary = {}, context_dictionaryToCreate = {},
                context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2,
                context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0,
                context_data_position = 0;
            for (i = 0; i < uncompressed.length; i++) {
                context_c = uncompressed.charAt(i);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }
                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                    context_w = context_wc;
                } else {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (let j = 0; j < context_numBits; j++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position === bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else context_data_position++;
                            }
                            value = context_w.charCodeAt(0);
                            for (let j = 0; j < 8; j++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position === bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else context_data_position++;
                                value = value >> 1;
                            }
                        } else {
                            value = 1;
                            for (let j = 0; j < context_numBits; j++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position === bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else context_data_position++;
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (let j = 0; j < 16; j++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position === bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else context_data_position++;
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn === 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    } else {
                        value = context_dictionary[context_w];
                        for (let j = 0; j < context_numBits; j++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else context_data_position++;
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn === 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }
            if (context_w !== "") {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (let j = 0; j < context_numBits; j++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else context_data_position++;
                        }
                        value = context_w.charCodeAt(0);
                        for (let j = 0; j < 8; j++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else context_data_position++;
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (let j = 0; j < context_numBits; j++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else context_data_position++;
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (let j = 0; j < 16; j++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else context_data_position++;
                            value = value >> 1;
                        }
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (let j = 0; j < context_numBits; j++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position === bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else context_data_position++;
                        value = value >> 1;
                    }
                }
            }
            value = 2;
            for (let j = 0; j < context_numBits; j++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position === bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                } else context_data_position++;
                value = value >> 1;
            }
            while (true) {
                context_data_val = (context_data_val << 1);
                if (context_data_position === bitsPerChar - 1) {
                    context_data.push(getCharFromInt(context_data_val));
                    break;
                } else context_data_position++;
            }
            return context_data.join('');
        },
        _decompress: function(length, resetValue, getNextValue) {
            let dictionary = [], enlargeIn = 4, dictSize = 4, numBits = 3,
                entry = "", result = [], i, w, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
            for (i = 0; i < 3; i++) dictionary[i] = i;
            let bits = 0, maxpower = Math.pow(2, 2), power = 1;
            while (power !== maxpower) {
                let resb = data.val & data.position;
                data.position >>= 1;
                if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            switch (bits) {
                case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1;
                    while (power !== maxpower) {
                        let resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = String.fromCharCode(bits); break;
                case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1;
                    while (power !== maxpower) {
                        let resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = String.fromCharCode(bits); break;
                case 2: return "";
            }
            dictionary[3] = c; w = c; result.push(c);
            while (true) {
                if (data.index > length) return "";
                bits = 0; maxpower = Math.pow(2, numBits); power = 1;
                while (power !== maxpower) {
                    let resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                switch (c = bits) {
                    case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1;
                        while (power !== maxpower) {
                            let resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = String.fromCharCode(bits);
                        c = dictSize - 1; enlargeIn--; break;
                    case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1;
                        while (power !== maxpower) {
                            let resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = String.fromCharCode(bits);
                        c = dictSize - 1; enlargeIn--; break;
                    case 2: return result.join('');
                }
                if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
                if (dictionary[c]) entry = dictionary[c];
                else if (c === dictSize) entry = w + w.charAt(0);
                else return null;
                result.push(entry);
                dictionary[dictSize++] = w + entry.charAt(0);
                enlargeIn--;
                if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
                w = entry;
            }
        }
    };

    const fastCache = {
        /**
         * Get from fastest available tier (sync)
         */
        getSync(key) {
            // Tier 1: Memory
            if (memoryCache.has(key)) {
                return memoryCache.get(key);
            }

            // Tier 2: localStorage (sync)
            try {
                const raw = localStorage.getItem(CONFIG.PREFIX + key);
                if (raw) {
                    const data = JSON.parse(decompress(raw));
                    memoryCache.set(key, data); // Promote to memory
                    return data;
                }
            } catch (e) {
                // Ignore errors
            }

            return null;
        },

        /**
         * Get with async fallback to chrome.storage
         */
        async get(key) {
            // Try sync first
            const syncResult = this.getSync(key);
            if (syncResult !== null) {
                return syncResult;
            }

            // Tier 3: chrome.storage.local (async)
            if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                return new Promise(resolve => {
                    chrome.storage.local.get([CONFIG.PREFIX + key], result => {
                        const data = result[CONFIG.PREFIX + key];
                        if (data) {
                            // Promote to faster tiers
                            memoryCache.set(key, data);
                            try {
                                localStorage.setItem(CONFIG.PREFIX + key, compress(JSON.stringify(data)));
                            } catch (e) {
                                // localStorage might be full
                            }
                        }
                        resolve(data || null);
                    });
                });
            }

            return null;
        },

        /**
         * Set in all tiers (async for persistence)
         */
        async set(key, value) {
            // Tier 1: Memory (instant)
            memoryCache.set(key, value);

            // Limit memory cache size
            if (memoryCache.size > CONFIG.MAX_MEMORY_ITEMS) {
                const firstKey = memoryCache.keys().next().value;
                memoryCache.delete(firstKey);
            }

            // Tier 2: localStorage (sync, fast)
            try {
                const compressed = compress(JSON.stringify(value));
                localStorage.setItem(CONFIG.PREFIX + key, compressed);
            } catch (e) {
                // localStorage might be full, try to clear old items
                this._cleanupLocalStorage();
            }

            // Tier 3: chrome.storage.local (async, persistent)
            if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                chrome.storage.local.set({ [CONFIG.PREFIX + key]: value });
            }
        },

        /**
         * Remove from all tiers
         */
        async remove(key) {
            memoryCache.delete(key);
            localStorage.removeItem(CONFIG.PREFIX + key);

            if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                chrome.storage.local.remove([CONFIG.PREFIX + key]);
            }
        },

        /**
         * Clear all cache
         */
        async clear() {
            memoryCache.clear();

            // Clear localStorage items with our prefix
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(CONFIG.PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                // Get all keys and remove those with our prefix
                chrome.storage.local.get(null, items => {
                    const keys = Object.keys(items).filter(k => k.startsWith(CONFIG.PREFIX));
                    if (keys.length) chrome.storage.local.remove(keys);
                });
            }
        },

        /**
         * Preload critical data into memory cache
         */
        preload(keys) {
            keys.forEach(key => this.getSync(key));
        },

        /**
         * Get cache stats
         */
        getStats() {
            return {
                memoryItems: memoryCache.size,
                localStorageItems: Object.keys(localStorage).filter(k => k.startsWith(CONFIG.PREFIX)).length
            };
        },

        _cleanupLocalStorage() {
            // Remove oldest items if storage is full
            const items = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(CONFIG.PREFIX)) {
                    items.push(key);
                }
            }
            // Remove first half of items
            items.slice(0, Math.floor(items.length / 2)).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    };

    // Specialized snapshot cache for instant rendering
    const snapshotCache = {
        SNAPSHOT_KEY: 'snapshot',

        /**
         * Get snapshot synchronously (for instant load)
         */
        getSync() {
            return fastCache.getSync(this.SNAPSHOT_KEY);
        },

        /**
         * Save snapshot
         */
        async save(html, cssVariables, themeId) {
            const snapshot = {
                html,
                cssVariables,
                themeId,
                timestamp: Date.now()
            };
            await fastCache.set(this.SNAPSHOT_KEY, snapshot);
        },

        /**
         * Clear snapshot
         */
        async clear() {
            await fastCache.remove(this.SNAPSHOT_KEY);
        },

        /**
         * Check if snapshot is valid
         */
        isValid(snapshot, currentThemeId, maxAge = 24 * 60 * 60 * 1000) {
            if (!snapshot?.html || !snapshot?.themeId) return false;
            if (snapshot.themeId !== currentThemeId) return false;
            if (Date.now() - snapshot.timestamp > maxAge) return false;
            return true;
        }
    };

    // Specialized widget data cache
    const widgetCache = {
        /**
         * Get cached widget data (sync)
         */
        getSync(widgetId) {
            const data = fastCache.getSync(`widget_${widgetId}`);
            if (!data) return null;

            return {
                data: data.data,
                isStale: Date.now() - data.timestamp > (data.ttl || 300000),
                timestamp: data.timestamp
            };
        },

        /**
         * Get cached widget data (async)
         */
        async get(widgetId) {
            const data = await fastCache.get(`widget_${widgetId}`);
            if (!data) return null;

            return {
                data: data.data,
                isStale: Date.now() - data.timestamp > (data.ttl || 300000),
                timestamp: data.timestamp
            };
        },

        /**
         * Save widget data
         */
        async set(widgetId, data, ttl = 300000) {
            await fastCache.set(`widget_${widgetId}`, {
                data,
                timestamp: Date.now(),
                ttl
            });
        },

        /**
         * Fetch with cache (stale-while-revalidate)
         */
        async fetchWithCache(widgetId, fetchFn, options = {}) {
            const { ttl = 300000, onData, onError } = options;

            // Try sync cache first (instant)
            const cached = this.getSync(widgetId);
            if (cached) {
                if (onData) onData(cached.data, { fromCache: true, isStale: cached.isStale });

                if (!cached.isStale) {
                    return cached.data;
                }

                // Refresh in background
                this._refreshBackground(widgetId, fetchFn, ttl, onData, onError);
                return cached.data;
            }

            // No cache - fetch now
            try {
                const data = await fetchFn();
                await this.set(widgetId, data, ttl);
                if (onData) onData(data, { fromCache: false, isStale: false });
                return data;
            } catch (error) {
                if (onError) onError(error);
                throw error;
            }
        },

        async _refreshBackground(widgetId, fetchFn, ttl, onData, onError) {
            try {
                const data = await fetchFn();
                await this.set(widgetId, data, ttl);
                if (onData) onData(data, { fromCache: false, isStale: false });
            } catch (error) {
                if (onError) onError(error);
            }
        }
    };

    // Export
    window.fastCache = fastCache;
    window.snapshotCache = snapshotCache;
    window.widgetCache = widgetCache;

    // Preload critical data on script load
    fastCache.preload(['snapshot', 'widget_github-stats', 'widget_leetcode-stats']);
})();
