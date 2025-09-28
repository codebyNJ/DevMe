<div align="center">
  <img src="logo.png" alt="DevMe Logo" width="200"/>
  <p>A professional developer dashboard for Chrome</p>
</div>


## Features

- **GitHub Integration**: View repository statistics, stars, forks, and activity graph
- **LeetCode Stats**: Track problem-solving progress and achievements
- **Task Management**: Built-in todo list with local storage
- **Quick Links**: Easy access to professional profiles and resources
- **Responsive Design**: Optimized for all screen sizes
- **Customizable**: Personalize with your information and preferences

## Configuration

### Required Configuration

Edit the `config.js` file to set up your personal information:

```javascript
window.userConfig = {
    // GitHub Configuration (required)
    githubUsername: 'your-github-username',
    
    // LinkedIn Configuration (required)
    linkedinUrl: 'https://www.linkedin.com/in/your-profile',
    
    // LeetCode Configuration (required)
    leetcodeUsername: 'your-leetcode-username',
    
    // Profile Images
    bannerImage: 'path/to/your/banner.jpg',
    avatarImage: 'path/to/your/profile.jpg',
    
    // Personal Information
    name: 'Your Name',
    title: 'Your Professional Title',
    location: 'Your Location',
    
    // Social Links (optional)
    twitterUrl: 'https://twitter.com/your-handle',
    instagramUrl: 'https://instagram.com/your-handle',
    websiteUrl: 'https://your-website.com',
    
    // Custom Quote (optional)
    quote: 'Your motivational quote here',
    
    // Theme Settings (optional)
    theme: {
        primaryColor: '#4d90fe',
        secondaryColor: '#1a1a1a',
        accentColor: '#ffffff'
    }
};
```

### Image Requirements

- **Banner Image**: Recommended size 1200x300px (will be cropped to fit)
- **Profile Picture**: Recommended size 200x200px (displayed as 80x80px circle)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dev-chrome-extension.git
   cd dev-chrome-extension
   ```

2. **Customize the configuration**
   - Edit `config.js` with your personal information
   - Replace placeholder images in the `images` directory

3. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked" and select the extension directory

4. **Set as default new tab page**
   - Right-click the new tab button and select "Manage extensions"
   - Find the extension and click "Details"
   - Enable "Allow in incognito" if desired

## Usage

- The dashboard loads automatically when opening a new tab
- Stats are refreshed every 5 minutes
- Todos and notes are saved automatically
- Click profile links to quickly access your professional networks

## Manual Configuration Reset

To reset your configuration:
1. Open browser developer tools (F12)
2. Navigate to the Console tab
3. Run: `chrome.storage.local.clear()`
4. Refresh the page to see the setup prompt

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Storage**: Utilizes Chrome's local storage API
- **APIs Used**:
  - GitHub API (public endpoints)
  - LeetCode Stats API
  - Codeforces API (if enabled)
- **Dependencies**: None (vanilla JavaScript)

## Customization

The dashboard features a clean, professional design with:
- Responsive layout that adapts to different screen sizes
- Custom color scheme through theme variables
- Smooth animations and transitions
- Minimalist interface focused on productivity

## Support

For issues or feature requests, please open an issue in the repository.

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

MIT License - feel free to use and modify as needed.

## Privacy

- All data is stored locally on your device
- No personal information is sent to external servers (except for API calls to fetch public stats)
- Your notes and todos remain private

## Troubleshooting

- **Stats not loading**: Check your internet connection and verify usernames/handles
- **Icons not showing**: Make sure you've created the PNG icon files in the `icons/` folder
- **Data not saving**: Ensure the extension has storage permissions
