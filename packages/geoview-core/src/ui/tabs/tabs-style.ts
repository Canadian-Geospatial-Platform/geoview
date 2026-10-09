import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { FOCUS_HALO_SIZE, FOCUS_OUTLINE_WIDTH, getFocusIndicatorStyles } from '@/ui/style/themeOptionsGenerator';
import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';

/**
 * Gets custom sx classes for the tabs component.
 *
 * @param theme - The MUI theme object
 * @param isMapFullScreen - Whether the map is in fullscreen mode
 * @param appHeight - The application height value
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme, isMapFullScreen: boolean, appHeight: string): SxStyles => {
  const focusIndicator = {
    outline:
      theme.palette.geoViewColor?.focusIndicator.outline ??
      (theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.common.black),
    halo:
      theme.palette.geoViewColor?.focusIndicator.halo ??
      (theme.palette.mode === 'dark' ? alpha(theme.palette.common.black, 0.8) : theme.palette.common.white),
  };

  return {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
    },
    header: {
      width: '100%',
    },
    rightIcons: {
      marginTop: theme.spacing(0),
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    panel: {
      borderTop: 1,
      borderTopColor: 'divider',
      flexGrow: 1,
      height: isMapFullScreen ? 'calc(100% - 56px)' : `calc(${appHeight} - 56px)`,
      overflow: 'hidden',
      paddingTop: `${theme.spacing(0)} !important`,
      width: '100%',
      '.tab-panel': {
        height: '100%',
      },
    },
    tab: {
      fontSize: theme.palette.geoViewFontSize?.default ?? theme.typography.fontSize,
      fontWeight: 'bold',
      minWidth: 'min(4vw, 24px)',
      padding: theme.spacing(1, 3),
      margin: theme.spacing(0),
      textTransform: 'capitalize',
      '.MuiTab-icon': {
        marginRight: theme.spacing(1),
        maxWidth: '18px',
      },
      ...(!theme.focusVisible && {
        '&.Mui-focusVisible': {
          ...getFocusIndicatorStyles({
            ...(theme.palette.geoViewColor ?? defaultGeoViewColors),
            focusIndicator,
          }),
          outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
          boxShadow: `inset 0 0 0 ${FOCUS_HALO_SIZE} ${focusIndicator.halo}`,
        },
      }),
      transition: 'background-color 0.3s ease-in-out',
      '&:hover': {
        backgroundColor: theme.palette.geoViewColor?.primary.light[200],
        color: theme.palette.geoViewColor?.white,
      },
    },
    tabsContainer: {
      '.MuiTabScrollButton-root': {
        width: '47px',
      },
    },
    mobileDropdown: {
      marginLeft: '47px',
      maxWidth: '200px',
      padding: theme.spacing(1, 0),
      '& .MuiInputBase-root': {
        borderRadius: theme.shape.borderRadiusSm,
      },
      '& .MuiSelect-select': {
        padding: `${theme.spacing(1, 1.5)} !important`,
      },
    },
  };
};
