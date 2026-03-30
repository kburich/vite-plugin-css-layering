# CSS Layering Plugin for Vite

A Vite plugin that automatically wraps CSS in named [CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) based on glob patterns, helping you manage CSS specificity and organization.

## Features

- 🎯 **Glob-based layer assignment** - Automatically wrap CSS files in layers based on path patterns
- 📝 **Automatic layer order injection** - Injects `@layer` order declaration into HTML
- 🎨 **Sass/SCSS support** - Preserves `@use` statements at the top of files
- ⚡ **Zero runtime overhead** - All transformations happen at build time
- 🛡️ **TypeScript support** - Full type definitions included

## Why CSS Cascade Layers?

CSS Cascade Layers provide a way to organize CSS with explicit specificity control:

- **Better organization** - Group related styles together
- **Specificity control** - Layer order determines precedence, not specificity
- **Easier overrides** - Later layers override earlier ones, regardless of selector specificity
- **Framework integration** - Cleanly separate third-party, base, component, and utility styles

Learn more: [MDN: CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)

## Installation

```bash
pnpm add vite-plugin-css-layering
# or
npm install vite-plugin-css-layering
# or
yarn add vite-plugin-css-layering
```

## Usage

### Vite

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { cssLayeringPlugin } from 'vite-plugin-css-layering';

export default defineConfig({
  plugins: [
    cssLayeringPlugin({
      layers: [
        { path: '**/reset.css', name: 'reset' },
        { path: '**/base/**/*.css', name: 'base' },
        { path: '**/components/**/*.css', name: 'components' },
        { path: '**/utilities/**/*.css', name: 'utilities' },
      ],
    }),
  ],
});
```

## Configuration

### Options

```typescript
interface CSSLayeringPluginOptions {
  layers: Layer[];
  nonce?: string;
  injectOrderAs?: 'link' | 'style' | 'none';
  publicPath?: string;
}

interface Layer {
  path?: string | string[];
  exclude?: string | string[];
  name: string;
}
```

#### `layers` (required)

Array of layer configurations. Each layer can specify:

- **`name`** (required) - The name of the CSS cascade layer
- **`path`** (optional) - Glob pattern(s) to match files. Files matching this pattern will be wrapped in the layer. Uses [minimatch](https://github.com/isaacs/minimatch) for pattern matching.
- **`exclude`** (optional) - Glob pattern(s) to exclude files from wrapping

**Example:**

```typescript
layers: [
  // Wrap all CSS files in components directory
  { path: '**/components/**/*.css', name: 'components' },
  
  // Multiple patterns
  { path: ['**/ui/**/*.css', '**/widgets/**/*.css'], name: 'ui' },
  
  // Exclude specific files
  {
    path: '**/legacy/**/*.css',
    exclude: '**/legacy/vendor/**',
    name: 'legacy'
  },
  
  // Layer without path (only appears in order declaration)
  { name: 'third-party' }
]
```

#### `injectOrderAs`

Controls how the `@layer` order declaration is injected:

- **`'style'`** (default) - Injects as a `<style>` tag in HTML `<head>` (Vite only)
- **`'link'`** - Emits as a separate CSS file and injects a `<link>` tag
- **`'none'`** - No injection; you must manually add the layer order

**Example output:**

```html
<!-- injectOrderAs: 'style' -->
<head>
  <style>@layer reset, base, components, utilities;</style>
</head>

<!-- injectOrderAs: 'link' -->
<head>
  <link rel="stylesheet" type="text/css" href="/static/css/layers.css">
</head>
```

#### `nonce`

Optional Content Security Policy nonce for the injected `<style>` tag (only used when `injectOrderAs: 'style'`).

```typescript
cssLayeringPlugin({
  layers: [...],
  nonce: 'random-nonce-value',
})
```

#### `publicPath`

Custom path for the emitted layer order CSS file (only used when `injectOrderAs: 'link'`).

Default: `/static/css/layers.css`

```typescript
cssLayeringPlugin({
  layers: [...],
  injectOrderAs: 'link',
  publicPath: '/assets/layers.css',
})
```

## How It Works

### CSS Transformation

When a CSS file matches a layer's `path` pattern:

**Input** (`src/components/Button.css`):
```css
.button {
  color: blue;
}
```

**Output** (with `{ path: '**/components/**/*.css', name: 'components' }`):
```css
@layer components {
  .button {
    color: blue;
  }
}
```

### Sass/SCSS Support

The plugin preserves `@use` statements at the top of files:

**Input**:
```scss
@use 'sass:math';
@use 'variables';

.button {
  color: $primary;
}
```

**Output**:
```scss
@use 'sass:math';
@use 'variables';

@layer components {
  .button {
    color: $primary;
  }
}
```

### Layer Order Declaration

The plugin automatically generates and injects a layer order declaration based on your configuration:

```typescript
layers: [
  { name: 'reset' },
  { name: 'base' },
  { name: 'components' },
  { name: 'utilities' },
]
```

Generates:
```css
@layer reset, base, components, utilities;
```

## Advanced Examples

### Framework-specific organization

```typescript
cssLayeringPlugin({
  layers: [
    { path: '**/node_modules/**/*.css', name: 'vendor' },
    { path: '**/reset.css', name: 'reset' },
    { path: '**/theme/**/*.css', name: 'theme' },
    { path: '**/components/**/*.css', name: 'components' },
    { path: '**/pages/**/*.css', name: 'pages' },
    { path: '**/utilities/**/*.css', name: 'utilities' },
  ],
})
```

### Excluding specific patterns

```typescript
cssLayeringPlugin({
  layers: [
    {
      path: '**/components/**/*.css',
      exclude: ['**/components/**/*.module.css', '**/components/legacy/**'],
      name: 'components',
    },
  ],
})
```

### Pre-existing layers

If you have manually created layers in your CSS, you can include them in the order declaration without transforming files:

```typescript
cssLayeringPlugin({
  layers: [
    { name: 'manual-layer' }, // No path - only in order declaration
    { path: '**/auto/**/*.css', name: 'auto-layer' },
  ],
})
```

## Browser Support

CSS Cascade Layers are supported in all modern browsers:
- Chrome 99+
- Firefox 97+
- Safari 15.4+
- Edge 99+

For older browsers, consider using a CSS post-processor or polyfill.

## Disclaimer

This plugin was created by porting my [css-layering-webpack-plugin](https://github.com/kburich/css-layering-webpack-plugin) to Vite using AI agents powered by [Warp](https://www.warp.dev/).

## License

MIT

## Related Projects

- [css-layering-webpack-plugin](https://github.com/kburich/css-layering-webpack-plugin) - Webpack version of this plugin
- [vite-plugin-css-layering](https://github.com/kburich/vite-plugin-css-layering) - This plugin on GitHub
