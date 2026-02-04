// Widget: System Resources Monitor
// Displays CPU, Memory, Network, and Browser resource usage

window.DevMeWidgets = window.DevMeWidgets || {};

// CPU Monitor Widget
window.DevMeWidgets['cpu-monitor'] = {
    id: 'cpu-monitor',
    name: 'CPU Monitor',
    description: 'Real-time CPU usage monitoring',
    requires: [],

    interval: null,
    history: [],
    maxHistory: 60,
    canvas: null,
    ctx: null,

    render() {
        return `
            <div class="box resource-widget" data-widget="cpu-monitor">
                <div class="section-title">
                    <span>CPU Usage</span>
                    <span class="resource-value" id="cpu-current">--%</span>
                </div>
                <div class="resource-chart">
                    <canvas id="cpu-canvas" width="280" height="80"></canvas>
                </div>
                <div class="resource-details">
                    <div class="resource-detail">
                        <span class="detail-label">Cores</span>
                        <span class="detail-value" id="cpu-cores">--</span>
                    </div>
                    <div class="resource-detail">
                        <span class="detail-label">Architecture</span>
                        <span class="detail-value" id="cpu-arch">--</span>
                    </div>
                </div>
            </div>
        `;
    },

    async init(container, config) {
        this.canvas = container.querySelector('#cpu-canvas');
        this.ctx = this.canvas?.getContext('2d');

        // Check if system.cpu API is available
        if (typeof chrome !== 'undefined' && chrome.system?.cpu) {
            await this.updateCPU();
            this.interval = setInterval(() => this.updateCPU(), 1000);
        } else {
            // Simulate data for demo/testing
            this.simulateData();
            this.interval = setInterval(() => this.simulateData(), 1000);
        }
    },

    async updateCPU() {
        try {
            const info = await new Promise(resolve => {
                chrome.system.cpu.getInfo(resolve);
            });

            // Update static info
            document.getElementById('cpu-cores').textContent = info.numOfProcessors;
            document.getElementById('cpu-arch').textContent = info.archName;

            // Calculate usage
            let totalUsage = 0;
            info.processors.forEach(p => {
                const total = p.usage.user + p.usage.kernel + p.usage.idle;
                const used = p.usage.user + p.usage.kernel;
                totalUsage += (used / total) * 100;
            });
            const avgUsage = Math.round(totalUsage / info.numOfProcessors);

            this.history.push(avgUsage);
            if (this.history.length > this.maxHistory) this.history.shift();

            document.getElementById('cpu-current').textContent = `${avgUsage}%`;
            this.drawChart();
        } catch (error) {
            console.warn('CPU info unavailable:', error);
        }
    },

    simulateData() {
        // Generate realistic-looking CPU data
        const base = 20 + Math.random() * 30;
        const spike = Math.random() > 0.9 ? Math.random() * 40 : 0;
        const usage = Math.min(100, Math.round(base + spike));

        this.history.push(usage);
        if (this.history.length > this.maxHistory) this.history.shift();

        document.getElementById('cpu-cores').textContent = navigator.hardwareConcurrency || 8;
        document.getElementById('cpu-arch').textContent = 'x86_64';
        document.getElementById('cpu-current').textContent = `${usage}%`;
        this.drawChart();
    },

    drawChart() {
        if (!this.ctx || !this.canvas) return;

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);

        // Grid lines
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (h / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        // Usage line
        if (this.history.length < 2) return;

        const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(77, 144, 254, 0.3)');
        gradient.addColorStop(1, 'rgba(77, 144, 254, 0)');

        // Fill area
        this.ctx.beginPath();
        this.ctx.moveTo(0, h);
        this.history.forEach((usage, i) => {
            const x = (w / this.maxHistory) * i;
            const y = h - (usage / 100) * h;
            this.ctx.lineTo(x, y);
        });
        this.ctx.lineTo((w / this.maxHistory) * (this.history.length - 1), h);
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Line
        this.ctx.strokeStyle = '#4d90fe';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.history.forEach((usage, i) => {
            const x = (w / this.maxHistory) * i;
            const y = h - (usage / 100) * h;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();
    },

    destroy() {
        if (this.interval) clearInterval(this.interval);
        this.history = [];
    }
};

// Memory Monitor Widget
window.DevMeWidgets['memory-monitor'] = {
    id: 'memory-monitor',
    name: 'Memory Monitor',
    description: 'Real-time memory usage monitoring',
    requires: [],

    interval: null,

    render() {
        return `
            <div class="box resource-widget" data-widget="memory-monitor">
                <div class="section-title">
                    <span>Memory Usage</span>
                    <span class="resource-value" id="mem-current">--%</span>
                </div>
                <div class="memory-bar-container">
                    <div class="memory-bar">
                        <div class="memory-bar-fill" id="mem-bar"></div>
                    </div>
                </div>
                <div class="resource-details">
                    <div class="resource-detail">
                        <span class="detail-label">Used</span>
                        <span class="detail-value" id="mem-used">-- GB</span>
                    </div>
                    <div class="resource-detail">
                        <span class="detail-label">Total</span>
                        <span class="detail-value" id="mem-total">-- GB</span>
                    </div>
                </div>
            </div>
        `;
    },

    async init(container, config) {
        if (typeof chrome !== 'undefined' && chrome.system?.memory) {
            await this.updateMemory();
            this.interval = setInterval(() => this.updateMemory(), 2000);
        } else {
            this.simulateData();
            this.interval = setInterval(() => this.simulateData(), 2000);
        }
    },

    async updateMemory() {
        try {
            const info = await new Promise(resolve => {
                chrome.system.memory.getInfo(resolve);
            });

            const totalGB = info.capacity / (1024 ** 3);
            const availableGB = info.availableCapacity / (1024 ** 3);
            const usedGB = totalGB - availableGB;
            const percent = Math.round((usedGB / totalGB) * 100);

            document.getElementById('mem-current').textContent = `${percent}%`;
            document.getElementById('mem-used').textContent = `${usedGB.toFixed(1)} GB`;
            document.getElementById('mem-total').textContent = `${totalGB.toFixed(1)} GB`;
            document.getElementById('mem-bar').style.width = `${percent}%`;

            // Color based on usage
            const bar = document.getElementById('mem-bar');
            if (percent > 90) bar.style.background = '#F63636';
            else if (percent > 70) bar.style.background = '#FFB713';
            else bar.style.background = '#1DB5B5';
        } catch (error) {
            console.warn('Memory info unavailable:', error);
        }
    },

    simulateData() {
        const totalGB = 16;
        const usedGB = 6 + Math.random() * 6;
        const percent = Math.round((usedGB / totalGB) * 100);

        document.getElementById('mem-current').textContent = `${percent}%`;
        document.getElementById('mem-used').textContent = `${usedGB.toFixed(1)} GB`;
        document.getElementById('mem-total').textContent = `${totalGB.toFixed(1)} GB`;
        document.getElementById('mem-bar').style.width = `${percent}%`;

        const bar = document.getElementById('mem-bar');
        if (percent > 90) bar.style.background = '#F63636';
        else if (percent > 70) bar.style.background = '#FFB713';
        else bar.style.background = '#1DB5B5';
    },

    destroy() {
        if (this.interval) clearInterval(this.interval);
    }
};

// Network Monitor Widget
window.DevMeWidgets['network-monitor'] = {
    id: 'network-monitor',
    name: 'Network Monitor',
    description: 'Network connection status',
    requires: [],

    interval: null,

    render() {
        return `
            <div class="box resource-widget" data-widget="network-monitor">
                <div class="section-title">
                    <span>Network</span>
                    <span class="resource-value" id="net-status">--</span>
                </div>
                <div class="resource-details network-stats">
                    <div class="resource-detail">
                        <span class="detail-label">Type</span>
                        <span class="detail-value" id="net-type">--</span>
                    </div>
                    <div class="resource-detail">
                        <span class="detail-label">Downlink</span>
                        <span class="detail-value" id="net-downlink">-- Mbps</span>
                    </div>
                    <div class="resource-detail">
                        <span class="detail-label">RTT</span>
                        <span class="detail-value" id="net-rtt">-- ms</span>
                    </div>
                    <div class="resource-detail">
                        <span class="detail-label">Save Data</span>
                        <span class="detail-value" id="net-savedata">--</span>
                    </div>
                </div>
            </div>
        `;
    },

    async init(container, config) {
        this.updateNetwork();
        this.interval = setInterval(() => this.updateNetwork(), 5000);

        // Listen for connection changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => this.updateNetwork());
        }
    },

    updateNetwork() {
        const online = navigator.onLine;
        document.getElementById('net-status').textContent = online ? 'Online' : 'Offline';
        document.getElementById('net-status').style.color = online ? '#1DB5B5' : '#F63636';

        if (navigator.connection) {
            const conn = navigator.connection;
            document.getElementById('net-type').textContent = conn.effectiveType?.toUpperCase() || '--';
            document.getElementById('net-downlink').textContent = conn.downlink ? `${conn.downlink} Mbps` : '--';
            document.getElementById('net-rtt').textContent = conn.rtt ? `${conn.rtt} ms` : '--';
            document.getElementById('net-savedata').textContent = conn.saveData ? 'Yes' : 'No';
        }
    },

    destroy() {
        if (this.interval) clearInterval(this.interval);
    }
};

// Tab Manager Widget
window.DevMeWidgets['tab-manager'] = {
    id: 'tab-manager',
    name: 'Tab Manager',
    description: 'Browser tabs overview',
    requires: [],

    render() {
        return `
            <div class="box resource-widget" data-widget="tab-manager">
                <div class="section-title">
                    <span>Browser Tabs</span>
                </div>
                <div class="tab-stats">
                    <div class="tab-stat-large">
                        <span class="stat-number" id="tab-count">--</span>
                        <span class="stat-label">Open Tabs</span>
                    </div>
                    <div class="tab-stat-large">
                        <span class="stat-number" id="window-count">--</span>
                        <span class="stat-label">Windows</span>
                    </div>
                </div>
                <div class="tab-breakdown" id="tab-breakdown"></div>
            </div>
        `;
    },

    async init(container, config) {
        await this.updateTabs();

        // Listen for tab changes
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.onCreated.addListener(() => this.updateTabs());
            chrome.tabs.onRemoved.addListener(() => this.updateTabs());
            chrome.tabs.onUpdated.addListener(() => this.updateTabs());
        }
    },

    async updateTabs() {
        try {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                const tabs = await chrome.tabs.query({});
                const windows = await chrome.windows.getAll();

                document.getElementById('tab-count').textContent = tabs.length;
                document.getElementById('window-count').textContent = windows.length;

                // Group by domain
                const domains = {};
                tabs.forEach(tab => {
                    try {
                        const url = new URL(tab.url || '');
                        const domain = url.hostname || 'Other';
                        domains[domain] = (domains[domain] || 0) + 1;
                    } catch {
                        domains['Other'] = (domains['Other'] || 0) + 1;
                    }
                });

                // Show top 3 domains
                const topDomains = Object.entries(domains)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);

                const breakdown = document.getElementById('tab-breakdown');
                if (breakdown) {
                    breakdown.innerHTML = topDomains.map(([domain, count]) => `
                        <div class="domain-row">
                            <span class="domain-name">${domain}</span>
                            <span class="domain-count">${count}</span>
                        </div>
                    `).join('');
                }
            } else {
                // Demo data
                document.getElementById('tab-count').textContent = '12';
                document.getElementById('window-count').textContent = '2';
            }
        } catch (error) {
            console.warn('Tab info unavailable:', error);
        }
    },

    destroy() {}
};

