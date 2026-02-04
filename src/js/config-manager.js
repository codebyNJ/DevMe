// Config Manager for DevMe Dashboard

(function () {
    const STORAGE_KEY = 'userProfile';
    const ASSETS_KEY = 'userAssets';

    function hasChromeSyncStorage() {
        return typeof chrome !== 'undefined' && chrome?.storage?.sync;
    }

    function hasChromeLocalStorage() {
        return typeof chrome !== 'undefined' && chrome?.storage?.local;
    }

    function getDefaultProfile() {
        return {
            githubUsername: '',
            leetcodeUsername: '',
            linkedinUrl: '',
            name: '',
            title: '',
            location: '',
            avatarImage: '',
            customQuote: ''
        };
    }

    function getDefaultAssets() {
        return {
            bannerImage: ''
        };
    }

    function getVisualDefaults() {
        return window.devmeDefaults || {
            bannerImage: '',
            avatarImage: '',
            customQuote: '',
            theme: {
                primaryColor: '#4d90fe',
                secondaryColor: '#1a1a1a',
                accentColor: '#ffffff'
            }
        };
    }

    function mergeConfig(defaults, profile) {
        const mergedProfile = {
            ...getDefaultProfile(),
            ...(profile || {})
        };

        const visualOverrides = {};
        if (mergedProfile.avatarImage) {
            visualOverrides.avatarImage = mergedProfile.avatarImage;
        }
        if (mergedProfile.customQuote) {
            visualOverrides.customQuote = mergedProfile.customQuote;
        }

        return {
            ...defaults,
            ...visualOverrides,
            profile: mergedProfile
        };
    }

    function mergeConfigWithAssets(defaults, profile, assets) {
        const base = mergeConfig(defaults, profile);

        const mergedAssets = {
            ...getDefaultAssets(),
            ...(assets || {})
        };

        const overrides = {};
        if (mergedAssets.bannerImage) {
            overrides.bannerImage = mergedAssets.bannerImage;
        }

        return {
            ...base,
            ...overrides,
            assets: mergedAssets
        };
    }

    async function getFromChromeStorage() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([STORAGE_KEY], (result) => {
                resolve(result?.[STORAGE_KEY] || null);
            });
        });
    }

    async function getFromChromeLocalStorage() {
        return new Promise((resolve) => {
            chrome.storage.local.get([ASSETS_KEY], (result) => {
                resolve(result?.[ASSETS_KEY] || null);
            });
        });
    }

    async function setInChromeStorage(profile) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ [STORAGE_KEY]: profile }, () => resolve());
        });
    }

    async function setInChromeLocalStorage(assets) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [ASSETS_KEY]: assets }, () => resolve());
        });
    }

    async function getFromLocalStorage() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    async function getAssetsFromLocalStorage() {
        const raw = localStorage.getItem(ASSETS_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    async function setInLocalStorage(profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }

    async function setAssetsInLocalStorage(assets) {
        localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    }

    function notifyConfigChanged(config) {
        const event = new CustomEvent('devme:config-changed', { detail: config });
        document.dispatchEvent(event);
    }

    const configManager = {
        async getProfile() {
            if (hasChromeSyncStorage()) {
                return await getFromChromeStorage();
            }
            return await getFromLocalStorage();
        },

        async getAssets() {
            if (hasChromeLocalStorage()) {
                return await getFromChromeLocalStorage();
            }
            return await getAssetsFromLocalStorage();
        },

        async setProfile(profile) {
            const safeProfile = { ...getDefaultProfile(), ...(profile || {}) };

            if (hasChromeSyncStorage()) {
                await setInChromeStorage(safeProfile);
            } else {
                await setInLocalStorage(safeProfile);
            }

            notifyConfigChanged(await this.getConfig());
        },

        async setAssets(assets) {
            const safeAssets = { ...getDefaultAssets(), ...(assets || {}) };

            if (hasChromeLocalStorage()) {
                await setInChromeLocalStorage(safeAssets);
            } else {
                await setAssetsInLocalStorage(safeAssets);
            }

            notifyConfigChanged(await this.getConfig());
        },

        async clearProfile() {
            if (hasChromeSyncStorage()) {
                await new Promise((resolve) => chrome.storage.sync.remove([STORAGE_KEY], () => resolve()));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }

            notifyConfigChanged(await this.getConfig());
        },

        async clearAssets() {
            if (hasChromeLocalStorage()) {
                await new Promise((resolve) => chrome.storage.local.remove([ASSETS_KEY], () => resolve()));
            } else {
                localStorage.removeItem(ASSETS_KEY);
            }

            notifyConfigChanged(await this.getConfig());
        },

        async getConfig() {
            const defaults = getVisualDefaults();
            const profile = await this.getProfile();
            const assets = await this.getAssets();
            return mergeConfigWithAssets(defaults, profile, assets);
        },

        isConfigured(config, requirements = null) {
            const cfg = config || { profile: getDefaultProfile() };

            // If no specific requirements, check all (legacy behavior)
            if (!requirements) {
                return Boolean(cfg.profile?.githubUsername && cfg.profile?.leetcodeUsername);
            }

            // Check only required fields
            if (requirements.github && !cfg.profile?.githubUsername) return false;
            if (requirements.leetcode && !cfg.profile?.leetcodeUsername) return false;

            return true;
        },

        // Get required credentials based on theme widgets
        getThemeRequirements(themeConfig) {
            if (!themeConfig?.widgets?.default) {
                return { github: false, leetcode: false, needsSetup: false };
            }

            const defaultWidgets = themeConfig.widgets.default;
            const requirements = {
                github: false,
                leetcode: false,
                needsSetup: false
            };

            // Check which widgets need which credentials
            const githubWidgets = ['github-stats', 'github-heatmap'];
            const leetcodeWidgets = ['leetcode-stats'];

            for (const widget of defaultWidgets) {
                if (githubWidgets.includes(widget)) {
                    requirements.github = true;
                }
                if (leetcodeWidgets.includes(widget)) {
                    requirements.leetcode = true;
                }
            }

            requirements.needsSetup = requirements.github || requirements.leetcode;
            return requirements;
        }
    };

    window.configManager = configManager;

    if (hasChromeSyncStorage() && chrome.storage?.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync') {
                if (!changes?.[STORAGE_KEY]) return;
                configManager.getConfig().then((cfg) => notifyConfigChanged(cfg));
                return;
            }

            if (areaName === 'local') {
                if (!changes?.[ASSETS_KEY]) return;
                configManager.getConfig().then((cfg) => notifyConfigChanged(cfg));
            }
        });
    }
})();
