import { Style } from 'ol/style';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
/**
 * Creates or reuses an exportable total label with Drawer's rounded backing and downward pointer.
 *
 * @param feature - Owning feature, keeping equal labels at different locations independent
 * @param coordinate - Label anchor in map coordinates
 * @param label - Measurement text, with newlines separating perimeter and area
 * @param offsetY - Vertical offset in CSS pixels, preserving Measure's existing placement
 * @returns Backing and native text styles, in drawing order
 */
export declare function createMeasurementLabelStyles(feature: FeatureLike, coordinate: Coordinate, label: string, offsetY: number): Style[];
//# sourceMappingURL=measurement-label-style.d.ts.map