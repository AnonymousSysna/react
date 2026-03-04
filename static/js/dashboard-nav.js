'use strict';

// Quick navigation highlighting + back-to-top behavior
document.addEventListener('DOMContentLoaded', () => {
    const links = Array.from(document.querySelectorAll('[data-section-link]'));
    const backToTop = document.getElementById('backToTop');
    const sections = links
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeId = `#${entry.target.id}`;
                links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === activeId));
            }
        });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0.2 });

    sections.forEach(section => observer.observe(section));

    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('show', window.scrollY > 260);
    });

    backToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
