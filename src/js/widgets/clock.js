// Widget: Clock
// Displays current date and time

window.DevMeWidgets = window.DevMeWidgets || {};

window.DevMeWidgets['clock'] = {
    id: 'clock',
    name: 'Clock',
    description: 'Shows current date and time',
    requires: [],

    intervalId: null,

    render() {
        return `
            <div class="datetime" data-widget="clock">
                <div class="date" id="date"></div>
                <div class="time" id="time"></div>
            </div>
        `;
    },

    init(container) {
        this.updateClock();
        this.intervalId = setInterval(() => this.updateClock(), 1000);
    },

    updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: true });
        const date = now.toLocaleDateString('en-GB'); // dd/mm/yyyy

        const timeElement = document.getElementById('time');
        const dateElement = document.getElementById('date');

        if (timeElement) timeElement.textContent = time;
        if (dateElement) dateElement.textContent = date;
    },

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
};
