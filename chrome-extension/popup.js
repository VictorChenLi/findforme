// Backend URL - MUST match the URL in manifest.json host_permissions
const BACKEND_URL = 'https://findforme-production.up.railway.app/find-codes';

// DOM elements
const findButton = document.getElementById('findButton');
const statusDiv = document.getElementById('status');
const errorDiv = document.getElementById('error');
const resultsDiv = document.getElementById('results');

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

    // Display results
    hideStatus();
    displayResults(data.codes || []);

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
 */
function displayResults(codes) {
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

  showStatus(`Found ${codes.length} promo code${codes.length > 1 ? 's' : ''}!`, 'success');
  
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

