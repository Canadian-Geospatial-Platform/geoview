/**
 * This worker script is designed to be used with the FetchEsriWorker class.
 * It handles the transformation of fetch of features from ArcGIS server.
 *
 * The main operations are:
 * 1. Initialization: Set up the worker, empty for now.
 * 2. Processing: Fetch the server and return the JSON.
 */
/**
 * Interface for ESRI query parameters
 * @interface QueryParams
 * @property {string} url - The URL of the ESRI service endpoint
 * @property {string} geometryType - The type of geometry being queried
 * @property {number[]} objectIds - Array of object IDs to query
 * @property {boolean} queryGeometry - Whether to include geometry in the query
 * @property {number} projection - The spatial reference ID for the output
 * @property {number} maxAllowableOffset - The maximum allowable offset for geometry simplification
 * @property {number} maxRecordCount - The maximum number of records to return from service in one fetch
 */
export interface QueryParams {
    url: string;
    geometryType: string;
    objectIds: number[] | 'all';
    queryGeometry: boolean;
    projection: number;
    maxAllowableOffset: number;
    maxRecordCount: number;
}
declare const _default: typeof Worker & {
    new (): Worker;
};
export default _default;
//# sourceMappingURL=fetch-esri-worker-script.d.ts.map