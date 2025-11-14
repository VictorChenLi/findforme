# **Promo Code Finder \- System Design**

## **1\. Overview**

The Promo Code Finder is a client-server application designed as a Chrome Extension. Its purpose is to help users find active promotional codes for the e-commerce website they are currently visiting.

The system is composed of two main components:

1. **Frontend (Chrome Extension):** A lightweight UI that runs in the user's browser. It's responsible for getting the current website's domain and communicating with the backend.  
2. **Backend (Node.js Server):** A simple server that securely houses the OpenAI API key. It's responsible for receiving a domain from the extension, using the OpenAI API's web\_search tool to find codes, and returning a structured JSON response.

This client-server architecture is **essential for security**. The OpenAI API key *must not* be stored in the Chrome Extension, as it would be publicly visible and easily stolen.

## **2\. System Architecture**

The flow of information is as follows:

User's Browser (Extension) \-\> Backend Server (Node.js) \-\> OpenAI API

1. **Client (Chrome Extension):** The user clicks the extension icon. The extension's popup.js script gets the active tab's domain.  
2. **API Request:** The extension sends a POST request with the domain to our deployed Backend Server.  
3. **Backend Server:** The server receives the domain. It constructs a detailed prompt and makes a POST request to the OpenAI API, giving it the web\_search tool.  
4. **AI Search & Extract:** The OpenAI model performs its own web searches based on the prompt, finds relevant codes, and formats the output as JSON.  
5. **API Response:** The Backend Server receives the JSON from OpenAI and passes it back to the Chrome Extension.  
6. **Client (UI Update):** The extension's popup.js receives the JSON and dynamically renders the promo codes in popup.html.

## **3\. Component Breakdown**

### **3.1. Frontend: Chrome Extension**

The frontend is responsible for the user interface and capturing the context (the domain).

**Folder:** chrome-extension/

#### **manifest.json**

This is the core configuration file for the extension.

* **permissions": \["activeTab"\]**: This is a minimal, privacy-friendly permission. It grants the extension temporary access to the *currently active tab* only *after* the user clicks the extension's icon. This is how we get the website's URL.  
* **"action": { "default\_popup": "popup.html" }**: Specifies that popup.html should be displayed when the user clicks the icon.  
* **"host\_permissions": \[...\]**: This is a critical security permission. It acts as a **firewall whitelist**, defining the *only* external server the extension is allowed to communicate with.  
  "host\_permissions": \[  
    "https://YOUR\_BACKEND\_SERVER\_URL\_GOES\_\[HERE.onrender.com/\](https://HERE.onrender.com/)"  
  \]

#### **popup.html**

A simple HTML file that defines the UI elements:

