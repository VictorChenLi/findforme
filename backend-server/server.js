require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-YOUR_OPENAI_API_KEY_HERE';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Security: Whitelist your Chrome Extension's origin
// After you load the extension, update this with your actual extension ID
const allowedOrigins = [
  'chrome-extension://depjimohhngkpjihdheflgnmliehgoaj',
  // For development/testing, you can uncomment this (REMOVE in production):
  // 'http://localhost:3000',
];

// CORS Configuration - Only allow requests from your Chrome Extension
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS policy violation from origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
}));

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Main endpoint: Find promo codes for a given domain
 */
app.post('/find-codes', async (req, res) => {
  try {
    const { domain } = req.body;

    // Validation
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Domain is required and must be a string',
      });
    }

    console.log(`Searching for promo codes for domain: ${domain}`);

    // Check if API key is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-YOUR_OPENAI_API_KEY_HERE') {
      console.error('OpenAI API key is not configured');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'API key is not properly configured',
      });
    }

    // Construct the system prompt
    const systemPrompt = `You are an expert promo code finder. Your sole mission is to find active, valid promo codes for a given domain.

**CRITICAL INSTRUCTIONS:**
1. **DEEP SEARCH REQUIRED:** You MUST perform multiple searches. Do not stop at the first result.
2. **PRIORITIZE FORUMS:** You MUST prioritize searching community forums like Reddit. Use search queries like "promo code for ${domain} reddit 2025", "${domain} discount code reddit", "${domain} coupon code site:reddit.com".
3. **SEARCH OTHER FORUMS:** In addition to Reddit, you MUST search for promo codes on other community forums and discussion boards (e.g., RedFlagDeals, Slickdeals, FatWallet, etc.). Use search queries like "promo code for ${domain} slickdeals", "${domain} discount code forums 2025", "${domain} promo code community discussion".
4. **VERIFY VALIDITY:** Scrutinize the search results. Look for:
   - Recent dates (2024-2025)
   - User confirmations ("This worked for me!", "Still active")
   - Specific percentage or dollar amounts
   - Avoid codes marked as expired or "didn't work"
5. **JSON OUTPUT ONLY:** You must *only* respond with a valid JSON object. Do not include any explanatory text, markdown formatting, or code blocks. Return raw JSON. Start your response with { and end with }. No markdown code fences, no explanations before or after.
6. **STRICT FORMAT:** Your response MUST be in this exact format:
   {
     "codes": [
       {
         "code": "SUMMER25",
         "description": "25% off entire order (verified on Reddit 2025)"
       },
       {
         "code": "FREESHIP",
         "description": "Free shipping on orders over $50 (from official site)"
       }
     ]
   }
7. **EMPTY ON FAILURE:** If you cannot find ANY valid codes after thorough searching, return: { "codes": [] }

Now find promo codes for: ${domain}`;

    // Make request to OpenAI API
    // Using gpt-4o-search-preview model which automatically performs web search
    // No need for tools array - the model has built-in web search capabilities
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', openaiResponse.status, errorData);
      return res.status(500).json({
        error: 'AI service error',
        message: 'Failed to get response from AI service',
        details: errorData.error?.message || 'Unknown error',
      });
    }

    const openaiData = await openaiResponse.json();
    
    // Extract the response content
    const content = openaiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response:', openaiData);
      return res.status(500).json({
        error: 'Invalid AI response',
        message: 'AI service returned an invalid response',
      });
    }

    // Parse the JSON response
    // Handle cases where JSON might be wrapped in markdown code blocks
    let cleanedContent = content.trim();
    // Remove markdown code fences if present
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    // Extract JSON object if there's text before/after
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      console.error('Parse error:', parseError.message);
      return res.status(500).json({
        error: 'Parse error',
        message: 'Failed to parse AI response',
      });
    }

    // Validate the response structure
    if (!parsedResponse.codes || !Array.isArray(parsedResponse.codes)) {
      console.error('Invalid response structure:', parsedResponse);
      return res.json({ codes: [] });
    }

    console.log(`Found ${parsedResponse.codes.length} codes for ${domain}`);
    
    // Return the codes to the extension
    res.json(parsedResponse);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-YOUR_OPENAI_API_KEY_HERE',
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Promo Code Finder API',
    version: '1.0.0',
    endpoints: {
      'POST /find-codes': 'Find promo codes for a domain',
      'GET /health': 'Health check',
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🔑 API Key configured: ${OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-YOUR_OPENAI_API_KEY_HERE' ? 'Yes' : 'No'}`);
  console.log(`🔒 Allowed origins: ${allowedOrigins.join(', ')}`);
});

