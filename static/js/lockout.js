'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('[data-lockout]');
    if (!card) return;

    const loginLink = document.getElementById('login-link');
    const countdownEl = document.getElementById('countdown');
    const progressCircle = document.getElementById('progress-circle');

    const lockoutUntilMs = Number(card.dataset.lockoutUntil) * 1000;
    const maxDuration = Number(card.dataset.remaining);
    const circumference = 2 * Math.PI * 35;
    progressCircle.style.strokeDasharray = circumference;

    const updateCountdown = () => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((lockoutUntilMs - now) / 1000));

        countdownEl.textContent = timeLeft;

        const progress = maxDuration > 0 ? timeLeft / maxDuration : 0;
        const dashOffset = circumference * (1 - progress);
        progressCircle.style.strokeDashoffset = dashOffset;

        if (timeLeft <= 0) {
            loginLink.classList.remove('disabled');
            loginLink.removeAttribute('aria-disabled');
            clearInterval(timer);
            window.location.href = loginLink.href;
        }
    };

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
});
