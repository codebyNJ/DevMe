# Contributing Themes to DevMe

Thank you for your interest in contributing a theme to DevMe! This guide will help you create and submit a new theme.

## Theme Structure

Each theme lives in its own folder under `src/themes/`. A complete theme consists of:

```
src/themes/your-theme-name/
├── theme.json        # Theme configuration (required)
├── template.html     # Dashboard HTML structure (required)
├── styles.css        # Theme-specific styles (required)
└── preview.png       # Preview image 400x250px (required)
```

## Step 1: Create Your Theme Folder

Create a new folder in `src/themes/` with your theme's ID (lowercase, no spaces):

```
src/themes/my-awesome-theme/
```

## Step 2: Create theme.json

This file defines your theme's metadata and configuration:

```json
{
  "id": "my-awesome-theme",
  "name": "My Awesome Theme",
  "version": "1.0.0",
  "description": "A brief description of your theme",
  "author": "Your Name",
  "template": "template.html",
  "styles": "styles.css",
  "widgets": {
    "supported": [
      "clock",
      "leetcode-stats",
      "github-stats",
      "github-heatmap",
      "todo-list",
      "important-links"
    ],
    "default": [
      "clock",
      "leetcode-stats",
      "github-stats",
      "github-heatmap",
      "todo-list"
    ],
    "positions": {
      "clock": "your-container-id",
      "leetcode-stats": "left-column",
      "github-stats": "left-column",
      "github-heatmap": "center-column",
      "important-links": "center-column",
      "todo-list": "right-column"
    }
  },
  "cssVariables": {
    "--bg-primary": "#000000",
    "--text-primary": "#ffffff",
    "--primary-color": "#4d90fe",
    "--secondary-color": "#1a1a1a",
    "--accent-color": "#ffffff"
  }
}
```

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (lowercase, hyphens only) |
| `name` | Yes | Display name shown to users |
| `version` | Yes | Semantic version (e.g., "1.0.0") |
| `description` | Yes | Brief description (max 100 chars) |
| `author` | Yes | Your name or GitHub username |
| `template` | Yes | Filename of the HTML template |
| `styles` | Yes | Filename of the CSS file |
| `widgets.supported` | Yes | Array of widgets this theme supports |
| `widgets.default` | Yes | Widgets enabled by default |
| `widgets.positions` | Yes | Maps widget IDs to container element IDs |
| `cssVariables` | No | CSS custom properties to override |

## Step 3: Create template.html

This is your theme's HTML structure. Widgets will be mounted into containers you define.

### Required Elements

Your template **must** include:

1. **Widget containers** - Elements with IDs matching your `widgets.positions` config
2. **Settings button** - Element with `id="settingsButton"` to open settings
3. **Settings modal** - The settings form (can copy from classic theme)

### Example Template

```html
<div class="my-theme-banner">
  <!-- Clock widget will be mounted here -->
  <div id="banner-clock"></div>

  <div class="quote">"Your default quote here"</div>

  <div class="profile-pic"></div>

  <div class="settings-icon" id="settingsButton" title="Settings">
    <img src="https://img.icons8.com/?size=25&id=364&format=png&color=ffffff" alt="Settings">
  </div>
</div>

<div class="my-theme-content">
  <div class="column" id="left-column">
    <!-- leetcode-stats and github-stats will be mounted here -->
  </div>

  <div class="column" id="center-column">
    <!-- github-heatmap and important-links will be mounted here -->
  </div>

  <div class="column" id="right-column">
    <!-- todo-list will be mounted here -->
  </div>
</div>

<!-- Include the settings modal (copy from classic theme) -->
<div id="settingsModal" class="modal">
  <!-- ... settings form ... -->
</div>
```

## Step 4: Create styles.css

Style your theme! You have full control over the appearance.

### Important Notes

- Use CSS custom properties from `cssVariables` for consistency
- Style the widget elements: `.box`, `.section-title`, `.stat-item`, etc.
- Style modal elements: `.modal`, `.modal-content`, `.form-group`
- Keep your CSS scoped to avoid conflicts

### Available Widget Classes

Widgets use these classes that you should style:

```css
/* Stats widgets */
.box { }
.section-title { }
.stats-container { }
.stat-item { }
.stat-label { }
.stat-value { }

/* Todo widget */
.todo-container { }
.todo-input-container { }
.todo-input { }
.add-todo-btn { }
.todo-list { }
.todo-item { }
.todo-checkbox { }
.todo-text { }
.delete-todo { }

/* Links widget */
.links-container { }
.link-item { }
.link-text { }
.copy-btn { }

/* Heatmap widget */
.heatmap-container { }

/* Clock widget */
.datetime { }
.date { }
.time { }
```

## Step 5: Create preview.png

Create a screenshot of your theme:

- **Size**: 400x250 pixels
- **Format**: PNG
- Show the dashboard with sample data
- Make it look polished!

## Step 6: Register Your Theme

Add your theme to `src/themes/registry.json`:

```json
{
  "version": "1.0",
  "themes": [
    {
      "id": "classic",
      "name": "Classic",
      "description": "The original DevMe experience",
      "author": "DevMe Team",
      "preview": "src/themes/classic/preview.png"
    },
    {
      "id": "my-awesome-theme",
      "name": "My Awesome Theme",
      "description": "A brief description",
      "author": "Your Name",
      "preview": "src/themes/my-awesome-theme/preview.png"
    }
  ]
}
```

## Step 7: Test Your Theme

1. Load the extension in Chrome (`chrome://extensions/`)
2. Enable Developer Mode
3. Click "Load unpacked" and select the DevMe folder
4. Open a new tab
5. Your theme should appear in the theme picker

### Testing Checklist

- [ ] Theme appears in theme picker
- [ ] Theme can be selected
- [ ] All widgets render correctly
- [ ] Clock updates every second
- [ ] Stats load from APIs
- [ ] Todo list works (add, complete, delete)
- [ ] Links open in new tab
- [ ] Copy buttons work
- [ ] Settings modal opens and saves
- [ ] Responsive on smaller screens

## Step 8: Submit a Pull Request

1. Fork the repository
2. Create a branch: `git checkout -b theme/my-awesome-theme`
3. Add your theme files
4. Commit: `git commit -m "Add my-awesome-theme"`
5. Push and open a PR

### PR Requirements

- [ ] All 4 theme files included
- [ ] theme.json is valid JSON
- [ ] Preview image is 400x250px
- [ ] Registry.json updated
- [ ] Tested locally
- [ ] No external dependencies added

## Available Widgets

| Widget ID | Description | Required Config |
|-----------|-------------|-----------------|
| `clock` | Date and time display | None |
| `leetcode-stats` | LeetCode problem stats | `leetcodeUsername` |
| `github-stats` | GitHub repo/star stats | `githubUsername` |
| `github-heatmap` | GitHub activity graph | `githubUsername` |
| `todo-list` | Task management | None |
| `important-links` | Profile links | Optional LinkedIn/GitHub |

## Tips for Great Themes

1. **Keep it lightweight** - Avoid heavy animations or large images
2. **Test on different screen sizes** - Use responsive design
3. **Follow accessibility guidelines** - Good contrast, readable fonts
4. **Be creative** - Unique layouts are welcome!
5. **Document special features** - Add comments in your code

## Need Help?

- Check the classic theme for reference
- Open an issue on GitHub
- Ask in discussions

Happy theming!
