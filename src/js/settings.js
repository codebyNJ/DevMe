// Settings Module
document.addEventListener('DOMContentLoaded', function() {
    // Get the modal elements
    const modal = document.getElementById('settingsModal');
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.querySelector('.close');
    const cancelButton = document.getElementById('cancelSettings');
    const saveButton = document.getElementById('saveSettings');
    const settingsForm = document.getElementById('settingsForm');

    // Load current settings into the form
    function loadSettings() {
        // Helper to set value if element exists
        const setValueIfExists = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value ?? '';
        };

        // Personal Information
        setValueIfExists('name', window.userConfig.name);
        setValueIfExists('title', window.userConfig.title);
        setValueIfExists('location', window.userConfig.location);
        
        // Social Links
        setValueIfExists('githubUsername', window.userConfig.githubUsername);
        setValueIfExists('linkedinUrl', window.userConfig.linkedinUrl);
        setValueIfExists('leetcodeUsername', window.userConfig.leetcodeUsername);
        setValueIfExists('twitterUrl', window.userConfig.twitterUrl);
        setValueIfExists('instagramUrl', window.userConfig.instagramUrl);
        setValueIfExists('websiteUrl', window.userConfig.websiteUrl);
        
        // Appearance (optional fields)
        setValueIfExists('customQuote', window.userConfig.customQuote);
        setValueIfExists('primaryColor', window.userConfig.theme?.primaryColor || '#4d90fe');
        setValueIfExists('secondaryColor', window.userConfig.theme?.secondaryColor || '#1a1a1a');
        setValueIfExists('accentColor', window.userConfig.theme?.accentColor || '#ffffff');
    }

    // Save settings from the form to config.js
    function saveSettings() {
        // Create a new config object with updated values
        const updatedConfig = {
            ...window.userConfig,
            name: document.getElementById('name')?.value ?? window.userConfig.name,
            title: document.getElementById('title')?.value ?? window.userConfig.title,
            location: document.getElementById('location')?.value ?? window.userConfig.location,
            githubUsername: document.getElementById('githubUsername')?.value ?? window.userConfig.githubUsername,
            linkedinUrl: document.getElementById('linkedinUrl')?.value ?? window.userConfig.linkedinUrl,
            leetcodeUsername: document.getElementById('leetcodeUsername')?.value ?? window.userConfig.leetcodeUsername,
            twitterUrl: document.getElementById('twitterUrl')?.value ?? window.userConfig.twitterUrl,
            instagramUrl: document.getElementById('instagramUrl')?.value ?? window.userConfig.instagramUrl,
            websiteUrl: document.getElementById('websiteUrl')?.value ?? window.userConfig.websiteUrl,
            customQuote: document.getElementById('customQuote')?.value ?? window.userConfig.customQuote,
            theme: {
                primaryColor: document.getElementById('primaryColor')?.value ?? window.userConfig.theme?.primaryColor ?? '#4d90fe',
                secondaryColor: document.getElementById('secondaryColor')?.value ?? window.userConfig.theme?.secondaryColor ?? '#1a1a1a',
                accentColor: document.getElementById('accentColor')?.value ?? window.userConfig.theme?.accentColor ?? '#ffffff'
            }
        };

        // Update the global config
        window.userConfig = updatedConfig;

        // Update the UI to reflect changes
        updateUIWithNewConfig(updatedConfig);

        // Save to localStorage for persistence
        localStorage.setItem('userConfig', JSON.stringify(updatedConfig));
    }

    // Update the UI with new config values
    function updateUIWithNewConfig(config) {
        // Update quote
        const quoteElement = document.querySelector('.quote');
        if (quoteElement) {
            quoteElement.textContent = config.customQuote;
        }

        // Update theme colors
        document.documentElement.style.setProperty('--primary-color', config.theme.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', config.theme.secondaryColor);
        document.documentElement.style.setProperty('--accent-color', config.theme.accentColor);

        // You can add more UI updates here as needed
    }

    // Load saved settings from localStorage if available
    function loadSavedSettings() {
        const savedConfig = localStorage.getItem('userConfig');
        if (savedConfig) {
            try {
                const parsedConfig = JSON.parse(savedConfig);
                window.userConfig = { ...window.userConfig, ...parsedConfig };
                updateUIWithNewConfig(window.userConfig);
            } catch (e) {
                console.error('Error loading saved settings:', e);
            }
        }
    }

    // Event Listeners
    settingsButton.addEventListener('click', function() {
        // Toggle behavior: if open, close; if closed, open and load
        const isOpen = modal.style.display === 'block';
        if (isOpen) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        } else {
            loadSettings();
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    });

    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    cancelButton.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    saveButton.addEventListener('click', function() {
        saveSettings();
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Close modal when clicking outside the content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Load saved settings when the page loads
    loadSavedSettings();
});
