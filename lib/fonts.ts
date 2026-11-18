import { preload } from "react-dom";

/**
 * Site fonts are self-hosted (see app/fonts.css and public/fonts), so a build
 * never depends on reaching Google Fonts.
 */

/** Class that sets the body face (Roboto). */
export const bodyFont = "sw-font-body";

/** Class names that expose the display and accent font variables to a subtree. */
export const siteFonts = "sw-font-vars";

function preloadAll(files: string[]) {
  for (const href of files) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
}

/** Preload the body face's Latin file (every page). */
export function preloadBodyFont() {
  preloadAll(["/fonts/roboto-latin.woff2"]);
}

/** Preload the display and accent faces for layouts that use `siteFonts`. */
export function preloadSiteFonts() {
  preloadAll([
    "/fonts/bricolage-grotesque-latin.woff2",
    "/fonts/instrument-serif-latin.woff2",
    "/fonts/instrument-serif-latin-italic.woff2",
  ]);
}
