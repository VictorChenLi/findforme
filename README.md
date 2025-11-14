# Promo Code Finder - Chrome Extension

A powerful Chrome extension that finds active promotional codes for any e-commerce website you're visiting using AI-powered web search.

## 🏗️ Architecture

This project consists of two main components:

1. **Chrome Extension (Frontend)**: A lightweight browser extension that captures the current website's domain
2. **Node.js Backend Server**: A secure proxy server that communicates with the OpenAI API

```
User Browser (Extension) → Backend Server (Node.js) → OpenAI API (with web_search)
```

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **OpenAI API Key**: You need an OpenAI API key with access to GPT-4 and web search capabilities
- **Chrome Browser**: For installing and testing the extension
- **Hosting Service** (for production): Render.com, Railway, Heroku, etc.

## 🚀 Setup Instructions

### Step 1: Backend Server Setup

#### 1.1 Install Dependencies

```bash
cd backend-server
npm install
```

#### 1.2 Configure Environment Variables

Create a `.env` file in the `backend-server` directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
PORT=3000
```

#### 1.3 Test Locally (Optional)

```bash
npm start
```

The server should start on `http://localhost:3000`. You can test it by visiting:
- `http://localhost:3000/health` - Should return server status

#### 1.4 Deploy to Production

**Option A: Deploy to Render.com (Recommended)**

