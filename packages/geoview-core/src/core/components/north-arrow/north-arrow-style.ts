import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

interface NorthArrowStyles {
  northArrowContainer: SxProps<Theme>;
  northArrow: {
    width?: number;
    height?: number;
  };
}

/**
 * Helper function to convert string or number to number with default
 * @param value - The value to convert
 * @param defaultValue - The default value to use if conversion fails
 */
const toNumber = (value: string | number | undefined, defaultValue: number): number => {
  if (typeof value === 'undefined') return defaultValue;
  if (typeof value === 'number') return value;
  const parsed = parseInt(value, 10);
  // eslint-disable-next-line no-restricted-globals
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Get custom sx classes for the north arrow
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
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
