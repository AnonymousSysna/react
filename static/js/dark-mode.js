document.addEventListener('DOMContentLoaded', function() {
    // Check if darkMode value exists in localStorage
    const darkModeValue = localStorage.getItem('darkMode');
    
    // If value doesn't exist (new user) or is 'true', enable dark mode
    const darkModeEnabled = darkModeValue === null ? true : darkModeValue === 'true';
    
    const darkModeToggle = document.getElementById('darkMode');
    
    // Apply initial dark mode state
    if (darkModeToggle) {
        darkModeToggle.checked = darkModeEnabled;
    }
    
    applyDarkMode(darkModeEnabled);
    
    // Add event listener to toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            const isDarkMode = this.checked;
            localStorage.setItem('darkMode', isDarkMode);
            applyDarkMode(isDarkMode);
        });
    }
});

function applyDarkMode(enable) {
    const darkThemeLink = document.querySelector('link[href*="dark-theme.css"]');
    const lightThemeLink = document.querySelector('link[href*="light-theme.css"]');
    
    if (enable) {
        // Enable dark mode
        if (darkThemeLink) {
            darkThemeLink.disabled = false;
        } else {
            // If dark theme link doesn't exist, create it
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = darkThemeLink ? darkThemeLink.getAttribute('href') : '/static/css/dark-theme.css';
            document.head.appendChild(link);
        }
        
        // Disable light theme if it exists
        if (lightThemeLink) {
            lightThemeLink.disabled = true;
        }
        
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        // Enable light mode
        if (lightThemeLink) {
            lightThemeLink.disabled = false;
        } else {
            // If light theme doesn't exist yet, create it
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/static/css/light-theme.css';
            document.head.appendChild(link);
        }
        
        // Disable dark theme
        if (darkThemeLink) {
            darkThemeLink.disabled = true;
        }
        
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
}