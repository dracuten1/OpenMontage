// Media + JSON module declarations for webpack-bundled imports.
// NOTE (session 2026-10-06): the sandbox blocked ALL writes under
// remotion-composer/public/** — music + reference photos are imported from their
// canonical homes under projects/vua-hung-trong-dong/assets/ instead of being
// mirrored into public/. staticFile() is still used for files already in public/.
declare module "*.mp3" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.json" {
  const value: any;
  export default value;
}
