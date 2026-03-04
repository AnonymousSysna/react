'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('togglePassword');
    const tokenInput = document.getElementById('token');

    if (!toggleBtn || !tokenInput) return;

    toggleBtn.addEventListener('click', () => {
        const isMasked = tokenInput.type === 'password';
        tokenInput.type = isMasked ? 'text' : 'password';

        const icon = toggleBtn.querySelector('i');
        icon.classList.toggle('bi-eye', isMasked);
        icon.classList.toggle('bi-eye-slash', !isMasked);
        toggleBtn.setAttribute('aria-label', isMasked ? 'Hide token' : 'Show token');
    });
});
