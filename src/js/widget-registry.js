// Widget Registry - Manages widget loading and lifecycle

(function () {
    const registry = {
        widgets: {},
        instances: {},

        // Register a widget definition
        register(widget) {
            if (!widget || !widget.id) {
                console.warn('Widget registration failed: missing id');
                return false;
            }
            this.widgets[widget.id] = widget;
            return true;
        },

        // Get all registered widgets
        getAll() {
            return Object.values(this.widgets);
        },

        // Get widget by ID
        get(id) {
            return this.widgets[id] || null;
        },

        // Check if widget requirements are met
        checkRequirements(widget, config) {
            if (!widget.requires || widget.requires.length === 0) {
                return { met: true, missing: [] };
            }

            const profile = config?.profile || {};
            const missing = widget.requires.filter(key => !profile[key]);

            return {
                met: missing.length === 0,
                missing
            };
        },

        // Mount a widget into a container
        async mount(widgetId, containerId, config) {
            const widget = this.widgets[widgetId];
            if (!widget) {
                console.warn(`Widget not found: ${widgetId}`);
                return null;
            }

            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`Container not found: ${containerId}`);
                return null;
            }

            // Check requirements
            const reqs = this.checkRequirements(widget, config);
            if (!reqs.met) {
                console.warn(`Widget ${widgetId} missing config: ${reqs.missing.join(', ')}`);
            }

            try {
                // Render widget HTML
                const html = widget.render(config);
                const wrapper = document.createElement('div');
                wrapper.innerHTML = html;
                const element = wrapper.firstElementChild;

                if (!element) {
                    console.warn(`Widget ${widgetId} returned empty HTML`);
                    return null;
                }

                element.setAttribute('data-widget-id', widgetId);
                container.appendChild(element);

                // Initialize widget
                if (typeof widget.init === 'function') {
                    await widget.init(element, config);
                }

                // Track instance
                this.instances[widgetId] = { element, widget, containerId };

                return element;
            } catch (error) {
                console.error(`Failed to mount widget ${widgetId}:`, error);
                return null;
            }
        },

        // Unmount a widget
        unmount(widgetId) {
            const instance = this.instances[widgetId];
            if (!instance) return false;

            try {
                if (typeof instance.widget.destroy === 'function') {
                    instance.widget.destroy();
                }
                instance.element.remove();
                delete this.instances[widgetId];
                return true;
            } catch (error) {
                console.error(`Failed to unmount widget ${widgetId}:`, error);
                return false;
            }
        },

        // Unmount all widgets
        unmountAll() {
            Object.keys(this.instances).forEach(id => this.unmount(id));
        },

        // Refresh a specific widget
        async refresh(widgetId, config) {
            const instance = this.instances[widgetId];
            if (!instance) return false;

            const { containerId } = instance;
            this.unmount(widgetId);
            return await this.mount(widgetId, containerId, config);
        },

        // Get mounted widget IDs
        getMounted() {
            return Object.keys(this.instances);
        }
    };

    // Auto-register widgets from DevMeWidgets global when available
    function autoRegisterWidgets() {
        if (window.DevMeWidgets) {
            Object.values(window.DevMeWidgets).forEach(w => {
                if (w && w.id) {
                    registry.register(w);
                }
            });
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoRegisterWidgets);
    } else {
        autoRegisterWidgets();
    }

    // Global widget container
    window.DevMeWidgets = window.DevMeWidgets || {};
    window.widgetRegistry = registry;
})();
