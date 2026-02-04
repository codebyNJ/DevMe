// Widget: GitHub Stats - Fast cached version

window.DevMeWidgets = window.DevMeWidgets || {};

window.DevMeWidgets['github-stats'] = {
    id: 'github-stats',
    name: 'GitHub Stats',
    description: 'Shows your GitHub repository statistics',
    requires: ['githubUsername'],

    refreshInterval: null,
    username: null,

    render() {
        return `
            <div class="box" data-widget="github-stats">
                <div class="section-title">
                    GitHub Stats
                    <span class="cache-indicator" id="gh-cache-indicator" style="display:none;font-size:10px;opacity:0.6;margin-left:8px"></span>
                </div>
                <div class="stats-container">
                    <div class="stat-item" id="gh-repos">
                        <span class="stat-label">Public Repos</span>
                        <span class="stat-value">--</span>
                    </div>
                    <div class="stat-item" id="gh-stars">
                        <span class="stat-label">Total Stars</span>
                        <span class="stat-value">--</span>
                    </div>
                    <div class="stat-item" id="gh-forks">
                        <span class="stat-label">Total Forks</span>
                        <span class="stat-value">--</span>
                    </div>
                    <div class="stat-item" id="gh-top-language">
                        <span class="stat-label">Top Language</span>
                        <span class="stat-value">--</span>
                    </div>
                </div>
            </div>
        `;
    },

    async init(container, config) {
        this.username = config?.profile?.githubUsername;
        if (!this.username) return;

        const cacheKey = `github-stats-${this.username}`;

        // Try sync cache first (instant)
        if (window.widgetCache) {
            const cached = window.widgetCache.getSync(cacheKey);
            if (cached) {
                this.updateUI(cached.data);
                if (cached.isStale) {
                    this.refreshBackground(cacheKey);
                }
            } else {
                this.fetchAndCache(cacheKey);
            }
        } else {
            await this.fetchData();
        }

        // Auto-refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshBackground(cacheKey);
        }, 5 * 60 * 1000);
    },

    async fetchAndCache(cacheKey) {
        try {
            const data = await this.fetchFromAPI();
            this.updateUI(data);
            if (window.widgetCache) {
                await window.widgetCache.set(cacheKey, data, 5 * 60 * 1000);
            }
        } catch (error) {
            console.error('GitHub fetch failed:', error);
            this.showError();
        }
    },

    async refreshBackground(cacheKey) {
        try {
            const data = await this.fetchFromAPI();
            this.updateUI(data);
            if (window.widgetCache) {
                await window.widgetCache.set(cacheKey, data, 5 * 60 * 1000);
            }
        } catch (error) {
            console.warn('GitHub background refresh failed:', error);
        }
    },

    async fetchFromAPI() {
        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${this.username}`),
            fetch(`https://api.github.com/users/${this.username}/repos?per_page=100`)
        ]);

        if (!userRes.ok) throw new Error('GitHub user not found');

        const userData = await userRes.json();
        const reposData = await reposRes.json();

        let totalStars = 0, totalForks = 0;
        const languages = {};

        reposData.forEach(repo => {
            totalStars += repo.stargazers_count || 0;
            totalForks += repo.forks_count || 0;
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });

        const topLanguage = Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang)[0] || 'None';

        return {
            publicRepos: userData.public_repos || 0,
            totalStars,
            totalForks,
            topLanguage
        };
    },

    async fetchData() {
        try {
            const data = await this.fetchFromAPI();
            this.updateUI(data);
        } catch (error) {
            this.showError();
        }
    },

    updateUI(stats) {
        this.updateStat('gh-repos', stats.publicRepos);
        this.updateStat('gh-stars', stats.totalStars);
        this.updateStat('gh-forks', stats.totalForks);
        this.updateStat('gh-top-language', stats.topLanguage);
    },

    updateStat(id, value) {
        const el = document.querySelector(`#${id} .stat-value`);
        if (el) el.textContent = value;
    },

    showError() {
        this.updateStat('gh-repos', '--');
        this.updateStat('gh-stars', '--');
        this.updateStat('gh-forks', '--');
        this.updateStat('gh-top-language', '--');
    },

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
};
