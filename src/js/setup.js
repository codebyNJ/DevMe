// First-time setup flow for DevMe Dashboard

document.addEventListener('DOMContentLoaded', () => {
    const setupRoot = document.getElementById('setupRoot');
    const dashboardRoot = document.getElementById('dashboardRoot');

    const form = document.getElementById('setupForm');
    const errorEl = document.getElementById('setupError');

    const showSetup = () => {
        if (setupRoot) setupRoot.style.display = 'block';
        if (dashboardRoot) dashboardRoot.style.display = 'none';
    };

    const showDashboard = () => {
        if (setupRoot) setupRoot.style.display = 'none';
        if (dashboardRoot) dashboardRoot.style.display = 'block';
    };

    const setError = (msg) => {
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
        set('setupLinkedinUrl', profile.linkedinUrl);
        set('setupName', profile.name);
        set('setupTitle', profile.title);
        set('setupLocation', profile.location);
    };

    async function updateView() {
        const cfg = await window.configManager.getConfig();
        if (window.configManager.isConfigured(cfg)) {
            showDashboard();
        } else {
            hydrateForm(cfg);
            showSetup();
        }
    }

    document.addEventListener('devme:config-changed', () => {
        updateView().catch(() => {});
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            setError('');

            const githubUsername = trim(document.getElementById('setupGithubUsername')?.value);
            const leetcodeUsername = trim(document.getElementById('setupLeetcodeUsername')?.value);

            if (!githubUsername) {
                setError('GitHub username is required.');
                return;
            }
            if (!leetcodeUsername) {
                setError('LeetCode username is required.');
                return;
            }

            const profile = {
                githubUsername,
                leetcodeUsername,
                linkedinUrl: trim(document.getElementById('setupLinkedinUrl')?.value),
                name: trim(document.getElementById('setupName')?.value),
                title: trim(document.getElementById('setupTitle')?.value),
                location: trim(document.getElementById('setupLocation')?.value)
            };

            await window.configManager.setProfile(profile);
        });
    }

    updateView().catch(() => showSetup());
});
