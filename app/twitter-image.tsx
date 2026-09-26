// Same preview picture for X / Discord's large card.
// (Settings like `revalidate` can't be re-exported, so they're written out here.)
export { default, alt, size, contentType } from "./opengraph-image";
export const revalidate = 3600;
