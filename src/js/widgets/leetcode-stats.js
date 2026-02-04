// Widget: LeetCode Stats
// Displays LeetCode problem solving progress with caching

window.DevMeWidgets = window.DevMeWidgets || {};

window.DevMeWidgets['leetcode-stats'] = {
    id: 'leetcode-stats',
    name: 'LeetCode Stats',
    description: 'Shows your LeetCode problem solving progress',
    requires: ['leetcodeUsername'],

    refreshInterval: null,
    currentUsername: null,

    render() {
        return `
            <div class="box" data-widget="leetcode-stats">
                <div class="section-title">
                    LeetCode Stats
                    <span class="cache-indicator" id="lc-cache-indicator" style="display:none; font-size: 10px; opacity: 0.6; margin-left: 8px;"></span>
                </div>
                <div class="stats-container">
                    <div class="stat-item" id="leetcode-total">
                        <span class="stat-label">Problems Solved</span>
                        <span class="stat-value">Loading...</span>
                    </div>
                    <div class="stat-item" id="leetcode-easy">
                        <span class="stat-label">Easy</span>
                        <span class="stat-value">-</span>
                    </div>
                    <div class="stat-item" id="leetcode-medium">
                        <span class="stat-label">Medium</span>
                        <span class="stat-value">-</span>
                    </div>
                    <div class="stat-item" id="leetcode-hard">
                        <span class="stat-label">Hard</span>
                        <span class="stat-value">-</span>
                    </div>
                </div>
            </div>
        `;
    },

    async init(container, config) {
        const username = config?.profile?.leetcodeUsername;
        if (!username) return;

        this.currentUsername = username;
        const cacheKey = `leetcode-stats-${username}`;

        // Try sync cache first (instant)
        if (window.widgetCache) {
            const cached = window.widgetCache.getSync(cacheKey);
            if (cached) {
                this.updateUI(cached.data);
                if (cached.isStale) {
                    this.refreshBackground(cacheKey, username);
                }
            } else {
                this.fetchAndCache(cacheKey, username);
            }
        } else {
            await this.fetchStats(username);
        }

        // Auto-refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshBackground(cacheKey, username);
        }, 5 * 60 * 1000);
    },

    async fetchAndCache(cacheKey, username) {
        try {
            const data = await this.fetchFromAPI(username);
            this.updateUI(data);
            if (window.widgetCache) {
                await window.widgetCache.set(cacheKey, data, 5 * 60 * 1000);
            }
        } catch (error) {
            console.error('LeetCode fetch failed:', error);
            this.showError();
        }
    },

    async refreshBackground(cacheKey, username) {
        try {
            const data = await this.fetchFromAPI(username);
            this.updateUI(data);
            if (window.widgetCache) {
                await window.widgetCache.set(cacheKey, data, 5 * 60 * 1000);
            }
        } catch (error) {
            console.warn('LeetCode background refresh failed:', error);
        }
    },

    async fetchFromAPI(username) {
        const response = await fetch(
            `https://leetcode-stats-api.herokuapp.com/${username}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        if (data?.status !== 'success') {
            throw new Error('LeetCode user not found');
        }

        return {
            totalSolved: data.totalSolved || 0,
            easySolved: data.easySolved || 0,
            mediumSolved: data.mediumSolved || 0,
            hardSolved: data.hardSolved || 0
        };
    },

    // Legacy method for fallback
    async fetchStats(username) {
        try {
            const stats = await this.fetchFromAPI(username);
            this.updateUI(stats);
        } catch (error) {
            console.error('LeetCode fetch failed:', error);
            this.showError();
        }
    },

    showCacheStatus(meta) {
        const indicator = document.getElementById('lc-cache-indicator');
        if (!indicator) return;

        if (meta.fromCache && meta.isStale) {
            indicator.textContent = '(updating...)';
            indicator.style.display = 'inline';
        } else if (meta.fromCache) {
            indicator.textContent = '(cached)';
            indicator.style.display = 'inline';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        } else {
            indicator.style.display = 'none';
        }
    },

    updateUI(data) {
        this.updateStat('leetcode-total', data.totalSolved);
        this.updateStat('leetcode-easy', data.easySolved);
        this.updateStat('leetcode-medium', data.mediumSolved);
        this.updateStat('leetcode-hard', data.hardSolved);
    },

    updateStat(id, value) {
        const el = document.querySelector(`#${id} .stat-value`);
        if (el) el.textContent = value;
    },

    showError() {
        this.updateStat('leetcode-total', 'Unavailable');
        this.updateStat('leetcode-easy', '-');
        this.updateStat('leetcode-medium', '-');
        this.updateStat('leetcode-hard', '-');
    },

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
};
