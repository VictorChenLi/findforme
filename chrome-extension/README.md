# Chrome Extension Setup

## Quick Start

### 1. Create Extension Icons

You need three icon sizes. Here are some options:

**Option A: Use Icon Kitchen (Easiest)**
1. Visit https://icon.kitchen/
2. Choose the "🎉" emoji or upload a custom design
3. Select "Browser Extension" as the format
4. Download and extract the icons
5. Rename and place them in this folder:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

**Option B: Use Any Image Editor**
- Create three PNG files with the sizes above
- Use tools like Canva, Figma, or Photoshop
- Save them in this folder

**Option C: Skip Icons Temporarily**
- You can test without icons, but Chrome will show a placeholder
- Add them later before publishing

### 2. Update Configuration

Before loading the extension, you MUST update:

1. **manifest.json**: Replace `YOUR_BACKEND_SERVER_URL_GOES_HERE` with your actual backend URL
2. **popup.js**: Replace `YOUR_BACKEND_SERVER_URL_GOES_HERE` with your actual backend URL

Example:
```javascript
// Change this:
const BACKEND_URL = 'https://YOUR_BACKEND_SERVER_URL_GOES_HERE/find-codes';

// To this (with your actual URL):
const BACKEND_URL = 'https://promo-code-finder.onrender.com/find-codes';
```

### 3. Load into Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select this `chrome-extension` folder
5. Done! The extension will appear in your toolbar

### 4. Get Extension ID

After loading:
1. Look at the extension card in `chrome://extensions/`
2. Copy the ID (looks like: `omkcnllgacepghpldaaahjocbifmfago`)
3. Update your backend's `server.js` with this ID
4. Redeploy your backend

## Testing

1. Visit any e-commerce website (e.g., nike.com)
2. Click the extension icon
3. Click "Find Promo Codes"
4. Wait for results!

## Troubleshooting

**Extension won't load:**
- Check that all files are in this folder
- Make sure manifest.json is valid JSON

**"Could not establish connection":**
- Verify backend URL is correct in both files
- Make sure backend is deployed and running
- Check `host_permissions` in manifest.json

**CORS errors in console:**
- Update backend with your extension ID
- Redeploy backend after updating

## Files

- `manifest.json` - Extension configuration (manifest v3)
- `popup.html` - UI with modern, gradient design
- `popup.js` - Frontend logic and API communication
- `icon*.png` - Extension icons (you need to add these)

