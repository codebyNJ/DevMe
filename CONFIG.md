# Configuration Guide

This dashboard uses a simple configuration file system. All your personal information and settings are stored in `config.js`.

## How to Customize Your Dashboard

### 1. Edit the Configuration File

Open `config.js` in any text editor and modify the values:

```javascript
window.userConfig = {
    // GitHub Configuration
    githubUsername: 'your-github-username',
    
    // LinkedIn Configuration
    linkedinUrl: 'https://www.linkedin.com/in/your-profile',
    
    // LeetCode Configuration
    leetcodeUsername: 'your-leetcode-username',
    
    // Profile Images
    bannerImage: 'path/to/your/banner.jpg',
    avatarImage: 'path/to/your/profile.jpg',
    
    // Personal Information
    name: 'Your Name',
    title: 'Your Title',
    location: 'Your Location',
    
    // Social Links (optional)
    twitterUrl: 'https://twitter.com/your-handle',
    instagramUrl: 'https://instagram.com/your-handle',
    websiteUrl: 'https://your-website.com',
    
    // Custom Quote (optional)
    customQuote: '"Your custom quote here"',
    
    // Theme Settings (optional)
    theme: {
        primaryColor: '#4d90fe',
        secondaryColor: '#1a1a1a',
        accentColor: '#ffffff'
    }
};
```

### 2. Add Your Images

1. **Banner Image**: Replace `banner-image.png` with your own banner image
2. **Profile Picture**: Replace `sample.jpg` with your profile picture
3. Make sure the image files are in the same directory as `index.html`

### 3. Reload the Extension

After making changes to `config.js`:
1. Save the file
2. Reload the Chrome extension
3. Open a new tab to see your changes

## Configuration Options

### Required Fields
- `githubUsername`: Your GitHub username for stats and activity graph
- `linkedinUrl`: Your LinkedIn profile URL
- `leetcodeUsername`: Your LeetCode username for stats

### Optional Fields
- `bannerImage`: Path to your banner image
- `avatarImage`: Path to your profile picture
- `name`: Your display name
- `title`: Your professional title
- `location`: Your location
- `twitterUrl`: Your Twitter profile URL
- `instagramUrl`: Your Instagram profile URL
- `websiteUrl`: Your personal website URL
- `customQuote`: A custom quote to display
- `theme`: Color customization options

## Image Requirements

- **Banner Image**: Recommended size 1200x300px or similar aspect ratio
- **Profile Picture**: Recommended size 200x200px (will be displayed as 80x80px circle)

## Example Configuration

```javascript
window.userConfig = {
    githubUsername: 'johndoe',
    linkedinUrl: 'https://www.linkedin.com/in/johndoe',
    leetcodeUsername: 'johndoe123',
    bannerImage: 'my-banner.jpg',
    avatarImage: 'my-photo.jpg',
    name: 'John Doe',
    title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    twitterUrl: 'https://twitter.com/johndoe',
    websiteUrl: 'https://johndoe.dev',
    customQuote: '"Code is poetry written in logic"',
    theme: {
        primaryColor: '#ff6b6b',
        secondaryColor: '#2d3436',
        accentColor: '#fdcb6e'
    }
};
```

## Troubleshooting

- **Images not showing**: Check that the image files exist in the correct directory
- **Stats not loading**: Verify your usernames are correct
- **Changes not appearing**: Make sure to reload the Chrome extension after editing config.js

## Need Help?

If you encounter any issues, check the browser console (F12) for error messages.
