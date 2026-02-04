// First-time setup flow for DevMe Dashboard
// Handles the setup form submission only - visibility is managed by bootstrap.js

(function () {
    let currentRequirements = null;

    const setError = (msg) => {
        const errorEl = document.getElementById('setupError');
        if (!errorEl) return;
        errorEl.textContent = msg || '';
        errorEl.style.display = msg ? 'block' : 'none';
    };

    const trim = (v) => (typeof v === 'string' ? v.trim() : '');

    const hydrateForm = (config) => {
        const profile = config?.profile || {};
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val ?? '';
        };

        set('setupGithubUsername', profile.githubUsername);
        set('setupLeetcodeUsername', profile.leetcodeUsername);
    };

    const updateFormFields = (requirements) => {
        currentRequirements = requirements || window.__DEVME_REQUIREMENTS__ || { github: true, leetcode: true };

        const githubField = document.getElementById('setupGithubField');
        const leetcodeField = document.getElementById('setupLeetcodeField');

        if (githubField) {
            githubField.style.display = currentRequirements.github ? 'block' : 'none';
        }
        if (leetcodeField) {
            leetcodeField.style.display = currentRequirements.leetcode ? 'block' : 'none';
        }

        // Update title based on requirements
        const titleEl = document.querySelector('#setupRoot .section-title');
        if (titleEl) {
            if (currentRequirements.github && currentRequirements.leetcode) {
                titleEl.textContent = 'Enter your usernames';
            } else if (currentRequirements.github) {
                titleEl.textContent = 'Enter your GitHub username';
            } else if (currentRequirements.leetcode) {
                titleEl.textContent = 'Enter your LeetCode username';
            }
        }
    };

    const setupFormHandler = async (e) => {
        e.preventDefault();
        setError('');

        const requirements = currentRequirements || window.__DEVME_REQUIREMENTS__ || { github: true, leetcode: true };

        const githubUsername = trim(document.getElementById('setupGithubUsername')?.value);
        const leetcodeUsername = trim(document.getElementById('setupLeetcodeUsername')?.value);

        // Only validate required fields
        if (requirements.github && !githubUsername) {
            setError('GitHub username is required.');
            return;
        }
        if (requirements.leetcode && !leetcodeUsername) {
            setError('LeetCode username is required.');
            return;
        }

        const profile = {
            githubUsername: githubUsername || '',
            leetcodeUsername: leetcodeUsername || ''
        };

        await window.configManager.setProfile(profile);

        // Transition to dashboard
        const config = await window.configManager.getConfig();
        if (window.devmeBootstrap) {
            await window.devmeBootstrap.showDashboard(config);
        }
    };

    const init = async () => {
        const form = document.getElementById('setupForm');
        if (form) {
            form.addEventListener('submit', setupFormHandler);
        }

        // Listen for requirements update
        document.addEventListener('devme:setup-requirements', (e) => {
            updateFormFields(e.detail);
        });

        // Pre-fill form with any existing data
        if (window.configManager) {
            const config = await window.configManager.getConfig();
            hydrateForm(config);
        }

        // Apply initial requirements if available
        if (window.__DEVME_REQUIREMENTS__) {
            updateFormFields(window.__DEVME_REQUIREMENTS__);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
