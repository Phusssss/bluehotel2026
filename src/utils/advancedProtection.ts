/**
 * Advanced source code protection
 */

// Anti-debugging techniques
export const antiDebug = () => {
  // Detect debugger
  setInterval(() => {
    const start = performance.now();
    debugger; // This will pause if debugger is open
    const end = performance.now();
    
    if (end - start > 100) {
      // Debugger detected
      window.location.href = 'about:blank';
    }
  }, 1000);
};

// Detect browser developer tools
export const detectDevToolsAdvanced = () => {
  let devtools = false;
  
  // Method 1: Console detection
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      devtools = true;
      showSecurityWarning();
    }
  });
  
  setInterval(() => {
    devtools = false;
    console.log(element);
    console.clear();
  }, 1000);
  
  // Method 2: Window size detection
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
      showSecurityWarning();
    }
  }, 1000);
};

// Show security warning and redirect
const showSecurityWarning = () => {
  document.body.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(45deg, #ff0000, #000000);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'Courier New', monospace;
      z-index: 999999;
      animation: blink 1s infinite;
    ">
      <style>
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }
      </style>
      <h1 style="font-size: 48px; margin-bottom: 20px;">🚨 SECURITY ALERT 🚨</h1>
      <h2 style="font-size: 32px; margin-bottom: 20px;">UNAUTHORIZED ACCESS DETECTED</h2>
      <p style="font-size: 24px; margin-bottom: 10px;">Bạn không có quyền truy cập mã nguồn này!</p>
      <p style="font-size: 20px; margin-bottom: 10px;">Hành vi này đã được ghi lại và báo cáo.</p>
      <p style="font-size: 18px; margin-bottom: 30px;">Đang chuyển hướng...</p>
      <div style="font-size: 16px; text-align: center;">
        <p>© 2024 Hotel Management System</p>
        <p>All Rights Reserved</p>
      </div>
    </div>
  `;
  
  // Redirect after 3 seconds
  setTimeout(() => {
    window.location.href = 'https://google.com';
  }, 3000);
};

// Disable common shortcuts
export const disableShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+P
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'a' || e.key === 'p')) ||
      e.key === 'F5' ||
      (e.ctrlKey && e.key === 'r')
    ) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityWarning();
      return false;
    }
  });
};

// Obfuscate page content
export const obfuscateContent = () => {
  // Add fake elements to confuse scrapers
  const fakeElements = [
    '<div style="display:none;">FAKE_API_KEY_12345</div>',
    '<div style="display:none;">SECRET_TOKEN_ABCDEF</div>',
    '<div style="display:none;">DATABASE_URL_FAKE</div>',
    '<!-- This is not the real source code -->',
    '<!-- Protected by advanced obfuscation -->',
  ];
  
  fakeElements.forEach(element => {
    document.body.insertAdjacentHTML('beforeend', element);
  });
};

// Initialize advanced protection
export const initAdvancedProtection = () => {
  if (import.meta.env.PROD) {
    antiDebug();
    detectDevToolsAdvanced();
    disableShortcuts();
    obfuscateContent();
    
    // Override toString methods to hide function content
    Function.prototype.toString = function() {
      return 'function() { [Protected Code] }';
    };
    
    // Clear any existing console content
    console.clear();
    
    // Show warning in console
    console.log('%c🔒 PROTECTED SOURCE CODE 🔒', 'color: red; font-size: 24px; font-weight: bold; background: yellow; padding: 10px;');
    console.log('%cThis application is protected by copyright law.', 'color: red; font-size: 16px;');
    console.log('%cUnauthorized access or reproduction is prohibited.', 'color: red; font-size: 16px;');
    console.log('%c© 2024 Hotel Management System - All Rights Reserved', 'color: blue; font-size: 14px; font-weight: bold;');
  }
};