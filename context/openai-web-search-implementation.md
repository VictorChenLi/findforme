# OpenAI Web Search Implementation - gpt-4o-search-preview

**Date Created:** January 2025  
**Purpose:** Document the implementation of OpenAI's web search capabilities using the `gpt-4o-search-preview` model for promo code finding

---

## Overview

This document describes the implementation of web search functionality using OpenAI's `gpt-4o-search-preview` model, which provides built-in web search capabilities without requiring separate tool configurations.

---

## Architecture Decision

### Why `gpt-4o-search-preview`?

After evaluating OpenAI's web search options, we chose `gpt-4o-search-preview` over the Responses API for the following reasons:

1. **Minimal Code Changes**: Works with existing Chat Completions API structure
2. **Automatic Web Search**: Model automatically performs web search for every query
3. **Simple Implementation**: No need for tools array or complex state management
4. **Quick Deployment**: Can be implemented immediately without API migration

### Comparison with Alternatives

| Approach | Migration Effort | Complexity | Status |
|----------|------------------|------------|--------|
| `gpt-4o-search-preview` | Low (change model name) | Low | ✅ Implemented |
| Responses API | High (new API structure) | High | Future consideration |
| `web_search` tool | Not available | N/A | ❌ Not working |

---

## Implementation Details

### Model Configuration

```javascript
// backend-server/server.js

body: JSON.stringify({
  model: 'gpt-4o-search-preview',  // Changed from 'gpt-4o'
  messages: [
    {
      role: 'system',
      content: systemPrompt,
    },
  ],
  response_format: { type: 'json_object' },
  temperature: 0.7,
  max_tokens: 2000,
  // No tools array needed - model has built-in web search
})
```

### Key Changes from Previous Implementation

1. **Model Name**: Changed from `'gpt-4o'` to `'gpt-4o-search-preview'`
2. **Removed Tools Array**: The `tools: [{ type: 'web_search' }]` array is no longer needed
3. **Automatic Search**: The model automatically performs web search before generating responses

### How It Works

1. **Request Sent**: User requests promo codes for a domain
2. **Automatic Web Search**: The `gpt-4o-search-preview` model automatically searches the web
3. **Context Integration**: Search results are integrated into the model's context
4. **Response Generation**: Model generates JSON response with promo codes based on search results

---

## System Prompt Strategy

The system prompt is designed to guide the model's web search behavior:

```javascript
const systemPrompt = `You are an expert promo code finder...

**CRITICAL INSTRUCTIONS:**
1. **DEEP SEARCH REQUIRED:** You MUST perform multiple searches...
2. **PRIORITIZE FORUMS:** You MUST prioritize searching community forums like Reddit...
3. **VERIFY VALIDITY:** Scrutinize the search results...
4. **JSON OUTPUT ONLY:** You must *only* respond with a valid JSON object...
5. **STRICT FORMAT:** Your response MUST be in this exact format...
6. **EMPTY ON FAILURE:** If you cannot find ANY valid codes...
`;
```

**Key Points:**
- Instructions guide the model to search Reddit and social platforms
- Prompts emphasize verification and validity checking
- JSON format enforcement ensures consistent output

---

## API Request Flow

```
User Request (domain)
    ↓
Backend Validation
    ↓
OpenAI API Call (gpt-4o-search-preview)
    ↓
Model Performs Web Search (automatic)
    ↓
Model Generates JSON Response
    ↓
Backend Parses & Validates
    ↓
Return to Chrome Extension
```

---

## Benefits

1. **Simplicity**: No complex tool configuration required
2. **Reliability**: Built-in search capabilities reduce integration complexity
3. **Cost-Effective**: Single API call handles both search and generation
4. **Maintainability**: Standard Chat Completions API structure

## Limitations

1. **Always Searches**: Model performs web search for every query (less efficient than conditional search)
2. **Preview Status**: Model is in preview/beta, may have limitations
3. **Less Control**: Cannot control when search happens (unlike Responses API)

---

## Future Considerations

### Potential Migration to Responses API

If we need more advanced features in the future, consider migrating to Responses API:

**When to Migrate:**
- Need conditional web search (only search when necessary)
- Require stateful conversations
- Need multimodal support (images, audio)
- Want better cost optimization

**Migration Effort:**
- Change API endpoint: `/v1/chat/completions` → `/v1/responses`
- Update request structure: `messages` → `input`
- Update response parsing: `choices[0].message.content` → `output_text`
- Add tools array: `tools: [{ type: 'web_search' }]`

---

## Testing

### Test Cases

1. **Valid Domain**: Test with popular domains (e.g., "nike.com", "amazon.com")
2. **Invalid Domain**: Test with non-existent or invalid domains
3. **Error Handling**: Test with missing API key, network errors
4. **Response Format**: Verify JSON structure is correct

### Example Test Request

```bash
curl -X POST http://localhost:3000/find-codes \
  -H "Content-Type: application/json" \
  -d '{"domain":"nike.com"}'
```

---

## Cost Considerations

- **Model Pricing**: `gpt-4o-search-preview` uses standard GPT-4o pricing
- **Search Costs**: Web search is included in model cost
- **Token Usage**: Similar to standard GPT-4o, but includes search context
- **Optimization**: Consider caching results for frequently searched domains

---

## Related Files

- Main Implementation: `/backend-server/server.js`
- Architecture Documentation: `/context/promo-code-finder-architecture.md`
- Logic Reference: `/context/logic.md`

---

## Key Takeaways

1. **Simple Solution**: `gpt-4o-search-preview` provides the simplest path to web search
2. **No Migration Needed**: Works with existing Chat Completions API
3. **Automatic Search**: Model handles web search automatically
4. **Future-Proof**: Can migrate to Responses API later if needed

---

## References

- OpenAI API Documentation: https://platform.openai.com/docs
- Model Registry: https://platform.openai.com/docs/models
- Web Search Capabilities: OpenAI Responses API vs Chat Completions comparison

