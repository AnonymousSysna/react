'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const useProxyCheckbox = document.getElementById('useProxy');
    const proxyFields = document.getElementById('proxySettingsFields');
    const darkModeToggle = document.getElementById('darkMode');
    const testProxyBtn = document.getElementById('testProxyBtn');
    const resultSpan = document.getElementById('proxyTestResult');
    const currentTimeEl = document.getElementById('currentTime');

    // Proxy visibility toggle
    if (useProxyCheckbox && proxyFields) {
        const toggleProxyFields = () => {
            proxyFields.style.display = useProxyCheckbox.checked ? 'block' : 'none';
        };
        toggleProxyFields();
        useProxyCheckbox.addEventListener('change', toggleProxyFields);
    }

    // Dark mode preference persistence
    if (darkModeToggle && typeof applyDarkMode === 'function') {
        const syncDarkMode = () => {
            const isDarkMode = darkModeToggle.checked;
            localStorage.setItem('darkMode', isDarkMode);
            applyDarkMode(isDarkMode);
        };
        darkModeToggle.addEventListener('change', syncDarkMode);
    }

    // Proxy test handler with robust error display
    if (testProxyBtn && resultSpan) {
        testProxyBtn.addEventListener('click', async () => {
            const proxyMethod = document.getElementById('proxyMethod')?.value || '';
            const proxyServer = document.getElementById('proxyServer')?.value || '';
            const proxyAuth = document.getElementById('proxyAuth')?.value || '';
            const csrfToken = testProxyBtn.dataset.csrfToken || '';

            if (!proxyServer) {
                resultSpan.textContent = 'Please enter a proxy server address';
                resultSpan.className = 'ms-2 text-warning';
                return;
            }

            resultSpan.textContent = 'Testing...';
            resultSpan.className = 'ms-2 text-info';

            try {
                const response = await fetch('/test_proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ method: proxyMethod, server: proxyServer, auth: proxyAuth, csrf_token: csrfToken })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    resultSpan.textContent = `Proxy working! ${data.ip || ''}`.trim();
                    resultSpan.className = 'ms-2 text-success';
                } else {
                    resultSpan.textContent = `Proxy test failed: ${data.error || 'Unknown error'}`;
                    resultSpan.className = 'ms-2 text-danger';
                }
            } catch (error) {
                resultSpan.textContent = `Error testing proxy: ${error.message}`;
                resultSpan.className = 'ms-2 text-danger';
                console.error('Proxy test error:', error);
            }
        });
    }

    // Current time display
    if (currentTimeEl) {
        const updateTime = () => {
            currentTimeEl.textContent = new Date().toLocaleString();
        };
        updateTime();
        setInterval(updateTime, 1000);
    }
});
