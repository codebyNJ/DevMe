// Bootstrap - Entry point orchestrator for DevMe
// Supports instant load via fast cache and hydration

(function () {
    const APP_STATE = {
        LOADING: 'loading',
        THEME_PICKER: 'theme-picker',
        SETUP: 'setup',
        DASHBOARD: 'dashboard'
    };

    const bootstrap = {
        state: APP_STATE.LOADING,
        currentThemeId: null,

        async init() {
            const startTime = window.__DEVME_START__ || Date.now();

            try {
                // Check if instant load already happened
                const instantLoaded = window.__DEVME_INSTANT_LOAD__;
                const snapshot = window.__DEVME_SNAPSHOT__;

                // Initialize theme loader
                const themeResult = await window.themeLoader.init();

                if (themeResult.needsSelection) {
                    if (window.snapshotCache) await window.snapshotCache.clear();
                    this.showThemePicker(themeResult.themes);
                    return;
                }

                this.currentThemeId = themeResult.themeId;

                // If instant load happened and theme matches, just hydrate
                if (instantLoaded && snapshot?.themeId === themeResult.themeId) {
                    console.log(`DevMe: Hydrating (${Date.now() - startTime}ms since start)`);
                    await this.hydrateFromSnapshot(themeResult.themeId);
                    return;
                }

                // Full load needed
                const applied = await window.themeLoader.applyTheme(themeResult.themeId);
                if (!applied) {
                    console.error('Failed to apply theme');
                    this.showThemePicker(themeResult.themes || []);
                    return;
                }

                await this.checkProfileAndProceed();
                console.log(`DevMe: Full load (${Date.now() - startTime}ms)`);

            } catch (error) {
                console.error('Bootstrap failed:', error);
                this.showError('Failed to initialize. Please refresh the page.');
            }
        },

        async hydrateFromSnapshot(themeId) {
            const config = await window.configManager.getConfig();
            const themeConfig = window.themeLoader.getCurrentThemeConfig();
            const requirements = window.configManager.getThemeRequirements(themeConfig);

            // Store requirements
            window.__DEVME_REQUIREMENTS__ = requirements;

            // If theme needs credentials and they're not configured, show setup
            if (requirements.needsSetup && !window.configManager.isConfigured(config, requirements)) {
                if (window.snapshotCache) await window.snapshotCache.clear();
                this.showSetup(requirements);
                return;
            }

            this.state = APP_STATE.DASHBOARD;

            // Load theme styles (CSS file)
            const themeConfig = window.themeLoader.getCurrentThemeConfig();
            if (themeConfig?.styles) {
                window.themeLoader.loadThemeStyles(themeId, themeConfig.styles);
            }

            // Hydrate widgets (attach listeners, start intervals)
            await this.hydrateWidgets(config);

            // Apply any config changes since snapshot
            this.applyUserConfig(config);

            // Initialize icons
            this.initIcons();

            // Schedule snapshot update
            this.scheduleSnapshotSave();

            document.dispatchEvent(new CustomEvent('devme:ready', { detail: { config, hydrated: true } }));
        },

        async hydrateWidgets(config) {
            if (!window.widgetRegistry) return;

            const themeConfig = window.themeLoader.getCurrentThemeConfig();
            if (!themeConfig?.widgets) return;

            const enabledWidgets = await window.themeLoader.getEnabledWidgets(themeConfig);

            for (const widgetId of enabledWidgets) {
                const widget = window.widgetRegistry.get(widgetId);
                if (!widget) continue;

                const container = document.querySelector(`[data-widget="${widgetId}"]`);
                if (!container) continue;

                if (!window.widgetRegistry.checkRequirements(widget, config)) continue;

                if (typeof widget.init === 'function') {
                    try {
                        await widget.init(container, config);
                    } catch (error) {
                        console.warn(`Widget hydration failed for ${widgetId}:`, error);
                    }
                }
            }
        },

        scheduleSnapshotSave() {
            setTimeout(() => {
                this.saveSnapshot();
            }, 3000);
        },

        async saveSnapshot() {
            if (!this.currentThemeId) return;

            const dashboardRoot = document.getElementById('dashboardRoot');
            if (!dashboardRoot || dashboardRoot.style.display === 'none') return;

            // Get current CSS variables
            const style = getComputedStyle(document.documentElement);
            const cssVariables = {};
            const varNames = [
                '--bg-primary', '--bg-secondary', '--bg-tertiary',
                '--text-primary', '--text-secondary',
                '--primary-color', '--accent-color',
                '--border-color', '--success-color', '--warning-color', '--danger-color'
            ];
            varNames.forEach(name => {
                const value = style.getPropertyValue(name).trim();
                if (value) cssVariables[name] = value;
            });

            // Clean HTML
            let html = dashboardRoot.innerHTML;
            html = html.replace(/\s(on\w+)="[^"]*"/gi, '');

            if (window.snapshotCache) {
                await window.snapshotCache.save(html, cssVariables, this.currentThemeId);
            } else if (window.fastCache) {
                await window.fastCache.set('snapshot', {
                    html,
                    cssVariables,
                    themeId: this.currentThemeId,
                    timestamp: Date.now()
                });
            }
        },

        async checkProfileAndProceed() {
            const config = await window.configManager.getConfig();
            const themeConfig = window.themeLoader.getCurrentThemeConfig();
            const requirements = window.configManager.getThemeRequirements(themeConfig);

            // Store requirements for setup form
            window.__DEVME_REQUIREMENTS__ = requirements;

            // If theme doesn't need any credentials, skip setup
            if (!requirements.needsSetup) {
                await this.showDashboard(config);
                return;
            }

            // Check if required credentials are configured
            if (!window.configManager.isConfigured(config, requirements)) {
                this.showSetup(requirements);
            } else {
                await this.showDashboard(config);
            }
        },

        showThemePicker(themes) {
            this.state = APP_STATE.THEME_PICKER;
            this.hideAll();

            const pickerRoot = document.getElementById('themePickerRoot');
            if (!pickerRoot) return;

            const grid = pickerRoot.querySelector('#themeGrid');
            if (grid && themes.length > 0) {
                grid.innerHTML = themes.map(theme => `
                    <div class="theme-card" data-theme-id="${theme.id}">
                        <div class="theme-preview">
                            <img src="${theme.preview}" alt="${theme.name}" onerror="this.style.display='none'">
                        </div>
                        <div class="theme-info">
                            <h3>${theme.name}</h3>
                            <p>${theme.description || ''}</p>
                            <span class="theme-author">by ${theme.author || 'Unknown'}</span>
                        </div>
                    </div>
                `).join('');

                grid.querySelectorAll('.theme-card').forEach(card => {
                    card.addEventListener('click', () => {
                        grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        const btn = document.getElementById('confirmTheme');
                        if (btn) btn.disabled = false;
                    });
                });
            }

            const confirmBtn = document.getElementById('confirmTheme');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', async () => {
                    const selected = grid?.querySelector('.theme-card.selected');
                    if (selected) {
                        await this.selectTheme(selected.dataset.themeId);
                    }
                });
            }

            pickerRoot.style.display = 'block';
        },

        async selectTheme(themeId) {
            document.getElementById('themePickerRoot').style.display = 'none';

            if (window.snapshotCache) await window.snapshotCache.clear();

            const applied = await window.themeLoader.applyTheme(themeId);
            if (applied) {
                this.currentThemeId = themeId;
                await this.checkProfileAndProceed();
            }
        },

        showSetup(requirements = null) {
            this.state = APP_STATE.SETUP;
            this.hideAll();

            // Store requirements for setup form
            if (requirements) {
                window.__DEVME_REQUIREMENTS__ = requirements;
            }

            document.getElementById('setupRoot').style.display = 'block';

            // Trigger setup form to update based on requirements
            document.dispatchEvent(new CustomEvent('devme:setup-requirements', { detail: requirements }));
        },

        async showDashboard(config) {
            this.state = APP_STATE.DASHBOARD;
            this.hideAll();

            const dashboardRoot = document.getElementById('dashboardRoot');
            if (dashboardRoot) {
                dashboardRoot.style.display = 'block';
                dashboardRoot.classList.remove('instant-loaded');
            }

            await window.themeLoader.mountWidgets(config);
            this.applyUserConfig(config);
            this.initIcons();

            // Save snapshot after widgets render
            this.scheduleSnapshotSave();

            document.dispatchEvent(new CustomEvent('devme:ready', { detail: { config } }));
        },

        applyUserConfig(config) {
            if (!config) return;

            if (config.theme) {
                const root = document.documentElement;
                if (config.theme.primaryColor) root.style.setProperty('--primary-color', config.theme.primaryColor);
                if (config.theme.secondaryColor) root.style.setProperty('--secondary-color', config.theme.secondaryColor);
                if (config.theme.accentColor) root.style.setProperty('--accent-color', config.theme.accentColor);
            }

            if (config.bannerImage) {
                const banner = document.querySelector('.banner');
                if (banner) banner.style.backgroundImage = `url(${config.bannerImage})`;
            }

            if (config.avatarImage) {
                const avatar = document.querySelector('.profile-pic');
                if (avatar) avatar.style.backgroundImage = `url(${config.avatarImage})`;
            }

            if (config.customQuote) {
                const quote = document.querySelector('.quote');
                if (quote) quote.textContent = config.customQuote;
            }
        },

        initIcons() {
            if (window.iconRenderer?.hydrateIcons) {
                window.iconRenderer.hydrateIcons();
            } else if (window.lucide?.createIcons) {
                try { window.lucide.createIcons(); } catch (e) {}
            }
        },

        hideAll() {
            ['themePickerRoot', 'setupRoot', 'dashboardRoot'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
        },

        showError(message) {
            document.body.innerHTML += `
                <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;color:#ff6b6b;text-align:center;padding:40px;">
                    <div><h2>Something went wrong</h2><p>${message}</p><button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;cursor:pointer">Refresh</button></div>
                </div>
            `;
        },

        async refresh() {
            if (this.state === APP_STATE.DASHBOARD) {
                const config = await window.configManager.getConfig();
                window.widgetRegistry.unmountAll();
                await window.themeLoader.mountWidgets(config);
                this.applyUserConfig(config);
                this.scheduleSnapshotSave();
            }
        },

        getState() { return this.state; },
        getCurrentThemeId() { return this.currentThemeId; }
    };

    document.addEventListener('devme:config-changed', async (e) => {
        if (bootstrap.state === APP_STATE.DASHBOARD) {
            bootstrap.applyUserConfig(e?.detail);
            bootstrap.scheduleSnapshotSave();
        }
    });

    window.devmeBootstrap = bootstrap;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => bootstrap.init());
    } else {
        bootstrap.init();
    }
})();
