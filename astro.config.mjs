import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// IMPORTANT for GitHub Pages project sites (https://<user>.github.io/<repo>/):
// `site` and `base` must match your GitHub username + repository name exactly,
// otherwise CSS/JS/images will 404 once deployed. See README.md "Deploying" section.
export default defineConfig({
  site: 'https://your-username.github.io',
  base: '/starbucks-data-hub',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()]
  }
});
