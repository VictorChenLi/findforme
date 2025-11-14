# Promo Code Finder - Architecture & Logic Documentation

**Date Created:** November 11, 2025  
**Purpose:** Document the architectural patterns, security mechanisms, and implementation logic for the Promo Code Finder Chrome Extension

---

## Core Architecture Pattern

### Client-Server Separation for Security
The system uses a **secure proxy pattern** where sensitive API keys are isolated from client-side code.

**Pattern:** Chrome Extension (Public) → Backend Server (Private) → External API (OpenAI)

**Rationale:**
- Chrome extensions are publicly accessible (source code can be inspected)
- API keys embedded in extensions can be extracted and abused
- Backend server acts as a secure proxy, hiding credentials

---

## Security Mechanisms

### 1. Dual-Layer CORS Protection

**Client-Side (Extension):**
```javascript
// manifest.json
"host_permissions": [
  "https://your-backend-url.com/*"
]
```
- Extension can ONLY communicate with specified backend URL
- Chrome enforces this at the browser level
- Cannot be bypassed by malicious code injection

**Server-Side (Backend):**
```javascript
// server.js
const allowedOrigins = [
  'chrome-extension://YOUR_EXTENSION_ID'
];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'), false);
    }
  }
}));
```
- Backend ONLY accepts requests from specific extension ID
- Extension ID is unique and cannot be spoofed
- Creates a bidirectional security lock

### 2. Minimal Permission Request
```javascript
"permissions": ["activeTab"]
```
- Only grants access to current tab when user clicks extension
- No persistent access to browsing history or other tabs
- Privacy-friendly and follows principle of least privilege

---

## Data Flow Pattern

### Step-by-Step Request Flow

1. **User Interaction → Domain Extraction**
   ```javascript
   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
     const url = new URL(tabs[0].url);
     const domain = url.hostname;  // e.g., "nike.com"
   });
   ```

2. **Extension → Backend (POST Request)**
   ```javascript
   fetch(BACKEND_URL, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ domain })
   });
   ```

3. **Backend → OpenAI API**
   ```javascript
   fetch(OPENAI_API_URL, {
     headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
     body: JSON.stringify({
       model: 'gpt-4o',
       messages: [{ role: 'system', content: systemPrompt }],
       tools: [{ type: 'web_search' }],
       response_format: { type: 'json_object' }
     })
   });
   ```

4. **OpenAI Performs Web Search**
   - AI model uses internal web_search tool
   - Searches for recent promo codes on forums (Reddit, etc.)
   - Verifies code validity based on user comments

5. **Structured JSON Response**
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

6. **Backend → Extension (Pass-through)**
   - Backend forwards OpenAI response unchanged
   - No data transformation needed

7. **Extension → DOM Update**
   ```javascript
   codes.forEach(codeObj => {
     // Create styled HTML elements
     // Add copy-to-clipboard functionality
     // Append to results container
   });
   ```

---

## Prompt Engineering Pattern

### System Prompt Structure

The prompt is designed with **explicit instructions** and **strict formatting rules**:

```javascript
const systemPrompt = `
You are an expert promo code finder...

**CRITICAL INSTRUCTIONS:**
1. **DEEP SEARCH REQUIRED:** Multiple searches, don't stop at first result
2. **PRIORITIZE FORUMS:** Reddit queries like "promo code for ${domain} reddit 2025"
3. **VERIFY VALIDITY:** Look for recent dates, user confirmations
4. **JSON OUTPUT ONLY:** No markdown, no explanations
5. **STRICT FORMAT:** { "codes": [...] }
6. **EMPTY ON FAILURE:** { "codes": [] }
`;
```

**Key Elements:**
- **Specificity:** Tells AI exactly what to do and how
- **Format Enforcement:** Uses OpenAI's `response_format: { type: 'json_object' }`
- **Source Prioritization:** Directs AI to community forums over promotional sites
- **Validation Logic:** Instructs AI to check for freshness and user verification

---

## Error Handling Patterns

### Frontend Error Handling

```javascript
try {
  const domain = await getCurrentDomain();
  const response = await fetch(BACKEND_URL, {...});
  
  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }
  
  const data = await response.json();
  displayResults(data.codes);
  
} catch (error) {
  showError(error.message);
} finally {
  findButton.disabled = false;  // Always re-enable button
}
```

**Pattern:** Try-Catch-Finally with graceful degradation
- All errors shown to user in friendly format
- Button always re-enabled to allow retries
- Specific error messages for debugging

### Backend Error Handling

