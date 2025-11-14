# Backend Server

Express.js server that acts as a secure proxy between the Chrome extension and OpenAI API.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
PORT=3000
```

**Important:** Never commit the `.env` file to Git!

### 3. Run Locally

Development mode (auto-restart on changes):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 4. Test Endpoints

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Find Codes:**
```bash
curl -X POST http://localhost:3000/find-codes \
  -H "Content-Type: application/json" \
  -d '{"domain":"nike.com"}'
```

## Deployment

### Render.com (Recommended)

1. Push your code to GitHub
2. Create a new Web Service on Render.com
3. Connect your repository
4. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
5. Configure:
   - Build Command: `cd backend-server && npm install`
   - Start Command: `cd backend-server && npm start`
6. Deploy!

### Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Run: `railway login`
3. Run: `railway init`
4. Run: `railway up`
5. Add environment variable: `railway variables set OPENAI_API_KEY=sk-...`

### Other Services

This is a standard Express.js app, so it works with:
- Heroku
- Vercel
- AWS (Elastic Beanstalk, Lambda)
- Google Cloud Run
- Any VPS with Node.js

## Security Configuration

### After Loading Extension

1. Load the Chrome extension
2. Get the extension ID from `chrome://extensions/`
3. Update `server.js`:

```javascript
const allowedOrigins = [
  'chrome-extension://YOUR_ACTUAL_EXTENSION_ID',
];
```

4. Redeploy the server

This CORS configuration ensures only your extension can access the API.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key (must have GPT-4 access) |
| `PORT` | No | Server port (default: 3000) |

## API Endpoints

### POST /find-codes

Find promo codes for a domain.

**Request:**
```json
{
  "domain": "nike.com"
}
```

**Response:**
```json
{
  "codes": [
    {
      "code": "SUMMER25",
      "description": "25% off entire order (verified on Reddit 2025)"
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T12:00:00.000Z",
  "apiKeyConfigured": true
}
```

### GET /

API information.

## Dependencies

- **express**: Web server framework
- **cors**: Cross-Origin Resource Sharing middleware
- **dotenv**: Environment variable management

## Development

### Adding New Features

1. Modify `server.js`
2. Test locally with `npm run dev`
3. Deploy to your hosting service

### Monitoring

Check logs:
- **Render.com**: View logs in the dashboard
- **Railway**: `railway logs`
- **Local**: Console output

## Troubleshooting

**"API key is not properly configured":**
- Check `.env` file exists (local)
- Verify environment variables in hosting dashboard (production)
- Make sure key starts with `sk-`

**CORS errors:**
- Update `allowedOrigins` with correct extension ID
- Make sure to redeploy after changes

**OpenAI API errors:**
- Verify API key is valid
- Check you have credits in your OpenAI account
- Ensure your key has access to GPT-4 and web search

## Cost Management

The server makes one OpenAI API call per extension request. Costs depend on:
- Model used (currently GPT-4)
- Number of tokens in request/response
- Web search usage

Monitor your usage at: https://platform.openai.com/usage

## Files

- `server.js` - Main server application
- `package.json` - Dependencies and scripts
- `.env` - Environment variables (create this, not in Git)
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules

