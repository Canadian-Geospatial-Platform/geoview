/**
 * This worker script is designed to be used with the FetchEsriWorker class.
 * It handles the transformation of fetch of features from ArcGIS server.
 *
 * The main operations are:
 * 1. Initialization: Set up the worker, empty for now.
 * 2. Processing: Fetch the server and return the JSON.
 */
/** Interface for ESRI query parameters. */
export interface QueryParams {
    /** The URL of the ESRI service endpoint. */
    url: string;
    /** The type of geometry being queried. */
    geometryType: string;
    /** Array of object IDs to query or 'all' for all features. */
    objectIds: number[] | 'all';
    /** Whether to include geometry in the query. */
    queryGeometry: boolean;
    /** The spatial reference ID for the output. */
    projection: number;
    /** The maximum allowable offset for geometry simplification. */
    maxAllowableOffset: number;
    /** The maximum number of records to return from service in one fetch. */
    maxRecordCount: number;
    /** The where clause for filtering features. */
    where: string;
}
declare const _default: typeof Worker & {
    new (): Worker;
};
export default _default;
//# sourceMappingURL=fetch-esri-worker-script.d.ts.map