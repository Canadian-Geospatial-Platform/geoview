import { AbstractWorker } from './abstract-worker';

export abstract class AbstractWorkerPool<T> {
  protected workers: AbstractWorker<T>[] = [];

  protected busyWorkers = new Set<AbstractWorker<T>>();

  protected WorkerClass: new () => AbstractWorker<T>;

  protected name: string;

  constructor(name: string, workerClass: new () => AbstractWorker<T>, numWorkers = navigator.hardwareConcurrency || 4) {
    this.name = name;
    this.WorkerClass = workerClass;
    this.initializeWorkers(numWorkers);
  }

  protected initializeWorkers(numWorkers: number): void {
    for (let i = 0; i < numWorkers; i++) {
      const worker = new this.WorkerClass();
      this.workers.push(worker);
    }
  }

  public abstract init(): Promise<void>;

  public abstract process(params: unknown): Promise<unknown>;

  public terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.busyWorkers.clear();
  }
}
