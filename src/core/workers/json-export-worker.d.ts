import { AbstractWorker } from './abstract-worker';
import type { TypeWorkerExportChunk, TypeWorkerExportProjectionInfo } from './json-export-worker-script';
/**
 * How to create a new worker:
 *
 * 1. Define an interface for your worker's exposed methods (init, process and other is needed)
 * 2. Create a new class extending AbstractWorker (e.g. export class MyWorker extends AbstractWorker<MyWorkerType>)
 * 3. Create the actual worker script (my-worker-script.ts):
 * 4. Use your new worker in the main application:
 *    const myWorker = new MyWorker();
 *    const result1 = await myWorker.init('test');
 *    const result2 = await myWorker.process(42, true);
 */
/** Interface defining the methods exposed by the JSON export worker. */
interface JsonExportWorkerType {
    /**
     * Initializes the worker with projection information.
     *
     * @param projectionInfo - Object containing source and target CRS
     * @returns A promise that resolves when initialization is complete
     */
    init: (projectionInfo: TypeWorkerExportProjectionInfo) => Promise<void>;
    /**
     * Processes a chunk of data for JSON export.
     *
     * @param chunk - Array of data to process
     * @param isFirst - Whether this is the first chunk
     * @returns A promise that resolves to the processed JSON string
     */
    process: (chunk: TypeWorkerExportChunk[], isFirst: boolean) => Promise<string>;
}
/**
 * Worker class for JSON export operations.
 *
 * Extends AbstractWorker to handle JSON export operations in a separate thread.
 */
export declare class JsonExportWorker extends AbstractWorker<JsonExportWorkerType> {
    /**
     * Creates an instance of JsonExportWorker.
     */
    constructor();
    /**
     * Initializes the worker with projection information.
     *
     * @param projectionInfo - Object containing source and target CRS
     * @returns A promise that resolves when initialization is complete
     */
    init(projectionInfo: TypeWorkerExportProjectionInfo): Promise<void>;
    /**
     * Processes a chunk of data for JSON export.
     *
     * @param chunk - Array of data to process
     * @param isFirst - Whether this is the first chunk
     * @returns A promise that resolves to the processed JSON string
     */
    process(chunk: TypeWorkerExportChunk[], isFirst: boolean): Promise<string>;
}
export {};
//# sourceMappingURL=json-export-worker.d.ts.map