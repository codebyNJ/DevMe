<div align="center">
  <img src="logo.png" alt="DevMe Logo" width="200"/>
  <p>A customizable new tab dashboard for Chrome</p>
</div>

## What is DevMe?

DevMe replaces your Chrome new tab page with a personal dashboard. It shows your profile, quick-access links, weather, system metrics, and more -- all in a single non-scrollable screen.

## Install

1. Download or clone this repo
   ```bash
   git clone https://github.com/yourusername/DevMe.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Turn on **Developer mode** (top-right toggle)

4. Click **Load unpacked** and select the `DevMe` folder

5. Open a new tab -- DevMe is now your new tab page

## Setup

All settings are configured from the dashboard itself. Click the **gear icon** (top-right) to open Settings, where you can:

- Upload a profile picture
- Set your name, title, and location (for weather)
- Add GitHub and LinkedIn links
- Switch between themes

Changes save automatically to Chrome storage.

## Themes

DevMe supports multiple themes. The active theme can be changed from Settings. Each theme lives in `src/themes/` and includes its own HTML, CSS, and JS.

## Troubleshooting

- **Weather not showing**: Open Settings and enter your city name in the Location field
- **Profile picture blurry**: Re-upload the image -- it will save at higher resolution
- **Changes not appearing**: Reload the extension from `chrome://extensions/`

## License

MIT License
