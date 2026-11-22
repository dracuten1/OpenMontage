declare module "d3-geo" {
  export type GeoCoordinates = [number, number];

  export interface GeoGeometryObject {
    type: string;
    coordinates?: unknown;
    geometries?: GeoGeometryObject[];
  }

  export interface GeoFeature<P = Record<string, unknown>> {
    type: "Feature";
    id?: string | number;
    properties: P | null;
    geometry: GeoGeometryObject;
  }

  export interface GeoFeatureCollection<P = Record<string, unknown>> {
    type: "FeatureCollection";
    features: Array<GeoFeature<P>>;
  }

  export type GeoPermissibleObjects =
    | GeoGeometryObject
    | GeoFeature
    | GeoFeatureCollection;

  export interface GeoProjection {
    (point: GeoCoordinates): [number, number] | null;
    center(): GeoCoordinates;
    center(point: GeoCoordinates): this;
    scale(): number;
    scale(scale: number): this;
    translate(): [number, number];
    translate(point: [number, number]): this;
    clipExtent(): [[number, number], [number, number]] | null;
    clipExtent(extent: [[number, number], [number, number]] | null): this;
    precision(precision: number): this;
    fitExtent(extent: [[number, number], [number, number]], object: GeoPermissibleObjects): this;
    fitSize(size: [number, number], object: GeoPermissibleObjects): this;
  }

  export interface GeoPath {
    (object: GeoPermissibleObjects): string | null;
    projection(): GeoProjection | null;
    projection(projection: GeoProjection | null): this;
    centroid(object: GeoPermissibleObjects): [number, number];
    bounds(object: GeoPermissibleObjects): [[number, number], [number, number]];
  }

  export function geoMercator(): GeoProjection;
  export function geoNaturalEarth1(): GeoProjection;
  export function geoEquirectangular(): GeoProjection;
  export function geoPath(projection?: GeoProjection | null): GeoPath;
  export function geoGraticule10(): GeoGeometryObject;
  export function geoInterpolate(
    a: GeoCoordinates,
    b: GeoCoordinates,
  ): (t: number) => GeoCoordinates;
  export function geoArea<P = Record<string, unknown>>(
    object: GeoPermissibleObjects | GeoFeature<P> | GeoFeatureCollection<P>,
  ): number;
}

declare module "topojson-client" {
  import type { GeoFeature, GeoFeatureCollection, GeoGeometryObject } from "d3-geo";

  export interface TopoGeometryObject<P = Record<string, unknown>> {
    type: string;
    id?: string | number;
    properties?: P;
    arcs?: unknown;
    geometries?: Array<TopoGeometryObject<P>>;
  }

  export interface Topology<
    Objects extends Record<string, TopoGeometryObject> = Record<string, TopoGeometryObject>,
  > {
    type: string;
    objects: Objects;
    arcs: number[][][];
    transform?: { scale: number[]; translate: number[] };
    bbox?: number[];
  }

  export function feature<P = Record<string, unknown>>(
    topology: Topology,
    object: TopoGeometryObject<P>,
  ): GeoFeatureCollection<P> | GeoFeature<P>;

  export function mesh(
    topology: Topology,
    object?: TopoGeometryObject,
    filter?: (a: TopoGeometryObject, b: TopoGeometryObject) => boolean,
  ): GeoGeometryObject;
}

declare module "world-atlas/*.json" {
  import type { Topology, TopoGeometryObject } from "topojson-client";

  export interface CountryProps {
    name?: string;
  }

  const atlas: Topology<{
    countries: TopoGeometryObject<CountryProps>;
    land: TopoGeometryObject<Record<string, unknown>>;
  }>;
  export default atlas;
}
