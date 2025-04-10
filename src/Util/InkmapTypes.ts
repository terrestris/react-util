export interface WmsLayer {
  attribution?: string;
  layer: string;
  layerName?: string;
  legendUrl?: string;
  opacity?: number;
  tiled?: boolean;
  type: 'WMS';
  url: string;
}

export interface WmtsLayer {
  attribution?: string;
  format?: string;
  layer?: string;
  layerName?: string;
  legendUrl?: string;
  matrixSet?: string;
  opacity?: number;
  projection?: string;
  requestEncoding?: string;
  tileGrid?: any;
  type: 'WMTS';
  url: string;
}

export interface GeoJsonLayer {
  attribution?: string;
  geojson: any;
  layerName?: string;
  legendUrl?: string;
  style: any;
  type: 'GeoJSON';
}

export interface WfsLayer {
  attribution?: string;
  layer?: string;
  layerName?: string;
  legendUrl?: string;
  projection?: string;
  type: 'WFS';
  url: string;
}

export interface OsmLayer {
  attribution?: string;
  format?: string;
  geojson?: any;
  layer?: string;
  layerName?: string;
  legendUrl?: string;
  matrixSet?: string;
  opacity?: number;
  projection?: string;
  requestEncoding?: string;
  style?: any;
  tileGrid?: any;
  tiled?: boolean;
  type: 'XYZ';
  url: string;
}

export type InkmapLayer = WmsLayer | WmtsLayer | GeoJsonLayer | WfsLayer | OsmLayer;

export interface ScaleBarSpec {
  position: 'bottom-left' | 'bottom-right';
  units: string;
}

export interface InkmapProjectionDefinition {
  bbox: [number, number, number, number];
  name: string;
  proj4: string;
}

export interface InkmapPrintSpec {
  attributions: boolean | 'top-left' | 'bottom-left' | 'bottom-right' | 'top-right';
  center: [number, number];
  dpi: number;
  layers: InkmapLayer[];
  northArrow: boolean | string;
  projection: string;
  projectionDefinitions?: InkmapProjectionDefinition[];
  scale: number;
  scaleBar: boolean | ScaleBarSpec;
  size: [number, number] | [number, number, string];
}
