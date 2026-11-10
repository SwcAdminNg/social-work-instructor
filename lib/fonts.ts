import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";

/** Display face for headings on the public site and sign-in pages. */
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

/** Italic serif used for the accent word inside a heading. */
export const accentFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

/** Class names that expose both font variables to a subtree. */
export const siteFonts = `${displayFont.variable} ${accentFont.variable}`;
