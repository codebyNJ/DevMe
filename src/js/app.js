// Dev Dashboard - Main Application Logic
class DevDashboard {
    constructor() {
        this.currentConfig = null;
        this.init().catch(error => {
            console.error('Error initializing dashboard:', error);
        });
    }

    async init() {
        this.setupEventListeners();
        // Todos are managed by todo.js; no dashboard-level storage load needed here.
        this.setupAutoRefresh();

        await this.loadAndApplyRuntimeConfig();

        document.addEventListener('devme:config-changed', (e) => {
            const cfg = e?.detail;
            this.currentConfig = cfg;
            this.applyRuntimeConfig(cfg);

            if (window.configManager?.isConfigured(cfg)) {
                this.loadAllStats();
            }
        });

        if (window.configManager?.isConfigured(this.currentConfig)) {
            setTimeout(() => {
                this.loadAllStats();
            }, 500);
        }
    }

    async loadAndApplyRuntimeConfig() {
        if (!window.configManager) {
            this.currentConfig = {
                profile: {
                    githubUsername: '',
                    leetcodeUsername: '',
                    linkedinUrl: '',
                    name: '',
                    title: '',
                    location: ''
                }
            };
            return;
        }

        const cfg = await window.configManager.getConfig();
        this.currentConfig = cfg;
        this.applyRuntimeConfig(cfg);
    }

    applyRuntimeConfig(cfg) {
        if (!cfg) return;

        // Apply visuals (defaults)
        this.applyTheme(cfg.theme);

        const quoteElement = document.querySelector('.quote');
        if (quoteElement && cfg.customQuote) {
            quoteElement.textContent = cfg.customQuote;
        }

        this.updateBannerAndAvatar(cfg);

        // Apply identity-driven links
        this.updateLinks(cfg?.profile || {});
    }

    setupEventListeners() {
        // Setup copy functionality for links
        this.setupCopyFunctionality();
    }

