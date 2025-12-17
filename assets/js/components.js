class AppNavbar extends HTMLElement {
    async connectedCallback() {
        // Determine root path
        const path = window.location.pathname;
        let rootPath = './';

        if (path.includes('/products/smartphone/') || path.includes('/products/watch/')) {
            rootPath = '../../';
        } else if (path.includes('/products/')) {
            rootPath = '../';
        }

        // 1. Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = `${rootPath}assets/css/navbar.css`;
        document.head.appendChild(cssLink);

        // 2. Fetch HTML
        try {
            const response = await fetch(`${rootPath}assets/components/navbar.html`);
            const html = await response.text();
            this.innerHTML = html;

            // 3. Adjust Links
            this.querySelectorAll('a').forEach(link => {


                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    link.setAttribute('href', rootPath + href);
                }
            });

        } catch (error) {
            console.error('Failed to load navbar:', error);
        }
    }
}


class AppFooter extends HTMLElement {
    async connectedCallback() {
        // Determine root path
        const path = window.location.pathname;
        let rootPath = './';

        if (path.includes('/products/smartphone/') || path.includes('/products/watch/')) {
            rootPath = '../../';
        } else if (path.includes('/products/')) {
            rootPath = '../';
        }

        // 1. Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = `${rootPath}assets/css/footer.css`;
        document.head.appendChild(cssLink);

        // 2. Fetch HTML
        try {
            const response = await fetch(`${rootPath}assets/components/footer.html`);
            const html = await response.text();
            this.innerHTML = html;

            // 3. Adjust Links
            this.querySelectorAll('a').forEach(link => {


                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    link.setAttribute('href', rootPath + href);
                }
            });

            // Re-init icons
            if (window.lucide) {
                window.lucide.createIcons();
            }

        } catch (error) {
            console.error('Failed to load footer:', error);
        }
    }
}

customElements.define('app-navbar', AppNavbar);
customElements.define('app-footer', AppFooter);
