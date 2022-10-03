/** ******************************************************************************************************************************
 * interface used to define the vector types.
 */
export declare type TypeOfVector = 'polyline' | 'polygon' | 'circle' | 'circle_marker' | 'marker';
/** ******************************************************************************************************************************
 * interface used to define the vector type keys.
 */
export declare type TypeVectorKeys = 'POLYLINE' | 'POLYGON' | 'CIRCLE' | 'CIRCLE_MARKER' | 'MARKER';
/** ******************************************************************************************************************************
 * constant used to specify available vectors to draw.
 */
export declare const CONST_VECTOR_TYPES: Record<TypeVectorKeys, TypeOfVector>;
/** ******************************************************************************************************************************
 * Line,Polygon,Marker styles.
 */
export declare type TypeFeatureStyle = {
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
};
/** ******************************************************************************************************************************
 * Circle and Circle marker styles.
 */
export interface TypeFeatureCircleStyle extends TypeFeatureStyle {
    radius?: number;
}
