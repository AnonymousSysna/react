# Checker — React Static Assets

This repository hosts the compiled static front-end assets for the **Checker** web application, built with [React](https://react.dev/) and [Vite](https://vitejs.dev/).

## Repository Structure

```
static/
├── css/                        # Page-specific and global stylesheets
│   ├── dark-theme.css          # Dark-mode theme variables and overrides
│   ├── dashboard.css           # Dashboard page styles
│   ├── goey-toast-fix.css      # Toast notification positioning fix
│   ├── history.css             # History page styles
│   ├── login.css               # Login page styles
│   ├── page-transitions.css    # Page transition animations
│   ├── settings.css            # Settings page styles
│   ├── statistic.css           # Statistic page styles
│   └── theme-overrides.css     # Global theme variable overrides
└── react/
    ├── index.html              # SPA entry point served by the backend
    ├── .vite/manifest.json     # Vite asset manifest (chunk → file mapping)
    └── assets/                 # Hashed JS bundles, CSS, and web fonts
        ├── index-*.js          # Main entry bundle (router + shared code)
        ├── index-*.css         # Global component styles
        ├── Login-*.js          # Login page chunk
        ├── Dashboard-*.js      # Dashboard page chunk
        ├── Settings-*.js       # Settings page chunk
        ├── History-*.js        # History page chunk
        ├── Statistic-*.js      # Statistic page chunk
        ├── TooManyAttempts-*.js# Rate-limit / lockout page chunk
        ├── NotFound-*.js       # 404 page chunk
        ├── Footer-*.js         # Shared Footer component chunk
        └── bootstrap-icons-*   # Bootstrap Icons web-font files
```

## Application Pages

| Page | Description |
|------|-------------|
| **Login** | User authentication |
| **Dashboard** | Main control panel |
| **Settings** | User/application configuration |
| **History** | Operation history log |
| **Statistic** | Usage statistics and charts |
| **TooManyAttempts** | Rate-limit / lockout screen |
| **NotFound** | 404 error page |

## Tasks You Can Perform on This Repository

### 1. Serve the Application
Point your web server (e.g., Nginx, Flask, Django, Express) to serve `static/` and route all requests to `static/react/index.html` for the SPA. Example with Python's built-in server:

```bash
cd static/react
python3 -m http.server 8080
# Then open http://localhost:8080
```

### 2. Update Stylesheets
Edit any file under `static/css/` to adjust colors, spacing, typography, or layout for a specific page without rebuilding the JavaScript bundles.

### 3. Update the Asset Manifest
If new bundles are deployed, update `static/react/.vite/manifest.json` to reflect the new chunk file names so the backend template can reference them correctly.

### 4. Swap or Patch JS Bundles
Replace any hashed bundle under `static/react/assets/` with a newly compiled version from the React source project, then update `manifest.json` accordingly.

### 5. Add / Modify Themes
Extend `static/css/dark-theme.css` or `static/css/theme-overrides.css` to introduce new colour schemes, CSS custom properties, or accessibility adjustments.

### 6. Integrate with a Backend
Wire `static/react/index.html` as the front-end entry point for a Python/Node/Go/etc. backend. The backend is responsible for:
- Serving all files under `static/` at `/static/`
- Returning `static/react/index.html` for all non-static routes so the React router can handle navigation.

### 7. Rebuild the Front-End (requires the source project)
If you have access to the React source project, you can rebuild the assets and copy the output here:

```bash
# Inside the React source project
npm install
npm run build
# Copy dist/ output into static/react/ in this repository
```

## Notes

- All JavaScript bundles are **minified and cache-busted** with content hashes in their filenames.
- The application uses **Bootstrap Icons** (web-font delivery).
- CSS is split into per-page files under `static/css/` (loaded by the backend template) and a global bundle under `static/react/assets/` (loaded by the SPA entry point).
