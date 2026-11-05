import { Point } from 'ol/geom';
import { Fill, Style, Text } from 'ol/style';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import type { RenderFunction } from 'ol/style/Style';

import { GEOVIEW_SHAPE } from '@/ui/style/default';
import { logger } from '@/core/utils/logger';

/** Canvas equivalents of the Drawer measurement tooltip CSS, independent of the display theme. */
const TOTAL_LABEL_STYLE = {
  font: 'bold 14px/1.5 sans-serif',
  // Match the font's explicit 14px × 1.5 line-height and the Drawer CSS.
  lineHeight: 21,
  background: 'rgba(0, 0, 0, 0.7)',
  color: '#fff',
  horizontalPadding: 8,
  verticalPadding: 4,
  // GEOVIEW_SHAPE guarantees px strings; canvas needs the numeric CSS-pixel value.
  radius: Number.parseFloat(GEOVIEW_SHAPE.borderRadiusSm),
  pointerSize: 6,
  // Match Drawer's 6px triangle borders and -7px left margin.
  pointerOffsetX: -1,
} as const;

/** Latest total-label rendering resources owned by one feature. */
type CachedMeasurementLabel = {
  /** Text used to size and draw the backing. */
  label: string;
  /** Vertical placement relative to the anchor. */
  offsetY: number;
  /** Shared anchor for the backing and text. */
  geometry: Point;
  /** Backing and text styles in drawing order. */
  styles: Style[];
};

/** Keeps only the latest label per feature without keeping deleted features alive. */
const labelStylesByFeature = new WeakMap<FeatureLike, CachedMeasurementLabel>();

/**
 * Creates or reuses an exportable total label with Drawer's rounded backing and downward pointer.
 *
 * @param feature - Owning feature, keeping equal labels at different locations independent
 * @param coordinate - Label anchor in map coordinates
 * @param label - Measurement text, with newlines separating perimeter and area
 * @param offsetY - Vertical offset in CSS pixels, preserving Measure's existing placement
 * @returns Backing and native text styles, in drawing order
 */
export function createMeasurementLabelStyles(feature: FeatureLike, coordinate: Coordinate, label: string, offsetY: number): Style[] {
  const cached = labelStylesByFeature.get(feature);
  if (cached?.label === label && cached.offsetY === offsetY) {
    // Moving an anchor does not change text metrics; update the Point used by both cached styles.
    const [x, y] = cached.geometry.getCoordinates();
    if (x !== coordinate[0] || y !== coordinate[1]) cached.geometry.setCoordinates(coordinate);
    return cached.styles;
  }

  const { font, lineHeight, background, color, horizontalPadding, verticalPadding, radius, pointerSize, pointerOffsetX } =
    TOTAL_LABEL_STYLE;
  const lines = label.split('\n');
  const height = lineHeight * lines.length + verticalPadding * 2;
  const geometry = new Point(coordinate);
  let measuredWidth: number | undefined;
  let hasWarnedInvalidPixels = false;

  /**
   * Draws the backing and pointer in a single fill to avoid overlapping translucent paints.
   *
   * @param pixels - Point coordinates in render pixels
   * @param state - OpenLayers canvas render state
   */
  const renderBackground: RenderFunction = (pixels, state): void => {
    const [x, y] = pixels;
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
      if (!hasWarnedInvalidPixels) {
        logger.logWarning('MEASUREMENT LABEL - Skipping label backing: invalid render coordinates', pixels);
        hasWarnedInvalidPixels = true;
      }
      return;
    }

    const { context, pixelRatio } = state;
    context.save();
    if (measuredWidth === undefined) {
      context.font = font;
      measuredWidth = Math.max(...lines.map((line): number => context.measureText(line).width)) + horizontalPadding * 2;
    }
    const width = measuredWidth;
    // The anchor is already in render pixels; scale only the local CSS-pixel dimensions and offsets.
    context.translate(x, y);
    context.scale(pixelRatio, pixelRatio);
    context.rotate(-state.rotation);
    context.translate(0, offsetY);
    context.beginPath();
    const left = -width / 2;
    const right = width / 2;
    const top = -height / 2;
    const bottom = height / 2;
    context.moveTo(left + radius, top);
    context.lineTo(right - radius, top);
    context.arcTo(right, top, right, top + radius, radius);
    context.lineTo(right, bottom - radius);
    context.arcTo(right, bottom, right - radius, bottom, radius);
    context.lineTo(left + radius, bottom);
    context.arcTo(left, bottom, left, bottom - radius, radius);
    context.lineTo(left, top + radius);
    context.arcTo(left, top, left + radius, top, radius);
    context.closePath();
    context.moveTo(pointerOffsetX - pointerSize, height / 2);
    context.lineTo(pointerOffsetX, height / 2 + pointerSize);
    context.lineTo(pointerOffsetX + pointerSize, height / 2);
    context.closePath();
    context.fillStyle = background;
    context.fill();
    context.restore();
  };

  const styles = [
    // Custom renderers otherwise run after native text, regardless of the style array order.
    new Style({ geometry, renderer: renderBackground, zIndex: 1 }),
    new Style({
      geometry,
      zIndex: 2,
      text: new Text({
        text: label,
        font,
        fill: new Fill({ color }),
        offsetY,
        textAlign: 'center',
        textBaseline: 'middle',
        overflow: true,
      }),
    }),
  ];
  // Replacing this entry also replaces the old renderer and its measured width when the label changes.
  labelStylesByFeature.set(feature, { label, offsetY, geometry, styles });
  return styles;
}
