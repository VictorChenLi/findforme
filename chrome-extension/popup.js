// Backend URL - MUST match the URL in manifest.json host_permissions
const BACKEND_URL = 'https://findforme-production.up.railway.app/find-codes';

// Storage keys
const STORAGE_KEY_PREFIX = 'promo_codes_';

// DOM elements
const findButton = document.getElementById('findButton');
const statusDiv = document.getElementById('status');
const errorDiv = document.getElementById('error');
const resultsDiv = document.getElementById('results');

// Load stored results when popup opens
// Use both DOMContentLoaded and immediate execution to ensure it works
function initializePopup() {
  (async () => {
    try {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const domain = await getCurrentDomain();
      if (domain) {
        console.log('Loading stored results for domain:', domain);
        const loaded = await loadStoredResults(domain);
        if (!loaded) {
          console.log('No cached results found, showing empty state');
        }
      }
    } catch (error) {
      console.error('Error loading stored results:', error);
    }
  })();
}

// Try both approaches to ensure it works
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

// Event listener for the Find button
findButton.addEventListener('click', async () => {
  try {
    // Reset UI
    clearResults();
    hideError();
    showStatus('Analyzing current website...', 'loading');
    findButton.disabled = true;

    // Get the current tab's domain
    const domain = await getCurrentDomain();
    
    if (!domain) {
      throw new Error('Unable to get domain from current tab');
    }

    showStatus(`Searching for codes for ${domain}...`, 'loading');

    // Make API call to backend
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const codes = data.codes || [];

    // Save results to storage
    await saveResults(domain, codes);

    // Display results
    hideStatus();
    displayResults(codes, false);

  } catch (error) {
    console.error('Error:', error);
    hideStatus();
    showError(error.message || 'An unexpected error occurred. Please try again.');
  } finally {
    findButton.disabled = false;
  }
});

/**
 * Get the current tab's domain using Chrome Tabs API
 */
async function getCurrentDomain() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const activeTab = tabs[0];
      if (!activeTab || !activeTab.url) {
        reject(new Error('No active tab found'));
        return;
      }

      try {
        const url = new URL(activeTab.url);
        const domain = url.hostname;
        resolve(domain);
      } catch (error) {
        reject(new Error('Invalid URL in current tab'));
      }
    });
  });
}

/**
 * Display promo codes in the UI
 * @param {Array} codes - Array of promo code objects
 * @param {boolean} isCached - Whether these are cached results
 */
function displayResults(codes, isCached = false) {
  resultsDiv.innerHTML = '';

  if (!codes || codes.length === 0) {
    resultsDiv.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>No active promo codes found for this website.<br>Try checking back later!</p>
      </div>
    `;
    return;
  }

  // Show cached indicator if these are stored results
  if (isCached) {
    const cachedIndicator = document.createElement('div');
    cachedIndicator.className = 'cached-indicator';
    cachedIndicator.innerHTML = `
      <span class="cached-icon">💾</span>
      <span>Showing saved results</span>
    `;
    resultsDiv.appendChild(cachedIndicator);
  } else {
    showStatus(`Found ${codes.length} promo code${codes.length > 1 ? 's' : ''}!`, 'success');
  }
  
  codes.forEach((codeObj, index) => {
    const codeItem = document.createElement('div');
    codeItem.className = 'code-item';
    
    const codeHeader = document.createElement('div');
    codeHeader.className = 'code-header';
    
    const codeText = document.createElement('div');
    codeText.className = 'code-text';
    codeText.textContent = codeObj.code;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => copyToClipboard(codeObj.code, copyBtn));
    
    codeHeader.appendChild(codeText);
    codeHeader.appendChild(copyBtn);
    
    const codeDescription = document.createElement('div');
    codeDescription.className = 'code-description';
    codeDescription.textContent = codeObj.description || 'No description available';
    
    codeItem.appendChild(codeHeader);
    codeItem.appendChild(codeDescription);
    
    resultsDiv.appendChild(codeItem);
  });
}

/**
 * Save results to chrome.storage.local
 */
async function saveResults(domain, codes) {
  try {
    if (!chrome.storage || !chrome.storage.local) {
      console.error('chrome.storage.local is not available. Make sure "storage" permission is in manifest.json');
      return;
    }
    
    const storageKey = STORAGE_KEY_PREFIX + domain;
    const data = {
      codes: codes,
      timestamp: Date.now(),
      domain: domain
    };
    await chrome.storage.local.set({ [storageKey]: data });
    console.log('Saved results for domain:', domain, 'Codes count:', codes.length);
    console.log('Storage key:', storageKey);
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

/**
 * Load stored results from chrome.storage.local
 */
async function loadStoredResults(domain) {
  try {
    if (!chrome.storage || !chrome.storage.local) {
      console.error('chrome.storage.local is not available. Make sure "storage" permission is in manifest.json');
      return false;
    }
    
    const storageKey = STORAGE_KEY_PREFIX + domain;
    console.log('Attempting to load from storage key:', storageKey);
    const result = await chrome.storage.local.get([storageKey]);
    console.log('Storage result:', result);
    const storedData = result[storageKey];
    
    if (storedData && storedData.codes && storedData.codes.length > 0) {
      console.log('Found stored results:', storedData.codes.length, 'codes');
      // Display cached results
      displayResults(storedData.codes, true);
      return true;
    } else {
      console.log('No stored results found for domain:', domain);
    }
    return false;
  } catch (error) {
    console.error('Error loading stored results:', error);
    return false;
  }
}

/**
 * Copy code to clipboard
 */
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.classList.add('copied');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    button.textContent = 'Failed';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'loading') {
  statusDiv.textContent = message;
  statusDiv.className = type;
}

/**
 * Hide status message
 */
function hideStatus() {
  statusDiv.style.display = 'none';
  statusDiv.className = '';
}

/**
 * Show error message
 */
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

/**
 * Hide error message
 */
function hideError() {
  errorDiv.classList.remove('show');
}

/**
 * Clear results
 */
function clearResults() {
  resultsDiv.innerHTML = '';
}

