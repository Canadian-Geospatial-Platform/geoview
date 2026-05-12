import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import type { StatusIndicatorType } from '@/core/stores/states/map-state';

type SxClasses = Record<string, string | number | object>;

/**
 * Gets the sx classes for the status indicator component.
 *
 * @param theme - The MUI theme
 * @param isCrosshairsActive - Whether the crosshairs are currently active
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme, isCrosshairsActive: boolean): SxStyles => {
  const baseTop = 10;
  const crosshairMessageHeight = 'calc(1em + 8px)';

  return {
    container: {
      position: 'absolute',
      top: isCrosshairsActive ? `calc(${baseTop}px + ${crosshairMessageHeight})` : `${baseTop}px`,
      left: 10,
      zIndex: 1000,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      transition: 'top 0.3s ease-in-out',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: theme.shadows[2],
    },
  };
};

/**
 * Gets the badge style for a specific indicator type.
 *
 * @param theme - The MUI theme
 * @param type - The indicator type
 * @returns The sx style object for the badge
 */
export const getBadgeStyle = (theme: Theme, type: StatusIndicatorType): SxClasses => {
  // Map indicator type to theme palette
  const paletteMap = {
    error: theme.palette.error,
    warning: theme.palette.warning,
    success: theme.palette.success,
    info: theme.palette.info,
  };

  const palette = paletteMap[type];

  return {
    backgroundColor: palette.main,
    color: theme.palette.geoViewColor.textColor.light[950],
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${palette.dark || 'rgba(0, 0, 0, 0.1)'}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  };
};
