# Webpack vs Vite Plugin Comparison

This document outlines the key differences between the webpack and Vite implementations of the CSS layering plugin.

## Architecture Differences

### Webpack Plugin

**Two-part architecture:**
- **Plugin class** (`CSSLayeringPlugin`) - handles HTML injection and loader wiring
- **Separate loader** (`loader.ts`) - handles CSS transformation

**Why?** Webpack requires separate loaders for file transformation and plugins for compilation hooks.

### Vite Plugin

**Single plugin function:**
- Returns a plugin object with multiple hooks
- All logic (CSS transformation, HTML injection, asset emission) in one place

**Why?** Vite/Rollup plugins can handle both transformation and compilation hooks in the same plugin.

## Key Implementation Differences

| Feature | Webpack | Vite/Rollup |
|---------|---------|-------------|
| **Module system** | CommonJS | ESM |
| **CSS transformation** | Separate loader file | `transform` hook in plugin |
| **HTML injection** | `html-webpack-plugin` hooks | `transformIndexHtml` hook (Vite only) |
| **Asset emission** | `compilation.emitAsset()` | `this.emitFile()` |
| **Options validation** | JSON Schema + `validateSchema()` | Manual validation |
| **File matching** | `this.resourcePath` (loader context) | `id` parameter (file path) |

## Code Organization

### Webpack
```
src/
├── index.ts      # Plugin class
└── loader.ts     # Loader function + shared types
```

### Vite
```
src/
└── index.ts      # Plugin function + all logic
```

## Hook Mapping

| Purpose | Webpack | Vite/Rollup |
|---------|---------|-------------|
| CSS transformation | Custom loader | `transform` hook |
| HTML injection | `html-webpack-plugin` `beforeEmit` | `transformIndexHtml` hook |
| Asset emission | `compilation.hooks.processAssets` | `generateBundle` hook |

## Notable API Differences

### CSS Transformation

**Webpack (loader):**
```typescript
function loader(this: LoaderContext<Options>, source: string) {
  const filePath = this.resourcePath;
  // Match and transform
  return wrapSourceInLayer(source, layerName);
}
```

**Vite/Rollup (plugin hook):**
```typescript
transform(code: string, id: string) {
  if (!/\.(sa|sc|c)ss$/.test(id)) return null;
  // Match and transform
  return { code: wrapSourceInLayer(code, layerName), map: null };
}
```

### HTML Injection

**Webpack:**
```typescript
getHooks(compilation).beforeEmit.tapAsync(PLUGIN_NAME, (data, cb) => {
  data.html = data.html.replace("<head>", `<head>${styleTag}`);
  cb(null, data);
});
```

**Vite:**
```typescript
transformIndexHtml() {
  return [
    {
      tag: "style",
      children: orderDeclaration,
      injectTo: "head",
    },
  ];
}
```

### Asset Emission

**Webpack:**
```typescript
compilation.hooks.processAssets.tap({ 
  name: PLUGIN_NAME, 
  stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL 
}, () => {
  compilation.emitAsset(path, new sources.RawSource(content));
});
```

**Vite/Rollup:**
```typescript
generateBundle() {
  this.emitFile({
    type: "asset",
    fileName: path,
    source: content,
  });
}
```

## Compatibility Notes

### Webpack Plugin
- Works only with webpack 5.94.0+
- Requires `html-webpack-plugin` 5.6.0+
- CommonJS output for Node.js compatibility

### Vite Plugin
- Works with both Vite 5/6 and standalone Rollup
- HTML injection only works in Vite (gracefully degrades in Rollup)
- ESM output for modern JavaScript
- Vite peer dependency is optional (works in pure Rollup)

## Testing Differences

### Webpack
- Jest test runner
- `ts-jest` for TypeScript support
- Full webpack compilation in integration tests
- Tests generate actual HTML output

### Vite
- Vitest test runner (faster, ESM-native)
- Built-in TypeScript support
- Direct hook invocation with mock contexts
- Tests verify hook return values

## User Experience

Both plugins provide the same core functionality:
- Glob-based layer assignment
- Multiple path patterns per layer
- Exclude patterns
- `@use` statement preservation
- Three injection modes (`style`, `link`, `none`)
- CSP nonce support

The main difference is in configuration syntax (webpack plugin class vs Vite plugin function) and the underlying build tool requirements.
