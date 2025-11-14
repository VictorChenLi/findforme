# Project Logic Reference

This file contains references to detailed logic documentation for different features and patterns used in the codebase.

## Coding Patterns & Architecture

### Promo Code Finder Extension
**Description:** Secure client-server architecture for Chrome extension with OpenAI integration, featuring dual-layer CORS protection, prompt engineering patterns, and comprehensive error handling.

**Reference:** [promo-code-finder-architecture.md](./promo-code-finder-architecture.md)

**Key Concepts:**
- Secure proxy pattern for API key protection
- Dual-layer CORS security (client + server)
- Prompt engineering for web search
- Progressive UI disclosure pattern
- Two-phase deployment configuration

---

## Deployment & Infrastructure

### Railway Deployment Patterns
**Description:** Comprehensive guide for deploying Node.js backends in monorepo structures to Railway, including troubleshooting strategies, environment configuration, and platform comparison.

**Reference:** [railway-deployment-patterns.md](./railway-deployment-patterns.md)

**Key Concepts:**
- Monorepo subdirectory deployment configuration
- Root Directory vs command chaining approaches
- Environment variable management patterns
- Deployment validation with health checks
- Two-phase client-server security configuration
- CORS troubleshooting for Chrome extensions
- Cost optimization for free tier usage
- Git-based continuous deployment workflow

---

## Future Logic Documentation

Add new entries here following this format:

### [Feature Name]
**Description:** Brief description of the feature or pattern  
**Reference:** [filename.md](./filename.md)  
**Key Concepts:** List of main concepts covered

