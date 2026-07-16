import type { IGeoViewColors, IGeoViewFontSizes } from '@/ui/style/types';
import { GeoViewColorClass } from '@/ui/style/types';

/** Default font family stack for GeoView UI components */
export const font = "'Roboto', 'Helvetica', 'Arial', sans-serif";

/** Default base font size multiplier in rem units */
export const defaultFontSize = 1;

/** Heading typography styles with bold weight */
export const headingStyles = {
  fontFamily: font,
  fontWeight: 700,
};

/**
 * Visually hidden style pattern for screen reader-only content.
 *
 * This CSS pattern hides content visually while keeping it accessible
 * to screen readers, following WCAG best practices.
 *
 * @see https://www.w3.org/WAI/WCAG21/Techniques/css/C7
 */
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/**
 * Standard CSS properties for text truncation with ellipsis.
 *
 * Use this for non-Typography elements (Box, span, div, table cells) that need text truncation.
 * For Typography components, use the `noWrap` prop instead.
 *
 * Note: This constant does not include `display` or width constraints. For ellipsis to work:
 * - The element must have `display: block` or `display: inline-block` (or be a flex/grid item)
 * - The element must have a constrained width (`maxWidth`, `width`, or flex constraints)
 * - For inline elements like `<span>`, use `display: 'inline-block'` to preserve inline flow
 *
 * @example
 * ```tsx
 * // Block element with maxWidth
 * const styles = {
 *   truncatedText: {
 *     display: 'block',
 *     maxWidth: '200px',
 *     ...ellipsisOverflow,
 *   },
 * };
 *
 * // Inline element (span) with inline-block
 * <Box component="span" sx={{ display: 'inline-block', maxWidth: '300px', ...ellipsisOverflow }}>
 *   {longText}
 * </Box>
 *
 * // Flex item (width constraint from parent)
 * <Box sx={{ display: 'flex' }}>
 *   <Box sx={{ flex: 1, minWidth: 0, ...ellipsisOverflow }}>
 *     {longText}
 *   </Box>
 * </Box>
 * ```
 */
export const ellipsisOverflow = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

/** Opacity values for interactive states (hover, selected, disabled, focus, activated) */
export const opacity = {
  hoverOpacity: 0.08,
  selectedOpacity: 0.16,
  disabledOpacity: 0.38,
  focusOpacity: 0.12,
  activatedOpacity: 0.24,
};

/** Default GeoView color palette with primary, secondary, and semantic colors */
export const geoViewColors: IGeoViewColors = {
  white: '#FFFFFF',

  bgColor: new GeoViewColorClass('#F1F2F5'),
  primary: new GeoViewColorClass('#515BA5'),
  secondary: new GeoViewColorClass('#1976d2'),
  textColor: new GeoViewColorClass('#393939'),
  success: new GeoViewColorClass('#2e7d32'),
  error: new GeoViewColorClass('#d32f2f'),
  warning: new GeoViewColorClass('#ed6c02'),
  info: new GeoViewColorClass('#2e7d32'),
  grey: new GeoViewColorClass('#9e9e9e'),
};

const fontSizes: IGeoViewFontSizes = {
  xs: `${defaultFontSize * 0.7}rem`,
  sm: `${defaultFontSize * 0.875}rem`,
  md: `${defaultFontSize * 1.125}rem`,
  lg: `${defaultFontSize * 1.3}rem`,
  xl: `${defaultFontSize * 1.6}rem`,
  xxl: `${defaultFontSize * 2}rem`,
  default: `${defaultFontSize}rem`,
};

for (let multiplier = 0.2; multiplier <= 10; multiplier += 0.1) {
  const key = `${multiplier}x`;
  fontSizes[key] = `${defaultFontSize * multiplier}rem`;
}

/** GeoView font size scale from xs to xxl with dynamic multiplier entries */
export const geoViewFontSizes = fontSizes;
