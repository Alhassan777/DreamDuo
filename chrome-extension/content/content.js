/**
 * Content script for DreamDuo Chrome Extension
 * Runs on the DreamDuo web app and captures authentication tokens
 */

(function() {
  'use strict';

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    const url = args[0]?.url || args[0];
    if (typeof url === 'string' && url.includes('/auth/login')) {
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        
        if (data.access_token) {
          chrome.runtime.sendMessage({
            type: 'DREAMDUO_TOKEN',
            token: data.access_token,
            user: data.user
          });
          console.log('[DreamDuo Extension] Token captured from login');
        }
      } catch (e) {
        // Response was not JSON or parsing failed
      }
    }
    
    return response;
  };

  // Also intercept XMLHttpRequest for axios compatibility
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      if (this._url && this._url.includes('/auth/login')) {
        try {
          const data = JSON.parse(this.responseText);
          if (data.access_token) {
            chrome.runtime.sendMessage({
              type: 'DREAMDUO_TOKEN',
              token: data.access_token,
              user: data.user
            });
            console.log('[DreamDuo Extension] Token captured from login (XHR)');
          }
        } catch (e) {
          // Ignore errors
        }
      }
    });
    return originalXHRSend.apply(this, args);
  };

  // Check if user is already logged in by looking at the page
  // Send a message to let popup know the web app is loaded
  chrome.runtime.sendMessage({
    type: 'DREAMDUO_PAGE_LOADED',
    url: window.location.href
  });

  console.log('[DreamDuo Extension] Content script loaded');
})();
