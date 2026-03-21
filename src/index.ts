import { minimatch } from "minimatch";
import type { Plugin, IndexHtmlTransformResult } from "vite";

const DEFAULT_LAYER_ASSET_PATH = "/static/css/layers.css";
const PLUGIN_NAME = "vite-plugin-css-layering";

export interface Layer {
  path?: string | string[];
  exclude?: string | string[];
  name: string;
}

export interface CSSLayeringPluginOptions {
  layers: Layer[];
  nonce?: string;
  injectOrderAs?: "link" | "style" | "none";
  publicPath?: string;
}

/**
 * Wraps CSS source in a cascade layer, preserving @use statements at the top.
 */
function wrapSourceInLayer(source: string, layerName: string): string {
  const lines = source.split("\n");

  const useLines = lines.filter((line) => line.trim().startsWith("@use"));
  const otherLines = lines.filter((line) => !line.trim().startsWith("@use"));

  const useLinesString = useLines.join("\n");
  const otherLinesString = otherLines.join("\n");

  return `${useLinesString}\n@layer ${layerName} {\n ${otherLinesString} \n}`;
}

/**
 * Generates the @layer order declaration from configured layers.
 */
function getOrderDeclaration(layers: Layer[]): string {
  const order = layers.map((layer) => layer.name).join(", ");
  return `@layer ${order};`;
}

/**
 * Checks if a file path matches layer path patterns.
 */
function matchesLayer(
  filePath: string,
  layer: Layer,
): boolean {
  const { path, exclude } = layer;

  if (!path) {
    return false;
  }

  const pathMatches = Array.isArray(path)
    ? path.some((pattern) => minimatch(filePath, pattern))
    : minimatch(filePath, path);

  if (!pathMatches) {
    return false;
  }

  const isExcluded = exclude
    ? Array.isArray(exclude)
      ? exclude.some((pattern) => minimatch(filePath, pattern))
      : minimatch(filePath, exclude)
    : false;

  return !isExcluded;
}

/**
 * CSS Layering Plugin for Vite and Rollup.
 * 
 * Wraps CSS modules in named cascade layers based on glob patterns,
 * and injects the layer order declaration into HTML (Vite) or as a separate asset.
 */
export function cssLayeringPlugin(
  options: CSSLayeringPluginOptions,
): Plugin {
  const {
    layers,
    nonce,
    injectOrderAs = "style",
    publicPath = DEFAULT_LAYER_ASSET_PATH,
  } = options;

  if (!layers || layers.length === 0) {
    throw new Error(`${PLUGIN_NAME}: 'layers' option is required and must not be empty`);
  }

  const orderDeclaration = getOrderDeclaration(layers);
  const linkHref = publicPath;

  // Filter layers that have path patterns for CSS transformation
  const layersWithPaths = layers.filter((layer) => layer.path);

  return {
    name: PLUGIN_NAME,

    /**
     * Transform hook - intercepts CSS/SCSS files and wraps them in @layer blocks.
     * This is a standard Rollup hook, so it works in both Vite and pure Rollup.
     */
    transform(code: string, id: string) {
      // Only process CSS/SCSS files
      if (!/\.(sa|sc|c)ss$/.test(id)) {
        return null;
      }

      // Check each layer for a match
      for (const layer of layersWithPaths) {
        if (matchesLayer(id, layer)) {
          return {
            code: wrapSourceInLayer(code, layer.name),
            map: null,
          };
        }
      }

      return null;
    },

    /**
     * transformIndexHtml hook - injects layer order into HTML.
     * This is a Vite-specific hook and will be ignored in pure Rollup environments.
     */
    transformIndexHtml(): IndexHtmlTransformResult | undefined {
      if (injectOrderAs === "none") {
        return undefined;
      }

      if (injectOrderAs === "style") {
        return [
          {
            tag: "style",
            attrs: nonce ? { nonce } : {},
            children: orderDeclaration,
            injectTo: "head",
          },
        ];
      }

      // injectOrderAs === "link"
      return [
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            type: "text/css",
            href: linkHref,
          },
          injectTo: "head",
        },
      ];
    },

    /**
     * generateBundle hook - emits the layer order as a separate CSS asset when using link mode.
     * This is a standard Rollup hook, so it works in both Vite and pure Rollup.
     */
    generateBundle() {
      if (injectOrderAs === "link") {
        this.emitFile({
          type: "asset",
          fileName: linkHref.startsWith("/") ? linkHref.slice(1) : linkHref,
          source: orderDeclaration,
        });
      }
    },
  };
}

export default cssLayeringPlugin;
