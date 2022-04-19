import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeMapConfigProps } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_RELOAD];

export const payloadIsAMapConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class MapConfigPayload extends PayloadBaseClass {
  handlerId: string;

  config: TypeMapConfigProps;

  constructor(event: EventStringId, handlerName: string | null, handlerId: string, config: TypeMapConfigProps) {
    if (!validEvents.includes(event)) throw new Error(`MapConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.handlerId = handlerId;
    this.config = config;
  }
}

export const mapConfigPayload = (
  event: EventStringId,
  handlerName: string | null,
  handlerId: string,
  config: TypeMapConfigProps
): MapConfigPayload => {
  return new MapConfigPayload(event, handlerName, handlerId, config);
};
