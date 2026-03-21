import { defineConfig } from 'vite';
import { cssLayeringPlugin } from 'vite-plugin-css-layering';

export default defineConfig({
  plugins: [
    cssLayeringPlugin({
      layers: [
        // Reset layer - normalize CSS across browsers
        { path: '**/reset.css', name: 'reset' },
        
        // Base layer - fundamental styles
        { path: '**/base/**/*.css', name: 'base' },
        
        // Theme layer - design tokens and theming
        { path: '**/theme/**/*.css', name: 'theme' },
        
        // Component layer - reusable components
        { 
          path: '**/components/**/*.css',
          exclude: '**/components/**/*.module.css', // Exclude CSS modules
          name: 'components' 
        },
        
        // Layout layer - page layouts
        { path: '**/layouts/**/*.css', name: 'layouts' },
        
        // Utilities layer - utility classes (highest priority)
        { path: '**/utilities/**/*.css', name: 'utilities' },
      ],
      
      // Inject as inline <style> tag (default)
      injectOrderAs: 'style',
      
      // Optional: Add CSP nonce
      // nonce: 'your-csp-nonce',
      
      // Optional: Use separate CSS file instead
      // injectOrderAs: 'link',
      // publicPath: '/assets/layers.css',
    }),
  ],
});
