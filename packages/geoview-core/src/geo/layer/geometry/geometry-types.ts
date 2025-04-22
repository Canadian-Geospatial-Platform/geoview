/**
 * interface used to define the geometry types.
 */
export type TypeOfGeometry = 'polyline' | 'polygon' | 'circle' | 'marker';

/**
 * interface used to define the geometry type keys.
 */
export type TypeGeometryKeys = 'POLYLINE' | 'POLYGON' | 'CIRCLE' | 'MARKER';

/**
 * constant used to specify available geometry to draw.
 */
export const CONST_GEOMETRY_TYPES: Record<TypeGeometryKeys, TypeOfGeometry> = {
  POLYLINE: 'polyline',
  POLYGON: 'polygon' as TypeOfGeometry,
  CIRCLE: 'circle' as TypeOfGeometry,
  MARKER: 'marker' as TypeOfGeometry,
};

/**
 * Line, Polygon, Marker styles.
 */
export type TypeFeatureStyle = {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
};

/**
 * Marker icon styles.
 */
export type TypeIconStyle = {
  anchor?: number[];
  size?: number[];
  scale?: number;
  anchorXUnits?: string;
  anchorYUnits?: string;
  src: string;
};

/**
 * Circle and Circle marker styles.
 */
export interface TypeFeatureCircleStyle extends TypeFeatureStyle {
  radius?: number;
}
