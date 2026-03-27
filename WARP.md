# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Environment and setup

- Use Node.js version **18 or newer** (see `package.json` `engines.node`).
- Install dependencies with your preferred package manager, for example:
  - `pnpm install`

### Build and type-check

- `pnpm run build` — compile TypeScript in `src/` to ESM JavaScript in `dist/` via `tsc` and `tsconfig.json`.
- `pnpm run clean` — remove the `dist/` directory before a fresh build.

### Linting and formatting

- `pnpm run lint` — run ESLint across the project.
- `pnpm run format` — format the codebase with Prettier.

### Tests

- `pnpm test` — build the plugin and run the Vitest test suite (Node test environment, tests under `tests/**/*.test.ts`).
- Run a single test file:
  - `pnpm vitest run tests/plugin.integration.test.ts`
  - `pnpm vitest run tests/plugin.css.integration.test.ts`

## Architecture overview

### High-level structure

This repository implements a **Vite plugin** that wraps CSS (and Sass) modules in named CSS cascade layers, driven by glob patterns. The project is written in TypeScript and compiled to ESM in `dist/` for publishing.

Key pieces:
- `src/index.ts` — main plugin implementation (`cssLayeringPlugin`) that exports a standard Vite plugin.
- `tests/plugin.integration.test.ts` — 5 tests for HTML injection behavior (matching webpack plugin).
- `tests/plugin.css.integration.test.ts` — 12 fixture-based tests for CSS transformation (matching webpack plugin).
- `tests/fixtures/` — Test fixtures copied from webpack plugin (input CSS/SCSS and expected outputs).
- `vitest.config.ts` — Vitest configuration.
- `tsconfig.json` — TypeScript compiler configuration targeting `dist/` with ESM output.

### Plugin Design (`src/index.ts`)

The `cssLayeringPlugin` function returns a Vite plugin object with three main hooks:

- **`transform` hook**
  - Intercepts CSS/SCSS files based on the `test: /\.(sa|sc|c)ss$/` pattern.
  - Uses `minimatch` to match file paths against configured layer patterns.
  - Wraps matching files in `@layer {name} { ... }` blocks via `wrapSourceInLayer`.
  - Preserves Sass `@use` statements at the top of files.

- **`transformIndexHtml` hook (Vite-specific)**
  - Injects the `@layer` order declaration into HTML `<head>`.
  - Behavior controlled by `injectOrderAs` option:
    - `"style"` (default): injects as a `<style>` tag with optional `nonce` attribute.
    - `"link"`: injects as a `<link>` tag pointing to the emitted CSS asset.
    - `"none"`: no HTML injection.

- **`generateBundle` hook**
  - When `injectOrderAs === "link"`, emits the layer order declaration as a separate CSS file.
  - Uses `this.emitFile()` to create the asset at the configured `publicPath`.

### Options and Configuration

- **Options interface (`CSSLayeringPluginOptions`)**:
  - `layers: Layer[]` (required) — array of layer configurations.
  - `nonce?: string` — CSP nonce for injected `<style>` tags.
  - `injectOrderAs?: "link" | "style" | "none"` — controls how the layer order is injected. Defaults to `"style"`.
  - `publicPath?: string` — path for the emitted CSS asset when using link mode. Defaults to `/static/css/layers.css`.

- **Layer interface**:
  - `name: string` (required) — the name of the CSS cascade layer.
  - `path?: string | string[]` (optional) — glob pattern(s) to match files for wrapping.
  - `exclude?: string | string[]` (optional) — glob pattern(s) to exclude files from wrapping.

### Core Functions

- **`wrapSourceInLayer(source, layerName)`**
  - Splits CSS source into lines.
  - Separates `@use` statements from other content.
  - Returns source with `@use` lines at the top and remaining content wrapped in `@layer {name} { ... }`.

- **`getOrderDeclaration(layers)`**
  - Generates a single `@layer` declaration from the layer names, e.g., `@layer reset, base, components;`.

- **`matchesLayer(filePath, layer)`**
  - Uses `minimatch` to check if a file path matches the layer's `path` pattern(s).
  - Applies `exclude` pattern(s) if specified.
  - Returns `false` if the layer has no `path` (used for layers that only appear in the order declaration).

### Tests and tooling

- **Vitest configuration (`vitest.config.ts`)**
  - Node test environment.
  - Includes test files under `tests/**/*.test.ts`.

- **Test suite (17 total tests matching webpack plugin exactly)**
  - **`tests/plugin.integration.test.ts`** (5 tests)
    - HTML injection as `<style>` tag (default)
    - HTML injection as `<link>` tag
    - Nonce attribute support
    - Default publicPath behavior
    - `injectOrderAs: 'none'` behavior
  - **`tests/plugin.css.integration.test.ts`** (12 tests)
    - Fixture-based tests comparing actual vs expected CSS transformations
    - Basic wrapping, exclude patterns, multiple layers
    - SCSS support with `@use` hoisting
    - Array path/exclude patterns
    - First-match-wins behavior

### TypeScript configuration (`tsconfig.json`)

- Targets modern JavaScript (`ES2022`) and ESNext modules.
- Emits declaration files and writes compiled output to `dist/`.
- Enables strict type-checking and common safety flags (`strict`, `noUnusedLocals`, `noUnusedParameters`, etc.).
- Includes only `src/**/*` in compilation; `tests/` are run directly by Vitest with built-in TypeScript support.

### Compatibility notes

- The plugin is designed for **Vite** environments.
