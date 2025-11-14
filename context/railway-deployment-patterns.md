# Railway Deployment Patterns & Configuration

**Date Created:** November 14, 2025  
**Purpose:** Document Railway deployment patterns, troubleshooting strategies, and configuration approaches for Node.js backends in monorepo structures

---

## Railway Platform Overview

### Why Railway Over Alternatives

**Railway Selected For:**
- ✅ $5/month free credit (renews monthly, no credit card required)
- ✅ No auto-sleep/cold starts (unlike Render free tier)
- ✅ No timeout limits (unlike Vercel's 10s free tier limit)
- ✅ Works with existing Express.js code without restructuring
- ✅ Simple GitHub integration with auto-deploy

**Comparison with Alternatives:**

| Platform | Free Tier | Cold Start | Timeout | Code Changes | Credit Card |
|----------|-----------|------------|---------|--------------|-------------|
| **Railway** | $5 credit/month | None | None | None | No |
| **Render** | 750 hrs/month | 15 min sleep | 30s (Standard) | None | No |
| **Vercel** | 1M invocations | None | 10s (Free) | Serverless refactor | No |
| **App Engine** | 28 hrs/day | Minimal | 60s (Standard) | app.yaml needed | Yes |

---

## Monorepo Deployment Pattern

### Problem: Backend in Subdirectory

**Project Structure:**
```
findforme/
├── backend-server/          # Node.js Express app
│   ├── server.js
│   ├── package.json
│   └── .env
├── chrome-extension/        # Chrome extension files
└── context/                 # Documentation
```

**Challenge:**
- Railway by default builds from repository root
- Our `package.json` and `server.js` are in `backend-server/` subdirectory
- Initial deployment fails with `npm: command not found`

### Solution: Root Directory Configuration

**Method 1: Railway Dashboard (Recommended)**

Configure via UI:
1. Go to Railway project → Settings
2. Find "Root Directory" setting
3. Set value to: `backend-server`
4. Save and redeploy

**Why This Works:**
- Railway changes working directory before build
- Finds `package.json` in correct location
- Runs `npm install` and `npm start` in proper context

**Method 2: Railway Configuration File (Alternative)**

Create `railway.json` at repository root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Note:** Root Directory setting in dashboard takes precedence over this file.

---

## Deployment Validation Pattern

### Health Check Endpoint

**Implementation:**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-YOUR_...')
  });
});
```

**Validation Command:**
```bash
curl https://your-app.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T18:45:41.039Z",
  "apiKeyConfigured": true
}
```

**Health Check Logic:**
1. **Status Check:** Verifies server is responding
2. **Timestamp:** Confirms server is running (not cached)
3. **API Key Validation:** Ensures environment variable is set and not placeholder

---

## Environment Variable Management

### Railway Environment Variables

**Setting Variables:**
1. Railway Dashboard → Project → Variables tab
2. Add key-value pairs
3. Railway auto-redeploys on variable changes

**Best Practices:**
```javascript
// server.js - Environment variable with fallback
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-YOUR_OPENAI_API_KEY_HERE';

