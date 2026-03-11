import { describe, it, expect } from "vitest";
import { cssLayeringPlugin } from "../src/index";

const LAYER_ASSET_PATH = "/static/css/layers.css";

describe("CSSLayeringPlugin integration", () => {
  const layers = [{ name: "base" }, { name: "components" }];

  it("injects @layer order as a <style> tag by default", () => {
    const plugin = cssLayeringPlugin({ layers });

    const result = plugin.transformIndexHtml?.();

    expect(result).toBeDefined();
    expect(result?.[0].tag).toBe("style");
    expect(result?.[0].children).toBe("@layer base, components;");
  });

  it("injects a <link> tag when injectOrderAs='link'", () => {
    const publicPath = "/static/css/layers.css";
    const plugin = cssLayeringPlugin({
      layers,
      injectOrderAs: "link",
      publicPath,
    });

    const result = plugin.transformIndexHtml?.();

    expect(result).toBeDefined();
    expect(result?.[0].tag).toBe("link");
    expect(result?.[0].attrs).toEqual({
      rel: "stylesheet",
      type: "text/css",
      href: publicPath,
    });
  });

  it("injects style tag with nonce when nonce is provided", () => {
    const nonce = "test-nonce";
    const plugin = cssLayeringPlugin({
      layers,
      nonce,
    });

    const result = plugin.transformIndexHtml?.();

    expect(result).toBeDefined();
    expect(result?.[0].tag).toBe("style");
    expect(result?.[0].attrs).toEqual({ nonce });
    expect(result?.[0].children).toBe("@layer base, components;");
  });

  it("injects link tag with default publicPath when not provided", () => {
    const plugin = cssLayeringPlugin({
      layers,
      injectOrderAs: "link",
    });

    const result = plugin.transformIndexHtml?.();

    expect(result).toBeDefined();
    expect(result?.[0].tag).toBe("link");
    expect(result?.[0].attrs?.href).toBe(LAYER_ASSET_PATH);
  });

  it("does not inject order when injectOrderAs='none'", () => {
    const plugin = cssLayeringPlugin({
      layers,
      injectOrderAs: "none",
    });

    const result = plugin.transformIndexHtml?.();

    expect(result).toBeUndefined();
  });
});