1. Create a free account at [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `promo-code-finder` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `cd backend-server && npm install`
   - **Start Command**: `cd backend-server && npm start`
   - **Environment Variables**: Add `OPENAI_API_KEY` with your key
5. Click "Create Web Service"
6. Wait for deployment (you'll get a URL like: `https://promo-code-finder.onrender.com`)

**Option B: Deploy to Railway**

1. Create account at [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variable: `OPENAI_API_KEY`
5. Railway will auto-detect Node.js and deploy
6. Note your deployment URL

**Option C: Other Hosting Services**

You can deploy to any Node.js hosting service (Heroku, Vercel, AWS, etc.). Just make sure to:
- Set the `OPENAI_API_KEY` environment variable
- Ensure the `/find-codes` endpoint is accessible

### Step 2: Chrome Extension Setup

#### 2.1 Update Configuration with Backend URL

After deploying your backend, you'll have a URL (e.g., `https://promo-code-finder.onrender.com`).

**Update `chrome-extension/manifest.json`:**

```json
"host_permissions": [
  "https://promo-code-finder.onrender.com/*"
]
```

**Update `chrome-extension/popup.js`:**

```javascript
const BACKEND_URL = 'https://promo-code-finder.onrender.com/find-codes';
```

#### 2.2 Add Extension Icons (Optional but Recommended)

Create simple icon files or use placeholder images:
- `chrome-extension/icon16.png` (16x16 pixels)
- `chrome-extension/icon48.png` (48x48 pixels)
- `chrome-extension/icon128.png` (128x128 pixels)

You can use free tools like [Canva](https://canva.com) or [Figma](https://figma.com) to create these, or use emoji-based icons from services like [icon.kitchen](https://icon.kitchen).

#### 2.3 Load Extension into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The extension should now appear in your extensions list

#### 2.4 Get Your Extension ID

After loading the extension:
1. Look at the extension card in `chrome://extensions/`
2. You'll see an ID like: `omkcnllgacepghpldaaahjocbifmfago`
3. Copy this ID

#### 2.5 Update Backend with Extension ID

**Update `backend-server/server.js`:**

Find this section:

```javascript
const allowedOrigins = [
  'chrome-extension://YOUR_EXTENSION_ID_GOES_HERE',
];
```

Replace with your actual extension ID:

```javascript
const allowedOrigins = [
  'chrome-extension://omkcnllgacepghpldaaahjocbifmfago', // Your actual ID
];
```

#### 2.6 Redeploy Backend

After updating the extension ID, redeploy your backend server so the CORS configuration takes effect.

**For Render.com:**
- Go to your service dashboard
- Click "Manual Deploy" → "Deploy latest commit"

**For Railway:**
- Simply push your changes to GitHub; Railway will auto-deploy

### Step 3: Test the Extension

1. Visit any e-commerce website (e.g., `nike.com`, `amazon.com`)
2. Click the extension icon in your Chrome toolbar
3. Click "Find Promo Codes"
4. Wait for the AI to search and return results
5. Copy any codes you want to use!

## 🔧 Development

### Running Backend Locally

```bash
cd backend-server
npm run dev  # Uses nodemon for auto-restart
```

### Testing the Backend API

```bash
# Health check
curl http://localhost:3000/health

# Find codes (replace domain)
curl -X POST http://localhost:3000/find-codes \
  -H "Content-Type: application/json" \
  -d '{"domain":"nike.com"}'
```

### Debugging the Extension

1. Right-click the extension icon → "Inspect popup"
2. This opens Chrome DevTools for the extension
3. Check Console for any errors
4. Check Network tab to see API requests

## 🔒 Security Features

This implementation includes multiple security layers:

1. **API Key Protection**: OpenAI API key is stored only on the backend server, never in the extension
2. **CORS Whitelist**: Backend only accepts requests from your specific Chrome extension ID
3. **Host Permissions**: Extension can only communicate with your specific backend URL
4. **Minimal Permissions**: Extension only requests `activeTab` permission (no persistent access)

## 📁 Project Structure

```
findforme/
├── chrome-extension/
│   ├── manifest.json       # Extension configuration
│   ├── popup.html          # Extension UI
│   ├── popup.js           # Extension logic
│   ├── icon16.png         # Extension icon (16x16)
│   ├── icon48.png         # Extension icon (48x48)
│   └── icon128.png        # Extension icon (128x128)
│
├── backend-server/
│   ├── server.js          # Express server with OpenAI integration
│   ├── package.json       # Node.js dependencies
│   ├── .env              # Environment variables (create this)
│   ├── .env.example      # Environment template
│   └── .gitignore        # Git ignore rules
│
├── systemdesign.md       # Detailed system design document
└── README.md            # This file
```

## 🎯 How It Works

1. **User Action**: User visits a website and clicks the extension
2. **Domain Extraction**: Extension captures the current domain (e.g., `nike.com`)
3. **API Request**: Extension sends domain to your backend server
4. **AI Search**: Backend instructs OpenAI to search the web for promo codes
5. **Code Verification**: AI prioritizes recent codes from forums (especially Reddit)
6. **Response**: Backend returns structured JSON with codes
7. **Display**: Extension shows codes with copy buttons

## 🐛 Troubleshooting

### Extension Issues

**"Could not establish connection" error:**
- Check that backend URL in `popup.js` matches your deployed URL
- Verify `host_permissions` in `manifest.json` includes your backend URL
- Make sure backend is running and accessible

**CORS errors:**
- Verify extension ID in backend's `allowedOrigins` matches your actual extension ID
- Redeploy backend after updating the extension ID

**No codes found:**
- This is normal for some websites (AI couldn't find valid codes)
- Try more popular e-commerce sites

### Backend Issues

**"API key not configured" error:**
- Check that `.env` file exists in `backend-server/`
- Verify `OPENAI_API_KEY` is set correctly
- For hosted services, check environment variables in dashboard

**OpenAI API errors:**
- Verify your OpenAI API key is valid and has credits
- Check that your key has access to GPT-4 and web search
- Review OpenAI API status page for outages

## 💰 Cost Considerations

- **OpenAI API**: Charges per API call (varies by model and tokens used)
- **Backend Hosting**: 
  - Render.com: Free tier available (may sleep after inactivity)
  - Railway: $5/month credit included
  - Can use any hosting service that supports Node.js

## 📝 License

MIT License - Feel free to modify and use for your own projects!

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your needs!

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Chrome extension console for errors
3. Check backend server logs
4. Verify all configuration steps were followed

---

**Happy code hunting! 🎉**