    setupCopyFunctionality() {
        // Initialize copy buttons
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const linkItem = e.target.closest('.link-item');
                const url = linkItem.dataset.url;
                
                const success = await this.copyToClipboard(url);
                
                if (success) {
                    // Visual feedback
                    const originalText = e.target.textContent;
                    e.target.textContent = '✓';
                    e.target.classList.add('copied');
                    
                    // Show success notification
                    this.showSuccess('Link copied to clipboard!');
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        e.target.textContent = originalText;
                        e.target.classList.remove('copied');
                    }, 2000);
                }
            });
        });

        // Setup left-side social icons to copy on click
        document.querySelectorAll('.social-icons-left .link-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const url = item.dataset.url;
                const success = await this.copyToClipboard(url);
                
                if (success) {
                    // Visual feedback - add a temporary class
                    item.classList.add('copied');
                    
                    // Show success notification
                    this.showSuccess('Link copied to clipboard!');
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        item.classList.remove('copied');
                    }, 2000);
                }
            });
        });

        // Make entire link item clickable to open the URL (for other link items)
        document.querySelectorAll('.link-item').forEach(item => {
            // Skip left-side social icons as they should only copy
            if (item.closest('.social-icons-left')) return;
            
            item.addEventListener('click', (e) => {
                // Only navigate if the click wasn't on the copy button
                if (!e.target.classList.contains('copy-btn') && !e.target.closest('.copy-btn')) {
                    const url = item.dataset.url;
                    if (url && url !== '#') {
                        window.open(url, '_blank');
                    }
                }
            });
        });
    }

    async copyToClipboard(text) {
        try {
            // Try modern Clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers or non-secure contexts
                return this.fallbackCopyToClipboard(text);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Try fallback method
            return this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch (err) {
            console.error('Fallback copy failed: ', err);
            document.body.removeChild(textarea);
            return false;
        }
    }

    setupAutoRefresh() {
        // Refresh stats every 5 minutes
        setInterval(() => {
            if (window.configManager?.isConfigured(this.currentConfig)) {
                this.loadAllStats();
            }
        }, 5 * 60 * 1000);
    }

    // Load all stats
    async loadAllStats() {
        try {
            const profile = this.currentConfig?.profile || {};
            const leetcodeUsername = profile.leetcodeUsername;
            const githubUsername = profile.githubUsername;

            if (!githubUsername || !leetcodeUsername) {
                return;
            }

            await this.fetchLeetCodeStats(leetcodeUsername);
            await this.fetchGitHubStats(githubUsername);
            this.loadGitHubHeatmap(githubUsername);
            this.loadMonkeytypeHeatmap();
            console.log('All stats loaded successfully');
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showNotification('Error loading stats', 'error');
        }
    }

    // LeetCode Stats
    async fetchLeetCodeStats(username) {
        if (!username) return;
        console.log(`Fetching LeetCode stats for ${username}...`);
        try {
            // Use a more reliable API
            const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            
            console.log('LeetCode API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('LeetCode data received:', data);
                if (data?.status === 'success') {
                    this.updateLeetCodeStats(data);
                } else {
                    this.updateLeetCodeStatsError('Invalid LeetCode username or no data available.');
                }
            } else {
                throw new Error(`LeetCode API error: ${response.status}`);
            }
            
        } catch (error) {
            console.error(`Failed to fetch LeetCode stats: ${error.message}`);
            this.updateLeetCodeStatsError('LeetCode stats unavailable. Please check your username and connection.');
        }
    }

    updateLeetCodeStats(data) {
        console.log('Updating LeetCode stats with data:', data);

        const totalElement = document.getElementById('leetcode-total');
        const easyElement = document.getElementById('leetcode-easy');
        const mediumElement = document.getElementById('leetcode-medium');
        const hardElement = document.getElementById('leetcode-hard');

        if (totalElement) {
            totalElement.innerHTML = `
                <span>Problems Solved</span>
                <span class="stat-value">${data.totalSolved || 0}</span>
            `;
        }
        if (easyElement) {
            easyElement.innerHTML = `
                <span>Easy</span>
                <span class="stat-value">${data.easySolved || 0}</span>
            `;
        }
        if (mediumElement) {
            mediumElement.innerHTML = `
                <span>Medium</span>
                <span class="stat-value">${data.mediumSolved || 0}</span>
            `;
        }
        if (hardElement) {
            hardElement.innerHTML = `
                <span>Hard</span>
                <span class="stat-value">${data.hardSolved || 0}</span>
            `;
        }
    }

    updateLeetCodeStatsError(message) {
        const totalElement = document.getElementById('leetcode-total');
        const easyElement = document.getElementById('leetcode-easy');
        const mediumElement = document.getElementById('leetcode-medium');
        const hardElement = document.getElementById('leetcode-hard');

        if (totalElement) {
            totalElement.innerHTML = `
                <span>Problems Solved</span>
                <span class="stat-value">Unavailable</span>
            `;
        }
        if (easyElement) {
            easyElement.innerHTML = `
                <span>Easy</span>
                <span class="stat-value">-</span>
            `;
        }
        if (mediumElement) {
            mediumElement.innerHTML = `
                <span>Medium</span>
                <span class="stat-value">-</span>
            `;
        }
        if (hardElement) {
            hardElement.innerHTML = `
                <span>Hard</span>
                <span class="stat-value">-</span>
            `;
        }

        if (message) {
            this.showNotification(message, 'error');
        }
    }

    // Codeforces Stats
    async fetchCodeforcesStats(username) {
        console.log(`Fetching Codeforces stats for ${username}...`);
        try {
            const response = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
            console.log('Codeforces API response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Codeforces API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Codeforces data received:', data);
            
            if (data.status === 'OK' && data.result.length > 0) {
                this.updateCodeforcesStats(data.result[0]);
            } else {
                throw new Error('User not found');
            }
            
        } catch (error) {
            console.error(`Failed to fetch Codeforces stats: ${error.message}`);
            this.updateCodeforcesStatsError();
        }
    }

    updateCodeforcesStats(userData) {
        console.log('Updating Codeforces stats with data:', userData);
        
        const ratingElement = document.getElementById('cf-rating');
        const rankElement = document.getElementById('cf-rank');
        const contestsElement = document.getElementById('cf-contests');
        const problemsElement = document.getElementById('cf-problems');
        
        if (ratingElement) {
            ratingElement.innerHTML = `
                <span>Rating</span>
                <span class="stat-value">${userData.rating}</span>
            `;
        }
        if (rankElement) {
            rankElement.innerHTML = `
                <span>Rank</span>
                <span class="stat-value">${userData.rank}</span>
            `;
        }
        if (contestsElement) {
            contestsElement.innerHTML = `
                <span>Max Rating</span>
                <span class="stat-value">${userData.maxRating}</span>
            `;
        }
        if (problemsElement) {
            problemsElement.innerHTML = `
                <span>Contribution</span>
                <span class="stat-value">${userData.contribution}</span>
            `;
        }
    }

    updateCodeforcesStatsError() {
        console.log('Using fallback Codeforces data due to API issues');
        this.updateCodeforcesStats({
            rating: 1200,
            rank: 'Pupil',
            maxRating: 1400,
            maxRank: 'Specialist',
            contribution: 5,
            friendOfCount: 10
        });
    }

    // GitHub Stats
    async fetchGitHubStats(username) {
        if (!username) return;
        try {
            // Fetch user data
            const userResponse = await fetch(`https://api.github.com/users/${username}`);
            if (!userResponse.ok) throw new Error('GitHub user not found');
            const userData = await userResponse.json();
            
            // Fetch repositories data
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
            const reposData = await reposResponse.json();
            
            // Calculate total stars and forks
            let totalStars = 0;
            let totalForks = 0;
            const languages = {};
            
            reposData.forEach(repo => {
                totalStars += repo.stargazers_count || 0;
                totalForks += repo.forks_count || 0;
                
                // Track languages
                if (repo.language) {
                    languages[repo.language] = (languages[repo.language] || 0) + 1;
                }
            });
            
            // Get most used language
            const topLanguage = Object.entries(languages)
                .sort((a, b) => b[1] - a[1])
                .map(([lang]) => lang)[0] || 'None';
            
            // Update the UI
            this.updateGitHubStats({
                publicRepos: userData.public_repos || 0,
                totalStars,
                totalForks,
                topLanguage
            });
            
        } catch (error) {
            console.error('Error fetching GitHub stats:', error);
            this.updateGitHubStats({
                publicRepos: 'Unavailable',
                totalStars: 'Unavailable',
                totalForks: 'Unavailable',
                topLanguage: 'Unavailable'
            });

            const friendly = error?.message === 'GitHub user not found'
                ? 'Invalid GitHub username. Please update it in Settings.'
                : 'GitHub stats unavailable. Please check your connection.';
            this.showNotification(friendly, 'error');
        }
    }

    updateGitHubStats(stats) {
        const updateStat = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                const valueElement = element.querySelector('.stat-value');
                if (valueElement) valueElement.textContent = value;
            }
        };
        
        updateStat('gh-repos', stats.publicRepos);
        updateStat('gh-stars', stats.totalStars);
        updateStat('gh-forks', stats.totalForks);
        updateStat('gh-top-language', stats.topLanguage);
    }

    // GitHub Heatmap
    loadGitHubHeatmap(username) {
        if (!username) return;
        const heatmapContainer = document.getElementById('github-heatmap');
        if (heatmapContainer) {
            heatmapContainer.innerHTML = `
                <img src="https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=dark&hide_border=true&area=true" 
                     alt="GitHub Activity Graph" 
                     style="width: 100%; height: auto; border-radius: 6px; max-height: 120px; object-fit: contain;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; padding: 10px; text-align: center; color: rgba(255, 255, 255, 0.6); font-style: italic; background: rgba(255, 255, 255, 0.05); border-radius: 4px; font-size: 0.7rem;">
                    GitHub heatmap unavailable
                </div>
            `;
        }
    }

    // Monkeytype Heatmap (placeholder - would need API integration)
    loadMonkeytypeHeatmap() {
        const heatmapContainer = document.getElementById('monkeytype-heatmap');
        if (heatmapContainer) {
            heatmapContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.6); font-style: italic; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">
                    Monkeytype heatmap integration would require API access
                </div>
            `;
        }
    }

    // UI Helper functions
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.opacity = '0.6';
            element.style.pointerEvents = 'none';
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background-color: ${type === 'error' ? '#dc3545' : '#28a745'};
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    updateLinks(userData) {
        // Update all GitHub links (including left-side social icons)
        document.querySelectorAll('.link-item[data-url*="github.com"]').forEach(githubLink => {
            if (userData.githubUsername) {
                githubLink.dataset.url = `https://github.com/${userData.githubUsername}`;
                const linkText = githubLink.querySelector('.link-text');
                if (linkText) {
                    linkText.textContent = 'GitHub Profile';
                }
                // Update title for left-side icons
                if (githubLink.closest('.social-icons-left')) {
                    githubLink.title = `GitHub Profile (Click to copy): ${userData.githubUsername}`;
                }
                console.log('✅ GitHub link updated:', userData.githubUsername);
            }
        });

        // Update all LinkedIn links (including left-side social icons)
        document.querySelectorAll('.link-item[data-url*="linkedin.com"]').forEach(linkedinLink => {
            if (userData.linkedinUrl) {
                linkedinLink.dataset.url = userData.linkedinUrl;
                const linkText = linkedinLink.querySelector('.link-text');
                if (linkText) {
                    linkText.textContent = 'LinkedIn Profile';
                }
                // Update title for left-side icons
                if (linkedinLink.closest('.social-icons-left')) {
                    linkedinLink.title = `LinkedIn Profile (Click to copy)`;
                }
                console.log('✅ LinkedIn link updated:', userData.linkedinUrl);
            }
        });
    }

    updateBannerAndAvatar(userData) {
        console.log('🖼️ Updating images with data:', userData);
        
        // Update banner
        if (userData.bannerImage) {
            const banner = document.querySelector('.banner');
            if (banner) {
                const bannerUrl = `url(${userData.bannerImage})`;
                banner.style.backgroundImage = bannerUrl;
                console.log('✅ Banner updated:', bannerUrl);
                
                // Test if image loads
                const testImg = new Image();
                testImg.onload = () => console.log('✅ Banner image loaded successfully');
                testImg.onerror = () => console.error('❌ Banner image failed to load:', userData.bannerImage);
                testImg.src = userData.bannerImage;
            } else {
                console.error('❌ Banner element not found');
            }
        } else {
            console.warn('⚠️ No banner image in config');
        }

        // Update avatar
        if (userData.avatarImage) {
            const profilePic = document.querySelector('.profile-pic');
            if (profilePic) {
                const avatarUrl = `url(${userData.avatarImage})`;
                profilePic.style.backgroundImage = avatarUrl;
                console.log('✅ Avatar updated:', avatarUrl);
                
                // Test if image loads
                const testImg = new Image();
                testImg.onload = () => console.log('✅ Avatar image loaded successfully');
                testImg.onerror = () => console.error('❌ Avatar image failed to load:', userData.avatarImage);
                testImg.src = userData.avatarImage;
            } else {
                console.error('❌ Profile picture element not found');
            }
        } else {
            console.warn('⚠️ No avatar image in config');
        }
    }

    // Apply all configuration values
    applyAllConfig(userData) {
        this.applyRuntimeConfig(userData);
    }

    // Apply theme colors
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme.primaryColor) {
            root.style.setProperty('--primary-color', theme.primaryColor);
        }
        if (theme.secondaryColor) {
            root.style.setProperty('--secondary-color', theme.secondaryColor);
        }
        if (theme.accentColor) {
            root.style.setProperty('--accent-color', theme.accentColor);
        }
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DevDashboard();
    // Expose globally for other scripts to access
    window.devDashboard = dashboard;
    
    // Initialize Lucide icons (renders the settings gear)
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try {
            window.lucide.createIcons();
        } catch (error) {
            console.warn('Lucide icon initialization failed:', error);
        }
    }
});