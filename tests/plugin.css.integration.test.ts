import path from "node:path";
import fs from "node:fs/promises";
import { describe, it, expect } from "vitest";
import { cssLayeringPlugin } from "../src/index";

function normalizeCss(css: string): string {
  return css.replace(/\s+/g, " ").trim();
}

describe("CSSLayeringPlugin CSS transformation integration", () => {
  const cases = [
    {
      name: "basic CSS file wrapping",
      fixture: "css-basic",
      cssFiles: ["styles.css"],
      layers: [{ name: "components", path: "**/styles.css" }],
    },
    {
      name: "exclude pattern",
      fixture: "css-exclude",
      cssFiles: ["styles.css", "styles.ignore.css"],
      layers: [
        { name: "components", path: "**/*.css", exclude: "**/*.ignore.css" },
      ],
    },
    {
      name: "multiple layers with different paths",
      fixture: "css-multi-layers",
      cssFiles: ["reset.css", "components.css"],
      layers: [
        { name: "base", path: "**/reset.css" },
        { name: "components", path: "**/components.css" },
      ],
    },
    {
      name: "preexisting layers without path",
      fixture: "css-preexisting-layer",
      cssFiles: ["styles.css"],
      layers: [
        { name: "preexisting" },
        { name: "components", path: "**/styles.css" },
      ],
    },
    {
      name: "non-matching path pattern",
      fixture: "css-no-match",
      cssFiles: ["plain.css"],
      layers: [{ name: "components", path: "**/styles.css" }],
    },
    {
      name: "@use line hoisting",
      fixture: "css-use-ordering",
      cssFiles: ["styles.css"],
      layers: [{ name: "components", path: "**/styles.css" }],
    },
    {
      name: "SCSS file handling",
      fixture: "css-scss",
      cssFiles: ["styles.scss"],
      layers: [{ name: "components", path: "**/*.scss" }],
    },
    {
      name: "complex SCSS with nesting and variables",
      fixture: "css-scss-complex",
      cssFiles: ["styles-complex.scss"],
      layers: [{ name: "components", path: "**/styles-complex.scss" }],
    },
    {
      name: "first matching layer wins",
      fixture: "css-multi-match",
      cssFiles: ["styles.css"],
      layers: [
        { name: "base", path: "**/styles.css" },
        { name: "components", path: "**/*.css" },
      ],
    },
    {
      name: "single layer applied to multiple files",
      fixture: "css-multi-file",
      cssFiles: ["one.css", "two.css"],
      layers: [{ name: "shared", path: "**/*.css" }],
    },
    {
      name: "array path patterns",
      fixture: "css-array-path",
      cssFiles: ["button.css", "input.scss"],
      layers: [
        { name: "components", path: ["**/button.css", "**/input.scss"] },
      ],
    },
    {
      name: "array exclude patterns",
      fixture: "css-array-exclude",
      cssFiles: ["app.css", "app.test.css", "app.spec.css"],
      layers: [
        {
          name: "components",
          path: "**/*.css",
          exclude: ["**/*.test.css", "**/*.spec.css"],
        },
      ],
    },
  ] as const;

  for (const testCase of cases) {
    const { name, fixture, cssFiles, layers } = testCase;

    it(name, async () => {
      const plugin = cssLayeringPlugin({ layers });

      const fixturesDir = path.join(__dirname, "fixtures", fixture);

      // Process each CSS file through the plugin
      for (const cssFile of cssFiles) {
        const inputPath = path.join(fixturesDir, cssFile);
        const expectedPath = path.join(fixturesDir, "expected", cssFile);

        const inputCss = await fs.readFile(inputPath, "utf8");
        const expectedCss = await fs.readFile(expectedPath, "utf8");

        // Simulate the plugin's transform hook
        const result = plugin.transform?.call(
          // @ts-expect-error - minimal mock context
          {},
          inputCss,
          inputPath,
        );

        // If transform returns null, the file wasn't modified
        const actualCss = result ? result.code : inputCss;

        expect(normalizeCss(actualCss)).toBe(normalizeCss(expectedCss));
      }
    });
  }
});
