import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';

/** Sx class definitions for the north arrow component. */
interface NorthArrowStyles {
  /** Styles for the north arrow container. */
  northArrowContainer: SxProps<Theme>;
  /** Dimensions for the north arrow icon. */
  northArrow: {
    width?: number;
    height?: number;
  };
}

/**
 * Converts a string or number value to a number with a fallback default.
 *
 * @param value - The value to convert
 * @param defaultValue - The default value to use if conversion fails
 * @returns The converted number or the default value
 */
const toNumber = (value: string | number | undefined, defaultValue: number): number => {
  if (typeof value === 'undefined') return defaultValue;
  if (typeof value === 'number') return value;
  const parsed = parseInt(value, 10);
  // eslint-disable-next-line no-restricted-globals
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Gets custom sx classes for the north arrow.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): NorthArrowStyles => {
  // Default sizes
  const DEFAULT_WIDTH = 24;
  const DEFAULT_HEIGHT = 24;

  // Get sizes from theme with proper type conversion
  const width = toNumber(theme.overrides?.northArrow?.size?.width, DEFAULT_WIDTH);
  const height = toNumber(theme.overrides?.northArrow?.size?.height, DEFAULT_HEIGHT);

  return {
    northArrowContainer: {
      left: '50%',
      position: 'absolute',
    },
    northArrow: {
      width,
      height,
    },
  };
};
