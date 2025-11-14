# Setup Checklist ✅

Follow this checklist to get your Promo Code Finder extension up and running.

## Prerequisites
- [ ] Node.js v18+ installed
- [ ] OpenAI API key obtained (from platform.openai.com)
- [ ] Chrome browser installed
- [ ] Git repository created (optional, for deployment)

---

## Part 1: Backend Setup

### Local Testing (Optional)
- [ ] Navigate to `backend-server/` folder
- [ ] Run `npm install`
- [ ] Create `.env` file with your OpenAI API key
- [ ] Run `npm start` to test locally
- [ ] Test health endpoint: `http://localhost:3000/health`

### Deploy to Production
- [ ] Choose hosting service (Render.com, Railway, etc.)
- [ ] Push code to GitHub (if required by hosting)
- [ ] Create new web service on hosting platform
- [ ] Set environment variable: `OPENAI_API_KEY`
- [ ] Configure build/start commands (if needed)
- [ ] Deploy and wait for completion
- [ ] **Save your backend URL** (e.g., `https://promo-code-finder.onrender.com`)

---

## Part 2: Extension Setup

### Configure Extension
- [ ] Open `chrome-extension/manifest.json`
- [ ] Replace `YOUR_BACKEND_SERVER_URL_GOES_HERE` with your actual backend URL
- [ ] Open `chrome-extension/popup.js`
- [ ] Replace `YOUR_BACKEND_SERVER_URL_GOES_HERE` with your actual backend URL (including `/find-codes`)

### Add Icons (Recommended)
- [ ] Create or download three icon files:
  - `icon16.png` (16x16 pixels)
  - `icon48.png` (48x48 pixels)
  - `icon128.png` (128x128 pixels)
- [ ] Place them in the `chrome-extension/` folder
- [ ] (Or skip this step and use Chrome's default placeholder)

### Load Extension
- [ ] Open Chrome and go to `chrome://extensions/`
- [ ] Enable "Developer mode" (toggle in top-right)
- [ ] Click "Load unpacked"
- [ ] Select the `chrome-extension/` folder
- [ ] Extension should now appear in your toolbar

### Get Extension ID
- [ ] Look at the extension in `chrome://extensions/`
- [ ] Find the ID (e.g., `omkcnllgacepghpldaaahjocbifmfago`)
- [ ] **Copy this ID**

---

## Part 3: Secure Backend

### Update CORS Configuration
- [ ] Open `backend-server/server.js`
- [ ] Find the `allowedOrigins` array
- [ ] Replace `YOUR_EXTENSION_ID_GOES_HERE` with your actual extension ID
- [ ] Example: `'chrome-extension://omkcnllgacepghpldaaahjocbifmfago'`
- [ ] Save the file

### Redeploy Backend
- [ ] Push changes to Git (if using Git-based deployment)
- [ ] Or manually redeploy on your hosting platform
- [ ] Wait for deployment to complete
- [ ] Verify deployment succeeded

---

## Part 4: Test Everything

### Test the Extension
- [ ] Visit an e-commerce site (e.g., nike.com, amazon.com)
- [ ] Click the extension icon in Chrome toolbar
- [ ] Click "Find Promo Codes" button
- [ ] Wait for the AI to search (may take 10-30 seconds)
- [ ] Verify codes are displayed (or "no codes found" message)
- [ ] Try the "Copy" button on a code
- [ ] Test on multiple websites

### Common Test Sites
- [ ] nike.com
- [ ] adidas.com
- [ ] target.com
- [ ] bestbuy.com
- [ ] udemy.com

---

## Troubleshooting

### If Extension Doesn't Load
- ✅ Check all required files exist in `chrome-extension/`
- ✅ Verify `manifest.json` is valid JSON (no syntax errors)
- ✅ Try disabling and re-enabling "Developer mode"

### If "Could not establish connection"
- ✅ Verify backend URL in `popup.js` is correct
- ✅ Check backend URL in `manifest.json` matches
- ✅ Ensure backend is actually running (visit health endpoint)
- ✅ Check `host_permissions` includes your backend domain

### If CORS Errors
- ✅ Make sure extension ID in `server.js` is correct
- ✅ Verify you redeployed backend after updating ID
- ✅ Check Chrome DevTools console for exact error
- ✅ Try reloading the extension in `chrome://extensions/`

### If "No codes found"
- ✅ This is normal for some sites (AI couldn't find valid codes)
- ✅ Try more popular e-commerce websites
- ✅ Check backend logs for API errors
- ✅ Verify OpenAI API key has credits

### If OpenAI API Errors
- ✅ Check API key is valid on platform.openai.com
- ✅ Verify you have available credits
- ✅ Ensure key has access to GPT-4 and web search
- ✅ Check OpenAI status page for outages

---

## Final Configuration Summary

Once complete, you should have:

**Backend:**
- ✅ Deployed to: `_______________________________`
- ✅ Environment variable `OPENAI_API_KEY` set
- ✅ Extension ID configured in `allowedOrigins`

**Extension:**
- ✅ Backend URL configured in `manifest.json` and `popup.js`
- ✅ Loaded into Chrome from `chrome-extension/` folder
- ✅ Extension ID: `_______________________________`

---

## 🎉 Success!

If all checks are complete, you should now be able to:
1. Visit any e-commerce website
2. Click your extension
3. Get AI-powered promo codes
4. Copy and use them!

**Next Steps:**
- Test on various websites
- Monitor OpenAI usage costs
- Consider publishing to Chrome Web Store (optional)
- Share with friends!

---

**Questions or Issues?**
- Check the main README.md for detailed documentation
- Review backend logs for errors
- Check Chrome DevTools console (right-click extension → Inspect popup)

