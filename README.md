<div align="center">
  <img src="logo.png" alt="DevMe Logo" width="200"/>
  <p>A professional developer dashboard for Chrome</p>
</div>

## About

DevMe is a Chrome extension that provides developers with a personalized dashboard featuring GitHub stats, LeetCode progress, task management, and quick access to professional resources.

## Installation

### Prerequisites
- Google Chrome browser
- Git (for cloning the repository)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/DevMe.git
   cd DevMe
   ```

2. **Configure your settings**
   - Edit `src/js/config.js` with your personal information
   - Add your profile images to `src/images/` directory
   - Customize theme colors if desired

3. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked" and select the `DevMe` directory

4. **Set as default new tab page**
   - Right-click the new tab button and select "Manage extensions"
   - Find the extension and click "Details"
   - Enable "Allow in incognito" if desired

## Configuration

Edit `src/js/config.js` to customize your dashboard:

```javascript
window.userConfig = {
    // Required
    githubUsername: 'your-github-username',
    linkedinUrl: 'https://www.linkedin.com/in/your-profile',
    leetcodeUsername: 'your-leetcode-username',
    
    // Profile Images
    bannerImage: 'images/banners/mountain-sunset.png',
    avatarImage: 'images/avatars/sample.jpg',
    
    // Personal Information
    name: 'Your Name',
    title: 'Your Professional Title',
    location: 'Your Location',
    
    // Social Links (optional)
    twitterUrl: 'https://twitter.com/your-handle',
    websiteUrl: 'https://your-website.com',
    
    // Theme Settings (optional)
    theme: {
        primaryColor: '#4d90fe',
        secondaryColor: '#1a1a1a',
        accentColor: '#ffffff'
    }
};
```

### Image Requirements
- **Banner Image**: Recommended size 1200x300px
- **Profile Picture**: Recommended size 200x200px (displayed as 80x80px circle)

## Troubleshooting

- **Images not loading**: Verify file paths in `config.js` and ensure images exist
- **Stats not showing**: Check your usernames and internet connection
- **Changes not appearing**: Reload the Chrome extension after editing config.js

## License

MIT License - feel free to use and modify as needed.