// Extension Manager Widget
window.DevMeWidgets['extension-manager'] = {
    id: 'extension-manager',
    name: 'Extensions',
    description: 'Installed extensions overview',
    requires: [],

    render() {
        return `
            <div class="box resource-widget" data-widget="extension-manager">
                <div class="section-title">
                    <span>Extensions</span>
                </div>
                <div class="extension-stats">
                    <div class="tab-stat-large">
                        <span class="stat-number" id="ext-enabled">--</span>
                        <span class="stat-label">Enabled</span>
                    </div>
                    <div class="tab-stat-large">
                        <span class="stat-number" id="ext-total">--</span>
                        <span class="stat-label">Total</span>
                    </div>
                </div>
                <div class="extension-list" id="extension-list"></div>
            </div>
        `;
    },

    async init(container, config) {
        await this.updateExtensions();
    },

    async updateExtensions() {
        try {
            if (typeof chrome !== 'undefined' && chrome.management) {
                const extensions = await chrome.management.getAll();

                const enabled = extensions.filter(e => e.enabled && e.type === 'extension');
                const total = extensions.filter(e => e.type === 'extension');

                document.getElementById('ext-enabled').textContent = enabled.length;
                document.getElementById('ext-total').textContent = total.length;

                // Show top extensions
                const list = document.getElementById('extension-list');
                if (list) {
                    list.innerHTML = enabled.slice(0, 4).map(ext => `
                        <div class="ext-row">
                            <span class="ext-name">${ext.shortName || ext.name}</span>
                        </div>
                    `).join('');
                }
            } else {
                document.getElementById('ext-enabled').textContent = '5';
                document.getElementById('ext-total').textContent = '8';
            }
        } catch (error) {
            console.warn('Extension info unavailable:', error);
        }
    },

    destroy() {}
};
