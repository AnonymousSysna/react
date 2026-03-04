document.addEventListener('DOMContentLoaded', function () {
    initPageTransitions();
 });
 
 function initPageTransitions() {
    ensureOverlay();
 
    // Wrap entire body content instead of just main content
    const bodyContent = document.createElement('div');
    bodyContent.className = 'page-container page-enter';
    
    // Move all direct children of body into the container
    while (document.body.firstChild) {
        bodyContent.appendChild(document.body.firstChild);
    }
    
    // Add the container back to body
    document.body.appendChild(bodyContent);
    
    // Trigger enter animation
    setTimeout(() => {
        bodyContent.classList.add('page-enter-active');
    }, 10);
 
    // Handle all internal link clicks
    document.addEventListener('click', function (event) {
        const link = event.target.closest('a');
        if (!link) return;
 
        // Skip if it's an external link, has a specific target, or is a download
        if (
            link.hostname !== window.location.hostname ||
            link.target === '_blank' ||
            link.hasAttribute('download') ||
            link.href.startsWith('javascript:') ||
            link.href.includes('#')
        ) {
            return;
        }
 
        // Handle internal navigation
        event.preventDefault();
        navigateToPage(link.href);
    });
 
    // Also handle form submissions with smooth transitions
    document.addEventListener('submit', function (event) {
        const form = event.target;
 
        // Skip AJAX forms or forms with specific targets
        if (form.hasAttribute('data-ajax') || form.target === '_blank') {
            return;
        }
 
        // Show loading state for POST forms
        if (form.method.toLowerCase() === 'post') {
            showLoading();
            // Let the form submit normally
            return;
        }
 
        // For GET forms, handle like page navigation
        event.preventDefault();
        const formData = new FormData(form);
        const queryString = new URLSearchParams(formData).toString();
        const url = form.action + (form.action.includes('?') ? '&' : '?') + queryString;
 
        navigateToPage(url);
    });
 
    // Initialize history state
    window.history.replaceState({
        url: window.location.href,
        title: document.title,
        scrollPos: [window.scrollX, window.scrollY]
    }, document.title, window.location.href);
 
    // Handle browser back/forward navigation
    window.addEventListener('popstate', function (event) {
        if (event.state) {
            navigateToPage(event.state.url, false);
        }
    });
 }
 
 function navigateToPage(url, pushState = true) {
    // Show loading overlay
    showLoading();
 
    // Store the admin status before transition - check multiple indicators
    const isAdmin = document.body.hasAttribute('data-is-admin') ||
        document.querySelector('.nav-item .nav-link:has(.bi-star-fill)') !== null || 
        document.querySelector('.nav-item span.nav-link .bi-star-fill') !== null;
 
    // Start page exit animation
    const pageContainer = document.querySelector('.page-container');
    if (pageContainer) {
        pageContainer.classList.remove('page-enter-active');
        pageContainer.classList.add('page-exit', 'page-exit-active');
    }
 
    // Wait for exit animation to complete
    setTimeout(() => {
        // Fetch the new page content
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(html => {
                // Parse the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
 
                // Update the title
                document.title = doc.title;
 
                // Update the page content
                const newContent = doc.body;
                if (newContent && pageContainer) {
                    // Replace content
                    pageContainer.innerHTML = newContent.innerHTML;
                    ensureOverlay();
 
                    // Reset classes for enter animation
                    pageContainer.classList.remove('page-exit', 'page-exit-active');
                    pageContainer.classList.add('page-enter');
 
                    // Load and execute any scripts from the new page
                    const oldScripts = Array.from(doc.querySelectorAll('script:not([src])'));
                    oldScripts.forEach(oldScript => {
                        const newScript = document.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                        newScript.textContent = oldScript.textContent;
                        document.body.appendChild(newScript);
                    });
 
                    // Preserve admin status if it was set before
                    if (isAdmin) {
                        document.body.setAttribute('data-is-admin', 'true');
 
                        // Show admin elements that might be hidden
                        updateAdminVisibility(true);
                    }
 
                    // Trigger enter animation after a small delay
                    setTimeout(() => {
                        pageContainer.classList.add('page-enter-active');
                        hideLoading();

                        // Run page-specific initialization functions
                        initPageSpecificFunctions();
                        updateActiveNav();
                    }, 10);
                } else {
                    // Fallback if we can't find the content container
                    window.location.href = url;
                    return;
                }
 
                // Update browser history if needed
                if (pushState) {
                    window.history.pushState({
                        url: url,
                        title: document.title,
                        scrollPos: [0, 0],
                        isAdmin: isAdmin
                    }, document.title, url);
                }
 
                // Scroll to top
                window.scrollTo(0, 0);
 
                // Reinitialize any scripts that need to be run on the new page
                reinitializeScripts();
            })
            .catch(error => {
                console.error('Failed to load page:', error);
                // Fallback to traditional navigation
                window.location.href = url;
            });
    }, 300); // Match this timing with CSS transition duration
 }
 
 function updateAdminVisibility(isAdmin) {
    // Update admin sections visibility based on admin status
    if (isAdmin) {
        // Show admin-only elements
        const expressvpnTab = document.getElementById('expressvpn-tab');
        if (expressvpnTab) {
            expressvpnTab.style.display = '';
            const expressvpnSettings = document.getElementById('expressvpn-settings');
            if (expressvpnSettings) expressvpnSettings.style.display = '';
        }
 
        // Add admin indicator in navbar if not present
        const navbarNav = document.querySelector('#navbarNav .navbar-nav');
        if (navbarNav) {
            let adminIndicator = navbarNav.querySelector('.nav-item span.nav-link:has(.bi-star-fill)');
            if (!adminIndicator) {
                // Create admin indicator if not present
                const settingsLink = navbarNav.querySelector('.nav-item .nav-link[href*="settings"]');
                if (settingsLink) {
                    const adminItem = document.createElement('li');
                    adminItem.className = 'nav-item';
                    adminItem.innerHTML = '<span class="nav-link"><i class="bi bi-star-fill text-warning me-1"></i>Admin</span>';
                    navbarNav.insertBefore(adminItem, settingsLink.parentNode.nextSibling);
                }
            }
        }
 
        // Add admin flag to test mode toggle if on dashboard
        const testModeToggle = document.getElementById('testModeToggle');
        if (testModeToggle) {
            testModeToggle.parentElement.style.display = '';
        }
    }
 }
 
 function showLoading() {
    const overlay = document.querySelector('.page-loading-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
 }
 
 function hideLoading() {
    const overlay = document.querySelector('.page-loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function ensureOverlay() {
    if (!document.querySelector('.page-loading-overlay')) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'page-loading-overlay';
        loadingOverlay.innerHTML = '<div class="page-loading-spinner"></div>';
        document.body.appendChild(loadingOverlay);
    }
}

function initPageSpecificFunctions() {
    // Check what page we're on and run appropriate initialization
    if (document.getElementById('gatesDropdown')) {
        // We're on the dashboard page
        if (typeof init === 'function') {
            init();
        }
    }
 
    // Apply admin status from storage if needed
    const isAdmin = document.body.hasAttribute('data-is-admin');
    if (isAdmin) {
        updateAdminVisibility(true);
    }
 
    // Check for settings page elements
    const expressvpnTab = document.getElementById('expressvpn-tab');
    if (expressvpnTab && isAdmin) {
        // We're on the settings page with ExpressVPN tab
        if (typeof getExpressVPNStatus === 'function') {
            getExpressVPNStatus();
        }
    }
 
    // Initialize test proxy button if on settings page
    const testProxyBtn = document.getElementById('testProxyBtn');
    if (testProxyBtn) {
        testProxyBtn.addEventListener('click', function () {
            const proxyMethod = document.getElementById('proxyMethod').value;
            const proxyServer = document.getElementById('proxyServer').value;
            const proxyAuth = document.getElementById('proxyAuth').value;
            const resultSpan = document.getElementById('proxyTestResult');
 
            if (!proxyServer) {
                resultSpan.textContent = 'Please enter a proxy server address';
                resultSpan.className = 'ms-2 text-warning';
                return;
            }
 
            // Show loading indicator
            resultSpan.textContent = 'Testing...';
            resultSpan.className = 'ms-2 text-info';
 
            // Get CSRF token from the page
            const csrfToken = document.getElementById('csrf_token') ?
                document.getElementById('csrf_token').value : '';
 
            // Make AJAX request to test proxy
            fetch('/test_proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    method: proxyMethod,
                    server: proxyServer,
                    auth: proxyAuth,
                    csrf_token: csrfToken
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        resultSpan.textContent = 'Proxy working! ' + data.ip;
                        resultSpan.className = 'ms-2 text-success';
                    } else {
                        resultSpan.textContent = 'Proxy test failed: ' + data.error;
                        resultSpan.className = 'ms-2 text-danger';
                    }
                })
                .catch(error => {
                    resultSpan.textContent = 'Error testing proxy';
                    resultSpan.className = 'ms-2 text-danger';
                    console.error('Error:', error);
                });
        });
    }
 
 
 
    // Re-initialize dark mode toggle
    const darkModeToggle = document.getElementById('darkMode');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function () {
            const isDarkMode = this.checked;
            localStorage.setItem('darkMode', isDarkMode);
            if (typeof applyDarkMode === 'function') {
                applyDarkMode(isDarkMode);
            }
        });
    }
 }
 
 function reinitializeScripts() {
    // Reinitialize any scripts that were bound to the previous DOM elements
 
    // Re-bind any click handlers on specific elements
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');
 
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            }
        });
    });
 
    // Reinitialize Bootstrap components
    if (typeof bootstrap !== 'undefined') {
        // Reinitialize nav tabs if present
        const tabElements = document.querySelectorAll('[data-bs-toggle="tab"]');
        if (tabElements.length > 0) {
            tabElements.forEach(tab => {
                new bootstrap.Tab(tab);
            });
        }
 
        // Reinitialize tooltips
        const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        if (tooltipElements.length > 0) {
            tooltipElements.forEach(tooltip => {
                new bootstrap.Tooltip(tooltip);
            });
        }
 
        // Reinitialize dropdowns
        const dropdownElements = document.querySelectorAll('.dropdown-toggle');
        if (dropdownElements.length > 0) {
            dropdownElements.forEach(dropdown => {
                new bootstrap.Dropdown(dropdown);
            });
        }
    }
 
    // Update current time if that function exists
    if (typeof updateTime === 'function') {
        updateTime();
    }
 
    // Run page-specific initialization
    initPageSpecificFunctions();
}

function updateActiveNav() {
    const current = window.location.pathname;
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        if (link.getAttribute('href') === current) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

 // Initialize admin status when the page first loads
 document.addEventListener('DOMContentLoaded', function () {
    // Check if admin badge exists in the navbar
    const adminBadge = document.querySelector('.nav-item span.nav-link:has(.bi-star-fill)');
    if (adminBadge) {
        document.body.setAttribute('data-is-admin', 'true');
    }
 
    // Alternative check for admin status via is_admin in settings
    const isAdminElement = document.querySelector('[data-is-admin="true"]');
    if (isAdminElement) {
        document.body.setAttribute('data-is-admin', 'true');
    }
 });