```javascript
// Input validation
if (!domain || typeof domain !== 'string') {
  return res.status(400).json({ error: 'Invalid request' });
}

// API key check
if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-YOUR_...') {
  return res.status(500).json({ error: 'Configuration error' });
}

// OpenAI API error
if (!openaiResponse.ok) {
  const errorData = await openaiResponse.json();
  return res.status(500).json({
    error: 'AI service error',
    details: errorData.error?.message
  });
}

// JSON parsing error
try {
  parsedResponse = JSON.parse(content);
} catch (parseError) {
  return res.status(500).json({ error: 'Parse error' });
}
```

**Pattern:** Validation at every layer
- Input validation before processing
- Configuration validation before external calls
- Response validation before returning
- Detailed error logging for debugging

---

## UI/UX Patterns

### Progressive Disclosure
```javascript
// 1. Show loading state
showStatus('Searching for codes...', 'loading');
findButton.disabled = true;

// 2. Show results or empty state
displayResults(codes);  // Handles both success and empty cases

// 3. Always cleanup
findButton.disabled = false;
```

### Copy-to-Clipboard Feedback
```javascript
async function copyToClipboard(text, button) {
  await navigator.clipboard.writeText(text);
  button.textContent = '✓ Copied!';
  button.classList.add('copied');
  
  setTimeout(() => {
    button.textContent = 'Copy';  // Reset after 2 seconds
  }, 2000);
}
```

**Pattern:** Immediate visual feedback for user actions

### Empty State Handling
```javascript
if (!codes || codes.length === 0) {
  resultsDiv.innerHTML = `
    <div class="empty-state">
      <svg>...</svg>
      <p>No active promo codes found...</p>
    </div>
  `;
}
```

**Pattern:** Never show raw errors; always provide friendly, actionable messages

---

## Deployment Configuration Pattern

### Environment-Specific Configuration

**Development:**
```javascript
// Local testing with placeholder values
const BACKEND_URL = 'http://localhost:3000/find-codes';
```

**Production:**
```javascript
// Actual deployed URLs
const BACKEND_URL = 'https://promo-code-finder.onrender.com/find-codes';
```

### Two-Phase Deployment
1. **Deploy Backend First** → Get URL
2. **Configure Extension** → Use backend URL
3. **Load Extension** → Get extension ID
4. **Update Backend** → Add extension ID to CORS
5. **Redeploy Backend** → Lock down security

**Rationale:** Backend must know extension ID, but ID only exists after loading extension

---

## Technology Stack Rationale

### Frontend: Vanilla JavaScript
- **Why not React/Vue?** 
  - Minimal overhead for simple UI
  - Faster load times
  - No build process needed
  - Easier for Chrome extension approval

### Backend: Express.js
- **Why Express?**
  - Lightweight and fast
  - Simple to deploy
  - Minimal dependencies
  - Industry standard for Node.js APIs

### API: OpenAI with web_search
- **Why OpenAI?**
  - Built-in web search tool
  - Natural language understanding
  - JSON output formatting
  - No need for separate search API

---

## Scalability Considerations

### Current Limitations
- One API call per request (no caching)
- Sequential processing (no batching)
- No rate limiting on frontend

### Future Improvements
1. **Caching Layer:** Redis cache for frequent domains
2. **Rate Limiting:** Prevent abuse with request throttling
3. **Batch Processing:** Queue multiple requests
4. **Analytics:** Track popular domains and success rates

---

## Cost Optimization Patterns

### Prompt Efficiency
- Short, specific prompts to reduce token usage
- Structured output format (JSON) for consistency
- Single API call per search

### Error Prevention
- Input validation before API calls
- Configuration checks to avoid wasted calls
- Graceful degradation on failures

### Monitoring
```javascript
// Health endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: Boolean(OPENAI_API_KEY)
  });
});
```

---

## Testing Strategy

### Manual Testing Checklist
1. **Extension Loading:** Verify manifest.json is valid
2. **Domain Extraction:** Test on various sites
3. **API Communication:** Check network tab for requests
4. **CORS Validation:** Verify extension ID is correct
5. **Error Handling:** Test with backend offline
6. **UI Responsiveness:** Test on different screen sizes
7. **Copy Functionality:** Verify clipboard operations

### Backend Testing
```bash
# Health check
curl http://localhost:3000/health

# Find codes
curl -X POST http://localhost:3000/find-codes \
  -H "Content-Type: application/json" \
  -d '{"domain":"nike.com"}'
```

---

## Key Takeaways

1. **Security First:** Never expose API keys in client-side code
2. **CORS is Bidirectional:** Lock down both client and server
3. **Prompt Engineering Matters:** Specific instructions yield better results
4. **Error Handling Everywhere:** Validate at every layer
5. **User Experience:** Always provide feedback (loading, success, error)
6. **Documentation:** Clear setup steps prevent configuration errors

---

## Related Files
- System Design: `/systemdesign.md`
- Setup Guide: `/README.md`
- Setup Checklist: `/SETUP_CHECKLIST.md`

