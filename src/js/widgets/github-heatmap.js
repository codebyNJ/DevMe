// Widget: GitHub Heatmap
// Displays GitHub activity graph

window.DevMeWidgets = window.DevMeWidgets || {};

window.DevMeWidgets['github-heatmap'] = {
    id: 'github-heatmap',
    name: 'GitHub Heatmap',
    description: 'Shows your GitHub activity graph',
    requires: ['githubUsername'],

    render() {
        return `
            <div class="box" data-widget="github-heatmap">
                <div class="section-title">GitHub Heatmap</div>
                <div id="github-heatmap" class="heatmap-container">
                    <div class="heatmap-placeholder">Loading activity graph...</div>
                </div>
            </div>
        `;
    },

    init(container, config) {
        const username = config?.profile?.githubUsername;
        if (username) {
            this.loadHeatmap(username);
        }
    },

    loadHeatmap(username) {
        const heatmapContainer = document.getElementById('github-heatmap');
        if (!heatmapContainer) return;

        heatmapContainer.innerHTML = `
            <img src="https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=github-dark&hide_border=true&area=true"
                 alt="GitHub Activity Graph"
                 style="width: 100%; height: auto; border-radius: 6px; max-height: 120px; object-fit: contain;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; padding: 10px; text-align: center; color: rgba(255, 255, 255, 0.6); font-style: italic; background: rgba(255, 255, 255, 0.05); border-radius: 4px; font-size: 0.7rem;">
                GitHub heatmap unavailable
            </div>
        `;
    },

    destroy() {
        // No cleanup needed
    }
};
