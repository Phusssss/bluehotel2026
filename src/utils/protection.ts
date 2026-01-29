/**
 * Source code protection utilities
 */

// Disable right-click context menu
export const disableRightClick = () => {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showProtectionMessage();
  });
};

// Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
export const disableDevTools = () => {
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      showProtectionMessage();
      return false;
    }
    
    // Ctrl+Shift+I (Developer Tools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      showProtectionMessage();
      return false;
    }
    
    // Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      showProtectionMessage();
      return false;
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      showProtectionMessage();
      return false;
    }
    
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      showProtectionMessage();
      return false;
    }
  });
};

// Show protection message
const showProtectionMessage = () => {
  alert('⚠️ BẢO VỆ BẢN QUYỀN ⚠️\n\nBạn không có quyền sử dụng mã nguồn này.\nMã nguồn được bảo vệ bởi bản quyền.\n\n© 2024 Hotel Management System');
};

// Detect DevTools
export const detectDevTools = () => {
  let devtools = { open: false, orientation: null };
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
      if (!devtools.open) {
        devtools.open = true;
        showDevToolsWarning();
      }
    } else {
      devtools.open = false;
    }
  }, 500);
};

const showDevToolsWarning = () => {
  document.body.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      color: #ff0000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 24px;
      z-index: 999999;
    ">
      <h1>⚠️ CẢNH BÁO BẢO MẬT ⚠️</h1>
      <p>Bạn không có quyền truy cập mã nguồn này!</p>
      <p>Vui lòng đóng Developer Tools để tiếp tục.</p>
      <p style="font-size: 16px; margin-top: 20px;">
        © 2024 Hotel Management System - All Rights Reserved
      </p>
    </div>
  `;
};

// Disable text selection
export const disableTextSelection = () => {
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
  });
  
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });
  
  // Add CSS to disable text selection
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    
    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);
};

// Initialize all protection measures
export const initializeProtection = () => {
  // Only enable in production
  if (import.meta.env.PROD) {
    disableRightClick();
    disableDevTools();
    detectDevTools();
    disableTextSelection();
    
    // Clear console
    console.clear();
    
    // Override console methods
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    // Show copyright message in console
    setTimeout(() => {
      console.clear();
      console.log('%c⚠️ CẢNH BÁO BẢN QUYỀN ⚠️', 'color: red; font-size: 20px; font-weight: bold;');
      console.log('%cBạn không có quyền sử dụng mã nguồn này!', 'color: red; font-size: 16px;');
      console.log('%c© 2024 Hotel Management System - All Rights Reserved', 'color: blue; font-size: 14px;');
    }, 1000);
  }
};