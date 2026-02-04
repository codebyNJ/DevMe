// Widget: Excalidraw Whiteboard
// Embeds Excalidraw for drawing and note-taking
// Supports both fullscreen and widget modes

window.DevMeWidgets = window.DevMeWidgets || {};

// Excalidraw library loader
const ExcalidrawLoader = {
    loaded: false,
    loading: null,

    async load() {
        if (this.loaded) return true;
        if (this.loading) return this.loading;

        this.loading = new Promise(async (resolve, reject) => {
            try {
                // Check if already loaded
                if (window.ExcalidrawLib) {
                    this.loaded = true;
                    resolve(true);
                    return;
                }

                // Load React first (Excalidraw dependency)
                await this.loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
                await this.loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');

                // Load Excalidraw
                await this.loadScript('https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw.production.min.js');

                this.loaded = true;
                resolve(true);
            } catch (error) {
                console.error('Failed to load Excalidraw:', error);
                reject(error);
            }
        });

        return this.loading;
    },

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
};

// Storage for Excalidraw data
const ExcalidrawStorage = {
    STORAGE_KEY: 'excalidrawData',

    async save(data) {
        const payload = {
            elements: data.elements || [],
            appState: {
                viewBackgroundColor: data.appState?.viewBackgroundColor || '#ffffff',
                currentItemFontFamily: data.appState?.currentItemFontFamily || 1,
                zoom: data.appState?.zoom || { value: 1 }
            },
            savedAt: Date.now()
        };

        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
            return new Promise(resolve => {
                chrome.storage.local.set({ [this.STORAGE_KEY]: payload }, resolve);
            });
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    },

    async load() {
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
            return new Promise(resolve => {
                chrome.storage.local.get([this.STORAGE_KEY], result => {
                    resolve(result[this.STORAGE_KEY] || null);
                });
            });
        }
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
        } catch {
            return null;
        }
    },

    async clear() {
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
            return new Promise(resolve => {
                chrome.storage.local.remove([this.STORAGE_KEY], resolve);
            });
        }
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

// Full-screen Excalidraw canvas widget
window.DevMeWidgets['excalidraw-canvas'] = {
    id: 'excalidraw-canvas',
    name: 'Excalidraw Whiteboard',
    description: 'Full-screen collaborative whiteboard',
    requires: [],

    excalidrawAPI: null,
    saveTimeout: null,

    render() {
        return `
            <div class="excalidraw-fullscreen" data-widget="excalidraw-canvas">
                <div class="excalidraw-toolbar">
                    <button class="excalidraw-btn" id="excalidraw-clear" title="Clear canvas">
                        Clear
                    </button>
                    <button class="excalidraw-btn" id="excalidraw-export" title="Export as PNG">
                        Export
                    </button>
                </div>
                <div id="excalidraw-container" class="excalidraw-container">
                    <div class="excalidraw-loading">
                        <div class="skeleton" style="width: 100%; height: 100%;"></div>
                        <p>Loading Excalidraw...</p>
                    </div>
                </div>
            </div>
        `;
    },

    async init(container, config) {
        try {
            // Load Excalidraw library
            await ExcalidrawLoader.load();

            // Load saved data
            const savedData = await ExcalidrawStorage.load();

            // Initialize Excalidraw
            const excalidrawContainer = container.querySelector('#excalidraw-container');
            if (!excalidrawContainer) return;

            // Clear loading state
            excalidrawContainer.innerHTML = '';

            // Create Excalidraw instance using React
            const root = ReactDOM.createRoot(excalidrawContainer);

            const initialData = savedData ? {
                elements: savedData.elements || [],
                appState: savedData.appState || {}
            } : undefined;

            const ExcalidrawComponent = window.ExcalidrawLib.Excalidraw;

            root.render(
                React.createElement(ExcalidrawComponent, {
                    initialData,
                    onChange: (elements, appState) => this.handleChange(elements, appState),
                    excalidrawAPI: (api) => { this.excalidrawAPI = api; },
                    theme: 'dark',
                    UIOptions: {
                        canvasActions: {
                            saveAsImage: true,
                            loadScene: true,
                            export: { saveFileToDisk: true }
                        }
                    }
                })
            );

            // Setup toolbar buttons
            this.setupToolbar(container);

        } catch (error) {
            console.error('Excalidraw init failed:', error);
            const excalidrawContainer = container.querySelector('#excalidraw-container');
            if (excalidrawContainer) {
                excalidrawContainer.innerHTML = `
                    <div class="excalidraw-error">
                        <p>Failed to load Excalidraw</p>
                        <button onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        }
    },

    handleChange(elements, appState) {
        // Debounce save
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            ExcalidrawStorage.save({ elements, appState });
        }, 1000);
    },

    setupToolbar(container) {
        const clearBtn = container.querySelector('#excalidraw-clear');
        const exportBtn = container.querySelector('#excalidraw-export');

        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm('Clear the entire canvas?')) {
                    if (this.excalidrawAPI) {
                        this.excalidrawAPI.resetScene();
                    }
                    await ExcalidrawStorage.clear();
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                if (this.excalidrawAPI) {
                    const blob = await this.excalidrawAPI.exportToBlob({
                        mimeType: 'image/png',
                        exportWithDarkMode: true
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `excalidraw-${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            });
        }
    },

    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.excalidrawAPI = null;
    }
};

