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
  'chrome-extension://YOUR_EXTENSION_ID_GOES_HERE',
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
    const systemPrompt = `You are a helpful assistant that provides promotional code suggestions for e-commerce websites based on your training data knowledge.

For the domain: ${domain}

**INSTRUCTIONS:**
1. Based on your knowledge, suggest common promotional codes that are typically used by this brand or website
2. Include codes that are commonly advertised (like "WELCOME10", "FREESHIP", etc.)
3. If you know of specific codes from your training data, include them
4. Be honest - if you don't have recent information about codes for this site, return an empty array

**CRITICAL - JSON OUTPUT ONLY:** 
You must respond with ONLY a valid JSON object. No explanatory text, no markdown, no code blocks. Just raw JSON.

**STRICT FORMAT:**
{
  "codes": [
    {
      "code": "EXAMPLE20",
      "description": "Description of what the code does"
    }
  ]
}

**If no codes available:** { "codes": [] }

Respond now with JSON only:`;

    // Make request to OpenAI API
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
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
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
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

