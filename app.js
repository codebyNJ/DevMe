// Dev Dashboard - Main Application Logic
class DevDashboard {
    constructor() {
        this.init().catch(error => {
            console.error('Error initializing dashboard:', error);
        });
    }

    async init() {
        this.setupEventListeners();
        this.loadStoredData();
        this.setupAutoRefresh();
        
        // Load user data from config
        this.loadUserDataFromConfig();
        
        // Load stats immediately
        setTimeout(() => {
            this.loadAllStats();
        }, 1000);
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
                    
                    // Revert after 2 seconds
                    setTimeout(() => {
                        e.target.textContent = originalText;
                        e.target.classList.remove('copied');
                    }, 2000);
                } else {
                    // Show error notification
                    this.showError('Failed to copy link');
                }
            });
        });

        // Make entire link item clickable to open the URL
        document.querySelectorAll('.link-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Only navigate if the click wasn't on the copy button
                if (!e.target.classList.contains('copy-btn') && !e.target.closest('.copy-btn')) {
                    window.open(item.dataset.url, '_blank');
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
            this.loadAllStats();
        }, 5 * 60 * 1000);
    }

    // Load all stats
    async loadAllStats() {
        try {
            const leetcodeUsername = window.userConfig?.leetcodeUsername || 'Nijeesh_1805';
            const githubUsername = window.userConfig?.githubUsername || 'codebyNJ';
            
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
    async fetchLeetCodeStats(username = 'Nijeesh_1805') {
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
                this.updateLeetCodeStats(data);
            } else {
                throw new Error(`LeetCode API error: ${response.status}`);
            }
            
        } catch (error) {
            console.error(`Failed to fetch LeetCode stats: ${error.message}`);
            this.updateLeetCodeStatsError();
        }
    }

    updateLeetCodeStats(data) {
        console.log('Updating LeetCode stats with data:', data);
        
        if (data.status === 'success') {
            const totalElement = document.getElementById('leetcode-total');
            const easyElement = document.getElementById('leetcode-easy');
            const mediumElement = document.getElementById('leetcode-medium');
            const hardElement = document.getElementById('leetcode-hard');
            
            console.log('LeetCode elements found:', {
                total: !!totalElement,
                easy: !!easyElement,
                medium: !!mediumElement,
                hard: !!hardElement
            });
            
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
        } else {
            console.log('LeetCode data status not success, using fallback');
            this.updateLeetCodeStatsError();
        }
    }

    updateLeetCodeStatsError() {
        // Show fallback data when API fails
        const fallbackData = {
            totalSolved: 45,
            easySolved: 20,
            mediumSolved: 22,
            hardSolved: 3
        };
        
        const totalElement = document.getElementById('leetcode-total');
        const easyElement = document.getElementById('leetcode-easy');
        const mediumElement = document.getElementById('leetcode-medium');
        const hardElement = document.getElementById('leetcode-hard');
        
        if (totalElement) {
            totalElement.innerHTML = `
                <span>Problems Solved</span>
                <span class="stat-value">${fallbackData.totalSolved}</span>
            `;
        }
        if (easyElement) {
            easyElement.innerHTML = `
                <span>Easy</span>
                <span class="stat-value">${fallbackData.easySolved}</span>
            `;
        }
        if (mediumElement) {
            mediumElement.innerHTML = `
                <span>Medium</span>
                <span class="stat-value">${fallbackData.mediumSolved}</span>
            `;
        }
        if (hardElement) {
            hardElement.innerHTML = `
                <span>Hard</span>
                <span class="stat-value">${fallbackData.hardSolved}</span>
            `;
        }
        
        console.log('Using fallback LeetCode data due to API issues');
    }

    // Codeforces Stats
    async fetchCodeforcesStats(username = 'Nijeesh_1805') {
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
        // Show fallback data when API fails
        const fallbackData = {
            rating: 1200,
            rank: 'Pupil',
            maxRating: 1400,
            maxRank: 'Specialist',
            contribution: 5,
            friendOfCount: 10
        };
        
        console.log('Using fallback Codeforces data due to API issues');
        this.updateCodeforcesStats(fallbackData);
    }

    // GitHub Stats
    async fetchGitHubStats(username = 'codebyNJ') {
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
            // Fallback to default values
            this.updateGitHubStats({
                publicRepos: 0,
                totalStars: 0,
                totalForks: 0,
                topLanguage: 'Error'
            });
            this.showNotification('Failed to load GitHub stats', 'error');
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
    loadGitHubHeatmap(username = 'codebyNJ') {
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

    // Todo functionality
    addTodo() {
        const input = document.getElementById('todo-input');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        // Create todo item
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Save to Chrome storage
        this.saveTodo(todo);
        
        // Add to UI
        this.addTodoToUI(todo);
        
        // Clear input
        input.value = '';
        input.focus();
    }
    
    addTodoToUI(todo) {
        const todoList = document.getElementById('todo-list');
        if (!todoList) return;
        
        const todoElement = document.createElement('div');
        todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoElement.dataset.id = todo.id;
        
        todoElement.innerHTML = `
            <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''}>
            <label for="todo-${todo.id}">${todo.text}</label>
            <button class="delete-btn" title="Delete task">×</button>
        `;
        
        // Add event listeners
        const checkbox = todoElement.querySelector('input[type="checkbox"]');
        const deleteBtn = todoElement.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', (e) => this.toggleTodo(todo.id, e.target.checked));
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
        
        // Add to the top of the list for new items, or in order for existing ones
        if (todo.completed) {
            todoList.appendChild(todoElement);
        } else {
            const firstCompleted = todoList.querySelector('.completed');
            if (firstCompleted) {
                todoList.insertBefore(todoElement, firstCompleted);
            } else {
                todoList.prepend(todoElement);
            }
        }
    }
    
    async toggleTodo(id, completed) {
        // Get all todos
        const result = await chrome.storage.local.get(['todos']);
        const todos = result.todos || [];
        
        // Update the todo
        const updatedTodos = todos.map(todo => 
            todo.id === id ? { ...todo, completed, updatedAt: new Date().toISOString() } : todo
        );
        
        // Sort todos: active first, then completed (newest first within each group)
        updatedTodos.sort((a, b) => {
            if (a.completed === b.completed) {
                return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            }
            return a.completed ? 1 : -1;
        });
        
        // Save back to storage
        await chrome.storage.local.set({ todos: updatedTodos });
        
        // Update UI
        const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
        if (todoElement) {
            if (completed) {
                todoElement.classList.add('completed');
                const label = todoElement.querySelector('label');
                if (label) {
                    label.style.textDecoration = 'line-through';
                }
                // Move to completed section
                const todoList = document.getElementById('todo-list');
                if (todoList) {
                    todoList.appendChild(todoElement);
                }
            } else {
                todoElement.classList.remove('completed');
                const label = todoElement.querySelector('label');
                if (label) {
                    label.style.textDecoration = 'none';
                }
                // Move to active section
                const todoList = document.getElementById('todo-list');
                const firstCompleted = todoList.querySelector('.completed');
                if (firstCompleted) {
                    todoList.insertBefore(todoElement, firstCompleted);
                } else {
                    todoList.prepend(todoElement);
                }
            }
        }
    }
    
    async deleteTodo(id) {
        // Get all todos
        const result = await chrome.storage.local.get(['todos']);
        const todos = result.todos || [];
        
        // Remove the todo
        const updatedTodos = todos.filter(todo => todo.id !== id);
        
        // Save back to storage
        await chrome.storage.local.set({ todos: updatedTodos });
        
        // Remove from UI with animation
        const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
        if (todoElement) {
            todoElement.style.opacity = '0';
            todoElement.style.transform = 'translateX(20px)';
            setTimeout(() => {
                todoElement.remove();
            }, 200);
        }
    }
    
    async saveTodo(todo) {
        // Get existing todos
        const result = await chrome.storage.local.get(['todos']);
        const todos = result.todos || [];
        
        // Add new todo
        todos.push(todo);
        
        // Save back to storage
        await chrome.storage.local.set({ todos });
    }
    
    async loadTodos() {
        // Get todos from storage
        const result = await chrome.storage.local.get(['todos']);
        const todos = result.todos || [];
        
        // Sort by creation date (newest first)
        const sortedTodos = todos.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Clear existing todos in UI
        const todoList = document.getElementById('todo-list');
        if (todoList) {
            todoList.innerHTML = '';
        }
        
        // Add todos to UI
        sortedTodos.forEach(todo => this.addTodoToUI(todo));
    }
    
    // Load stored data
    async loadStoredData() {
        await this.loadTodos();
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

    // Load user data from config file
    loadUserDataFromConfig() {
        // Check if config is available
        if (typeof window.userConfig !== 'undefined') {
            console.log('✅ Config loaded successfully:', window.userConfig);
            
            // Add a small delay to ensure DOM is ready
            setTimeout(() => {
                this.applyAllConfig(window.userConfig);
                console.log('✅ All config values applied to dashboard');
            }, 100);
        } else {
            console.warn('❌ User config not found, using default values');
        }
    }

    updateDashboardWithUserData(userData) {
        // Update GitHub heatmap
        if (userData.githubUsername) {
            this.loadGitHubHeatmap(userData.githubUsername);
        }

        // Update LeetCode stats
        if (userData.leetcodeUsername) {
            this.fetchLeetCodeStats(userData.leetcodeUsername);
        }

        // Update links
        this.updateLinks(userData);

        // Update banner and avatar
        this.updateBannerAndAvatar(userData);
    }

    updateLinks(userData) {
        const githubLink = document.querySelector('.link-item[data-url*="github.com"]');
        const linkedinLink = document.querySelector('.link-item[data-url*="linkedin.com"]');

        if (githubLink && userData.githubUsername) {
            githubLink.dataset.url = `https://github.com/${userData.githubUsername}`;
            githubLink.querySelector('.link-text').textContent = 'GitHub Profile';
            console.log('✅ GitHub link updated:', userData.githubUsername);
        }

        if (linkedinLink && userData.linkedinUrl) {
            linkedinLink.dataset.url = userData.linkedinUrl;
            linkedinLink.querySelector('.link-text').textContent = 'LinkedIn Profile';
            console.log('✅ LinkedIn link updated:', userData.linkedinUrl);
        }
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

        // Update custom quote
        if (userData.customQuote) {
            const quoteElement = document.querySelector('.quote');
            if (quoteElement) {
                quoteElement.textContent = userData.customQuote;
                console.log('✅ Quote updated:', userData.customQuote);
            } else {
                console.error('❌ Quote element not found');
            }
        }

        // Update GitHub stats
        if (userData.githubUsername) {
            this.fetchGitHubStats(userData.githubUsername);
        }
    }

    // Apply all configuration values
    applyAllConfig(userData) {
        // Update banner and avatar
        this.updateBannerAndAvatar(userData);
        
        // Update links
        this.updateLinks(userData);
        
        // Update GitHub heatmap
        if (userData.githubUsername) {
            this.loadGitHubHeatmap(userData.githubUsername);
        }

        // Update LeetCode stats
        if (userData.leetcodeUsername) {
            this.fetchLeetCodeStats(userData.leetcodeUsername);
        }

        // Apply theme colors if provided
        if (userData.theme) {
            this.applyTheme(userData.theme);
        }
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
});