// Mini Excalidraw widget for dashboard
window.DevMeWidgets['excalidraw-mini'] = {
    id: 'excalidraw-mini',
    name: 'Quick Whiteboard',
    description: 'Compact whiteboard widget for quick sketches',
    requires: [],

    excalidrawAPI: null,
    saveTimeout: null,

    render() {
        return `
            <div class="box excalidraw-widget" data-widget="excalidraw-mini">
                <div class="section-title">
                    Quick Whiteboard
                    <div class="excalidraw-mini-actions">
                        <button class="btn-icon" id="excalidraw-mini-clear" title="Clear">
                            <span style="font-size: 14px;">Clear</span>
                        </button>
                        <button class="btn-icon" id="excalidraw-mini-expand" title="Expand">
                            <span style="font-size: 14px;">Expand</span>
                        </button>
                    </div>
                </div>
                <div id="excalidraw-mini-container" class="excalidraw-mini-container">
                    <div class="excalidraw-loading">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        `;
    },

    async init(container, config) {
        try {
            await ExcalidrawLoader.load();

            const savedData = await ExcalidrawStorage.load();
            const excalidrawContainer = container.querySelector('#excalidraw-mini-container');
            if (!excalidrawContainer) return;

            excalidrawContainer.innerHTML = '';

            const root = ReactDOM.createRoot(excalidrawContainer);

            const initialData = savedData ? {
                elements: savedData.elements || [],
                appState: {
                    ...savedData.appState,
                    zenModeEnabled: true
                }
            } : { appState: { zenModeEnabled: true } };

            const ExcalidrawComponent = window.ExcalidrawLib.Excalidraw;

            root.render(
                React.createElement(ExcalidrawComponent, {
                    initialData,
                    onChange: (elements, appState) => this.handleChange(elements, appState),
                    excalidrawAPI: (api) => { this.excalidrawAPI = api; },
                    theme: 'dark',
                    UIOptions: {
                        canvasActions: {
                            saveAsImage: false,
                            loadScene: false,
                            clearCanvas: false,
                            export: false
                        },
                        tools: { image: false }
                    },
                    viewModeEnabled: false,
                    zenModeEnabled: true
                })
            );

            this.setupActions(container);

        } catch (error) {
            console.error('Excalidraw mini init failed:', error);
            const excalidrawContainer = container.querySelector('#excalidraw-mini-container');
            if (excalidrawContainer) {
                excalidrawContainer.innerHTML = '<p style="padding: 20px; text-align: center; opacity: 0.6;">Whiteboard unavailable</p>';
            }
        }
    },

    handleChange(elements, appState) {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            ExcalidrawStorage.save({ elements, appState });
        }, 1000);
    },

    setupActions(container) {
        const clearBtn = container.querySelector('#excalidraw-mini-clear');
        const expandBtn = container.querySelector('#excalidraw-mini-expand');

        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (this.excalidrawAPI) {
                    this.excalidrawAPI.resetScene();
                }
                await ExcalidrawStorage.clear();
            });
        }

        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                // Open full-screen version (could switch theme or open modal)
                alert('To use full-screen mode, switch to the "Excalidraw Full" theme in Settings.');
            });
        }
    },

    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.excalidrawAPI = null;
    }
};