* A button (\#findButton) to trigger the search.  
* A loading/status indicator (\#status).  
* A container (\#results) to display the codes.  
* An error container (\#error).

#### **popup.js**

This file contains all the frontend logic.

* **Event Listener:** Attaches a click listener to \#findButton.  
* **Get Domain:** Uses the Chrome Tabs API to get the current tab's URL and extracts the hostname.  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) \=\> {  
    // ...  
    const url \= new URL(activeTab.url);  
    domain \= url.hostname;  
    // ...  
  });

* **API Call:** This is the only network request the extension makes. It sends the domain to the backend.  
  // This MUST match the URL in host\_permissions  
  const backendUrl \= 'https://YOUR\_BACKEND\_SERVER\_URL\_GOES\_\[HERE.onrender.com/find-codes\](https://HERE.onrender.com/find-codes)';

  fetch(backendUrl, {  
    method: 'POST',  
    headers: { 'Content-Type': 'application/json' },  
    body: JSON.stringify({ domain: domain }),  
  })  
  .then(response \=\> response.json())  
  .then(data \=\> {  
    // Calls displayResults(data.codes)  
  });

* **DOM Manipulation:** displayResults() and showError() are used to update the popup.html with the results.

### **3.2. Backend: Node.js Server**

The backend is a simple Express server with one purpose: to be a secure proxy for the OpenAI API.

**Folder:** backend-server/

#### **package.json**

Defines the dependencies, which are minimal:

* **express**: The web server.  
* **cors**: For managing cross-origin requests.

#### **server.js**

This is the entire backend.

* **CORS (Security):** This is the server-side security counterpart to the extension's host\_permissions. It whitelists the extension's unique ID, ensuring that **only your Chrome extension can make requests to this server**.  
  const allowedOrigins \= \[  
    'chrome-extension://YOUR\_EXTENSION\_ID\_GOES\_HERE'  
  \];  
  app.use(cors({  
    origin: function (origin, callback) {  
      if (\!origin || allowedOrigins.indexOf(origin) \!== \-1) {  
        callback(null, true);  
      } else {  
        callback(new Error('CORS policy violation'), false);  
      }  
    }  
  }));

* **API Endpoint (POST /find-codes):** This is the only endpoint, which receives the domain in the request body.  
* **OpenAI API Call:** The server takes the domain and inserts it into a highly specific systemPrompt. This prompt is the "brain" of the AI.  
  * **Tool:** tools: \[{ "type": "web\_search" }\] explicitly gives the model permission to search the web.  
  * **Format:** response\_format: { "type": "json\_object" } forces the model to return valid JSON, which is critical for parsing.  
* **System Prompt (The "Secret Sauce"):** This prompt instructs the AI *how* to behave. It is engineered to:  
  * Prioritize forums like Reddit.  
  * Verify codes are active.  
  * Return *only* JSON in a strict format.

const systemPrompt \= \`  
  You are an expert promo code finder. Your sole mission is to find active, valid promo codes for a given domain.

  \*\*CRITICAL INSTRUCTIONS:\*\*  
  1\.  \*\*DEEP SEARCH REQUIRED:\*\* You MUST perform multiple searches. Do not stop at the first result.  
  2\.  \*\*PRIORITIZE FORUMS:\*\* You MUST prioritize searching community forums like Reddit. Use search queries like "promo code for ${domain} reddit 2025"...  
  3\.  \*\*VERIFY VALIDITY:\*\* Scrutinize the search results...  
  4\.  \*\*JSON OUTPUT ONLY:\*\* You must \*only\* respond with a valid JSON object...  
  5\.  \*\*STRICT FORMAT:\*\* { "codes": \[...\] }  
  6\.  \*\*EMPTY ON FAILURE:\*\* { "codes": \[\] }  
\`;

* **API Key Protection:** The OPENAI\_API\_KEY exists *only* on the server and is never exposed to the user.  
  const OPENAI\_API\_KEY \= 'sk-YOUR\_OPENAI\_API\_KEY\_HERE';  
  // ...  
  const openaiResponse \= await fetch('...', {  
    headers: { 'Authorization': \`Bearer ${OPENAI\_API\_KEY}\` }  
  });

## **4\. Data Flow (Step-by-Step)**

1. **User Action:** User on nike.com clicks the extension icon, then clicks "Find Promo Codes."  
2. **popup.js:**  
   * chrome.tabs.query gets the domain: "www.nike.com".  
   * fetch sends POST /find-codes with {"domain": "www.nike.com"} to https://my-promo-finder.onrender.com/find-codes.  
3. **server.js (Backend):**  
   * Receives the request.  
   * Checks the request's Origin header. It matches 'chrome-extension://\<your\_id\>', so CORS allows it.  
   * The systemPrompt is formatted with domain: "www.nike.com".  
   * Makes a fetch call to OpenAI with the prompt and web\_search tool.  
4. **OpenAI API:**  
   * Model receives the prompt.  
   * Runs its internal web\_search tool (e.g., searches for "promo code for www.nike.com reddit 2025").  
   * Analyzes the search results.  
   * Generates the final, structured JSON:  
     {  
       "codes": \[  
         {"code": "SUMMER25", "description": "25% off (source: Reddit thread)"}  
       \]  
     }

5. **server.js (Backend):**  
   * Receives the JSON from OpenAI.  
   * Sends this JSON back to the extension as the response.  
6. **popup.js:**  
   * The fetch promise resolves with the JSON.  
   * displayResults() is called.  
   * A new HTML element is created and appended to the \#results div, displaying the code "SUMMER25".

## **5\. Deployment & Setup**

This is the required setup flow:

1. **Backend:** The backend-server directory is deployed to a public web host (e.g., Render.com). This generates a public URL (e.g., https://my-promo-finder.onrender.com).  
2. **Frontend (Config):** The chrome-extension code is updated:  
   * manifest.json's host\_permissions is set to the backend URL.  
   * popup.js's backendUrl variable is set to the backend URL.  
3. **Frontend (Load):** The chrome-extension folder is loaded into Chrome via chrome://extensions in "Developer mode."  
4. **Get Extension ID:** Loading the extension generates a unique ID (e.g., omkcnllgacepghpldaaahjocbifmfago).  
5. **Backend (Secure):** The backend's server.js file is updated with this ID in the allowedOrigins array and then re-deployed. This final step locks down the server.