// Validation before use
if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-YOUR_OPENAI_API_KEY_HERE') {
  console.error('OpenAI API key is not configured');
  return res.status(500).json({
    error: 'Configuration error',
    message: 'API key is not properly configured'
  });
}
```

**Security Pattern:**
- ✅ Store sensitive keys in Railway environment variables
- ✅ Keep `.env` file in `.gitignore` (never commit)
- ✅ Use `.env` for local development only
- ✅ Validate environment variables at runtime

---

## Domain and URL Management

### Railway Domains

**Auto-Generated Domain:**
- Format: `{project-name}-production.up.railway.app`
- Example: `findforme-production.up.railway.app`
- Always HTTPS
- No configuration needed

**Generating Domain:**
1. Railway Dashboard → Settings → Networking
2. Click "Generate Domain"
3. Domain created instantly
4. Use this URL in client configuration

**Custom Domains (Optional):**
- Can add custom domain in Railway settings
- Requires DNS configuration
- Free tier supports custom domains

---

## Client-Server Configuration Pattern

### Two-Phase Configuration Update

**Phase 1: Deploy Backend**
1. Deploy to Railway
2. Get generated URL
3. Test health endpoint

**Phase 2: Update Client**
1. Update `manifest.json` with backend URL
2. Update `popup.js` with backend URL
3. Load extension to get extension ID

**Phase 3: Secure Backend**
1. Update `server.js` with extension ID
2. Commit and push changes
3. Railway auto-redeploys with CORS configured

### Extension Configuration Files

**File 1: `manifest.json`**
```json
{
  "host_permissions": [
    "https://findforme-production.up.railway.app/*"
  ]
}
```

**File 2: `popup.js`**
```javascript
const BACKEND_URL = 'https://findforme-production.up.railway.app/find-codes';
```

**Critical Pattern:**
- Both URLs must match exactly
- Must include protocol (https://)
- `manifest.json` needs wildcard (`/*`)
- `popup.js` needs full endpoint path

---

## Troubleshooting Patterns

### Issue 1: Build Fails with "npm: command not found"

**Error Message:**
```
/bin/bash: line 1: npm: command not found
"cd backend-server && npm install" did not complete successfully
```

**Root Cause:**
- Railway is running commands from repository root
- `backend-server/` directory doesn't exist at root
- npm is trying to run before changing directory

**Solution:**
- Set "Root Directory" to `backend-server` in Railway dashboard
- Railway will change to this directory before build

### Issue 2: Environment Variables Not Loading

**Symptoms:**
- Health endpoint shows `apiKeyConfigured: false`
- OpenAI API calls fail with authentication errors

**Checklist:**
1. ✅ Verify variable exists in Railway dashboard (Variables tab)
2. ✅ Check variable name matches exactly (case-sensitive)
3. ✅ Redeploy after adding variables
4. ✅ Check server logs for startup messages

**Validation:**
```javascript
console.log(`🔑 API Key configured: ${OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-YOUR_...' ? 'Yes' : 'No'}`);
```

### Issue 3: CORS Errors After Deployment

**Symptoms:**
- Extension can't connect to backend
- Browser console shows CORS policy errors

**Root Cause:**
- Backend `allowedOrigins` doesn't include extension ID yet
- Extension ID only exists after loading extension

**Solution Flow:**
1. Deploy backend with placeholder extension ID
2. Load extension to get real extension ID
3. Update backend with real extension ID
4. Redeploy backend

**Backend CORS Configuration:**
```javascript
const allowedOrigins = [
  'chrome-extension://YOUR_EXTENSION_ID',  // Update after loading extension
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS policy violation from origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  }
}));
```

---

## Automatic Deployment Pattern

### Git-Based Continuous Deployment

**Railway Auto-Deploy Behavior:**
1. Connect Railway to GitHub repository
2. Railway watches the main branch
3. On every push to main:
   - Railway detects commit
   - Pulls latest code
   - Runs build process
   - Deploys new version
   - Zero-downtime deployment

**Deployment Trigger:**
```bash
git add .
git commit -m "Update backend logic"
git push origin main
# Railway automatically deploys within 30-60 seconds
```

**Monitoring Deployments:**
1. Railway Dashboard → Deployments tab
2. View build logs in real-time
3. See deployment history
4. Rollback to previous deployments if needed

---

## Cost Optimization Pattern

### Railway Free Tier Management

**Free Tier Includes:**
- $5 credit per month (renews automatically)
- ~500 hours of usage
- 100GB outbound bandwidth
- Unlimited inbound bandwidth

**Typical Usage for This Project:**
- Backend server: ~$0.50-2.00/month
- Well within free tier limits
- No sleep/wake cycles (always on)

**Monitoring Usage:**
```
Railway Dashboard → Project → Usage tab
```

**Cost Breakdown:**
- Compute: Based on CPU/memory usage
- Bandwidth: Outbound data transfer
- Build time: Usually negligible

**Staying Free:**
- Single service deployment: ~$1-2/month
- Multiple small services: Can still fit in $5 credit
- Monitor usage regularly
- Set up usage alerts in Railway

---

## Comparison: Alternative Configurations Attempted

### Failed Approach 1: Complex Railway Config Files

**Attempted:**
```json
// railway.json
{
  "build": {
    "buildCommand": "cd backend-server && npm install"
  },
  "deploy": {
    "startCommand": "cd backend-server && npm start"
  }
}
```

**Why It Failed:**
- Commands run in shell context where `cd` doesn't persist
- npm not in PATH when running from root
- Complex command chaining is fragile

**Lesson:** Use Root Directory setting instead of command chaining

### Failed Approach 2: Nixpacks TOML Configuration

**Attempted:**
```toml
[phases.install]
cmds = [
  "cd backend-server",
  "npm ci"
]
```

**Why It Failed:**
- Overcomplicated for simple use case
- Each command runs in separate shell
- Directory changes don't persist between commands

**Lesson:** Railway's Root Directory setting is the simplest solution

### Failed Approach 3: Root-Level Package.json Wrapper

**Attempted:**
```json
{
  "scripts": {
    "start": "cd backend-server && npm start",
    "install": "cd backend-server && npm install"
  }
}
```

**Why It Failed:**
- Adds unnecessary complexity
- Confusing project structure
- Harder to maintain

**Lesson:** Keep project structure clean, use platform features

---

## Best Practices Summary

### Deployment Checklist

**Pre-Deployment:**
- [ ] Backend code is in dedicated subdirectory
- [ ] `package.json` has `start` script
- [ ] Environment variables documented
- [ ] Health check endpoint implemented
- [ ] Code committed to GitHub

**Railway Configuration:**
- [ ] Set Root Directory to backend subdirectory
- [ ] Add all environment variables
- [ ] Generate public domain
- [ ] Test health endpoint

**Client Integration:**
- [ ] Update client with backend URL
- [ ] Test client-server connection
- [ ] Get extension/client ID
- [ ] Update backend CORS with client ID
- [ ] Redeploy backend

**Validation:**
- [ ] Health endpoint returns `apiKeyConfigured: true`
- [ ] Client can connect without CORS errors
- [ ] End-to-end functionality works
- [ ] Monitor Railway usage/costs

### Key Principles

1. **Simplicity First:** Use platform features over custom scripts
2. **Root Directory Over Command Chaining:** Set working directory, don't chain `cd` commands
3. **Environment Variables:** Never commit secrets, use platform variable management
4. **Health Checks:** Always implement validation endpoints
5. **Two-Phase Security:** Deploy backend → get client ID → secure backend
6. **Git-Based Deployment:** Let Railway handle CI/CD automatically

---

## Related Files

- Architecture: `/context/promo-code-finder-architecture.md`
- Backend Server: `/backend-server/server.js`
- Railway Config: `/railway.json`
- Setup Guide: `/README.md`

---

## Future Enhancements

### Potential Improvements

1. **Multi-Environment Setup:**
   - Separate Railway services for development/production
   - Environment-specific domains
   - Branch-based deployments

2. **Enhanced Monitoring:**
   - Add logging service (Datadog, LogRocket)
   - Error tracking (Sentry)
   - Usage analytics

3. **Performance Optimization:**
   - Add Redis caching layer
   - Implement rate limiting
   - Response compression

4. **Scalability:**
   - Horizontal scaling configuration
   - Load balancing setup
   - Database integration if needed

