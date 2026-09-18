import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the map information bar.
 *
 * @param theme - The MUI theme
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => {
  /** Base styles shared by the dynamic and static map info bar containers. */
  const mapInfoBaseStyles = {
    display: 'flex',
    gap: theme.spacing(0.75),
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: '48px',
    right: 0,
    px: theme.spacing(2),
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'thin',
  } as const;

  return {
    // Container for the dynamic (interactive) map; height is set at the call site from the expanded state
    container: {
      ...mapInfoBaseStyles,
      scrollbarColor: `${theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main} transparent`,
      borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[650] ?? theme.palette.divider}`,
      color: theme.palette.geoViewColor?.bgColor.dark[650] ?? theme.palette.text.primary,
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark[50] ?? theme.palette.background.paper,
      width: 'calc(100% - 48px)',
      zIndex: theme.zIndex.appBar + 100, // Above app-bar panels
      boxShadow: `0 0 5px ${theme.palette.geoViewColor?.bgColor.dark[200] ?? theme.palette.grey[300]}`,
    },
    staticContainer: {
      ...mapInfoBaseStyles,
      height: '50px',
      background: theme.palette.geoViewColor?.grey.lighten(0.8, 0.8),
      width: 'fit-content',
      borderRadius: '70px',
    },
    mouseScaleControlsContainer: {
      marginLeft: 'auto',
      marginRight: 'auto',
      display: 'flex',
      gap: theme.spacing(0.75),
      alignItems: 'center',
    },
  };
};
