// Media + JSON module declarations for webpack-bundled imports.
// staticFile() is used for files in public/co-loa-no-than/.
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
