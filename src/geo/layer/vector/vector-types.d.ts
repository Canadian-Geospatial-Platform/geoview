/** ******************************************************************************************************************************
 * interface used to define the vector types.
 */
export type TypeOfVector = 'polyline' | 'polygon' | 'circle' | 'marker';
/** ******************************************************************************************************************************
 * interface used to define the vector type keys.
 */
export type TypeVectorKeys = 'POLYLINE' | 'POLYGON' | 'CIRCLE' | 'MARKER';
/** ******************************************************************************************************************************
 * constant used to specify available vectors to draw.
 */
export declare const CONST_VECTOR_TYPES: Record<TypeVectorKeys, TypeOfVector>;
/** ******************************************************************************************************************************
 * Line,Polygon,Marker styles.
 */
export type TypeFeatureStyle = {
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
};
/** ******************************************************************************************************************************
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
/** ******************************************************************************************************************************
 * Circle and Circle marker styles.
 */
export interface TypeFeatureCircleStyle extends TypeFeatureStyle {
    radius?: number;
}
