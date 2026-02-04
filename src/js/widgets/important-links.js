// Widget: Important Links
// Shows user's important profile links with copy functionality

window.DevMeWidgets = window.DevMeWidgets || {};

window.DevMeWidgets['important-links'] = {
    id: 'important-links',
    name: 'Important Links',
    description: 'Quick access to your profile links',
    requires: [],

    render(config) {
        const profile = config?.profile || {};
        const githubUrl = profile.githubUsername
            ? `https://github.com/${profile.githubUsername}`
            : '#';
        const linkedinUrl = profile.linkedinUrl || '#';

        return `
            <div class="box" data-widget="important-links">
                <div class="section-title">Important Links</div>
                <div class="links-container">
                    <div class="link-item" data-url="${linkedinUrl}">
                        <span class="link-text">LinkedIn Profile</span>
                        <button class="copy-btn" title="Copy link">Copy</button>
                    </div>
                    <div class="link-item" data-url="${githubUrl}">
                        <span class="link-text">GitHub Profile</span>
                        <button class="copy-btn" title="Copy link">Copy</button>
                    </div>
                </div>
            </div>
        `;
    },

    init(container) {
        this.setupEventListeners(container);
    },

    setupEventListeners(container) {
        // Copy button click
        container.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const linkItem = e.target.closest('.link-item');
                const url = linkItem?.dataset.url;

                if (url && url !== '#') {
                    const success = await this.copyToClipboard(url);
                    if (success) {
                        const originalText = e.target.textContent;
                        e.target.textContent = '\u2713';
                        e.target.classList.add('copied');

                        this.showNotification('Link copied to clipboard!');

                        setTimeout(() => {
                            e.target.textContent = originalText;
                            e.target.classList.remove('copied');
                        }, 2000);
                    }
                }
            });
        });

        // Link item click (open in new tab)
        container.querySelectorAll('.link-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('copy-btn')) {
                    const url = item.dataset.url;
                    if (url && url !== '#') {
                        window.open(url, '_blank');
                    }
                }
            });
        });
    },

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            return this.fallbackCopy(text);
        } catch (err) {
            return this.fallbackCopy(text);
        }
    },

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        } catch (err) {
            document.body.removeChild(textarea);
            return false;
        }
    },

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
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
            background-color: #28a745;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },

    destroy() {
        // No cleanup needed
    }
};
