import { PayloadBaseClass } from 'geoview-core/src/api/events/payloads';
import { EventStringId } from 'geoview-core/src/api/events/event-types';

/**
 * List of chart event names
 */
export const EVENT_CHART_CONFIG = 'geochart/config';
export const EVENT_CHART_LOAD = 'geochart/load';
export const EVENT_CHART_REDRAW = 'geochart/redraw';

/**
 * Extending the possible EventStringId to add Chart event types and provide such an event to via PayloadBaseClass's generic type
 */
export type EventStringIdGeoChart = EventStringId | typeof EVENT_CHART_CONFIG | typeof EVENT_CHART_LOAD | typeof EVENT_CHART_REDRAW;

/**
 * Class definition for PayloadBaseClassChart
 *
 * @exports
 * @class PayloadBaseClassChart
 * @extends PayloadBaseClass<EventStringIdGeoChart>
 */
export class PayloadBaseClassChart extends PayloadBaseClass<EventStringIdGeoChart> {}
