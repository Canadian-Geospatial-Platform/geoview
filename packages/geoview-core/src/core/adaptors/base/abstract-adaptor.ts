export class AbstractAdaptor {
  /** The map id used to retrace the associated store */
  #mapId: string;

  constructor(mapId: string) {
    this.#mapId = mapId;
  }

  getMapId(): string {
    return this.#mapId;
  }
}
