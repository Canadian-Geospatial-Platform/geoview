import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the FEATURE_HIGHLIGHT category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the FEATURE_HIGHLIGHT category */
export type FeatureHighlightEventKey = 'EVENT_HIGHLIGHT_FEATURE' | 'EVENT_HIGHLIGHT_CLEAR' | 'EVENT_HIGHLIGHT_BBOX';
/** Record that associates FEATURE_HIGHLIGHT's event keys to their event string id */
export declare const FEATURE_HIGHLIGHT: Record<FeatureHighlightEventKey, EventStringId>;
