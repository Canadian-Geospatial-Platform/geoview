import { SerializedGeometry } from '@/api/types/map-schema-types';
/**
 * This worker script is designed to be used with the JsonExportWorker class.
 * It handles the transformation of GeoJSON features from one coordinate system to another.
 *
 * The main operations are:
 * 1. Initialization: Set up the source and target coordinate reference systems.
 * 2. Processing: Transform chunks of GeoJSON features, converting their geometries.
 *
 * The worker uses proj4 for coordinate transformations and includes a custom
 * definition for the EPSG:3978 projection.
 */
export type TypeWorkerExportChunk = {
    geometry: SerializedGeometry;
    properties: {
        [k: string]: unknown;
    };
};
export type TypeWorkerExportProjectionInfo = {
    sourceCRS: string;
    targetCRS: string;
};
declare const _default: typeof Worker & {
    new (): Worker;
};
export default _default;
//# sourceMappingURL=json-export-worker-script.d.ts.map