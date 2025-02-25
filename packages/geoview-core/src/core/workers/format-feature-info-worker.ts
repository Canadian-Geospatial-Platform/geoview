import Feature from 'ol/Feature';
import { AbstractWorker } from './abstract-worker';
import Worker from './format-feature-info-worker-script';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';

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

/**
 * Interface defining the methods exposed by the format feature info worker.
 */
export interface FormatFeatureInfoWorkerType {
  /**
   * Initializes the worker - empty for now.
   */
  init: () => Promise<void>;

  /**
   * Processes formatting of features.
   * @param {Feature[]} features - The features to format into feature info.
   * @param {AbstractGVLayer} layer - the layer
   * @returns A promise that resolves to the formatted feature info.
   */
  process: (features: Feature[], layer: AbstractGVLayer) => Promise<TypeFeatureInfoEntry[] | undefined | null>;
}

/**
 * Class representing a format feature info worker.
 * Extends AbstractWorker to handle formatting of features.
 */
export class FormatFeatureInfoWorker extends AbstractWorker<FormatFeatureInfoWorkerType> {
  /**
   * Creates an instance of FormatFeatureInfoWorker.
   * Initializes the worker with the 'format-feature-info' script.
   */
  constructor() {
    super('FormatFeatureInfoWorker', new Worker());
  }

  /**
   * Initializes the worker - empty for now.
   * @returns A promise that resolves when initialization is complete.
   */
  public init(): Promise<void> {
    return this.proxy.init();
  }

  /**
   * Processes a formatting of features.
   * @param {Feature[]} features - The features to format into feature info.
   * @param {AbstractGVLayer} layer - the layer
   * @returns A promise that resolves to the formatted feature info.
   */
  public process(features: Feature[], layer: AbstractGVLayer): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    return this.proxy.process(features, layer);
  }
}
