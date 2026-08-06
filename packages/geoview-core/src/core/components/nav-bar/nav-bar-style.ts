import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import {
  NAV_BAR_OVERVIEW_OFFSET,
  NAV_BAR_BOTTOM_OFFSET,
  NAV_BAR_BOTTOM_OFFSET_EXPANDED,
  NAV_BAR_BUTTON_GROUP_MAX_HEIGHT,
  OVERVIEW_MAP_MIN_CONTAINER_WIDTH,
  OVERVIEW_MAP_MIN_CONTAINER_HEIGHT,
} from '@/core/utils/constant';

/**
 * Gets custom sx classes for the navigation bar.
 *
 * @param theme - The theme object
 * @param panelWidth - Optional panel width (px or string). If not provided, defaults to auto-sizing.
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme, panelWidth?: string | number): SxStyles => {
  /** Container query string for minimum size thresholds (used by multi-column layout styles). */
  const mapContainerMinSizeQuery = `@container map (min-width: ${OVERVIEW_MAP_MIN_CONTAINER_WIDTH}px) and (min-height: ${OVERVIEW_MAP_MIN_CONTAINER_HEIGHT}px)`;

  return {
    navBarContainer: {
      position: 'absolute',
      right: theme.spacing(6),
      top: theme.spacing(6),
      bottom: NAV_BAR_BOTTOM_OFFSET,
      left: 'auto',
      width: 'auto',
      maxWidth: '90vw',
      minHeight: '100px',
      zIndex: 150,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'safe flex-end',
      gap: theme.spacing(6),
      alignItems: 'center',
      overflowY: 'auto',
      padding: theme.spacing(2),
      backgroundColor: 'transparent',
      borderRadius: theme.spacing(5),
      pointerEvents: 'all',
      scrollbarWidth: 'thin',
      scrollbarColor: `${theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main} transparent`,
    },
    // Add top offset to nav bar when overview map is visible to avoid overlap
    navBarContainerWithOverview: {
      top: NAV_BAR_OVERVIEW_OFFSET,
    },
    /**
     * Enables multi-column flex layout when the map container meets minimum size requirements.
     *
     * Container queries trigger at the same thresholds used for overview map visibility
     * (OVERVIEW_MAP_MIN_CONTAINER_WIDTH and OVERVIEW_MAP_MIN_CONTAINER_HEIGHT).
     *
     * This ensures the nav-bar uses available space optimally regardless of whether
     * the overview map is visible.
     */
    navBarContainerMultiColumn: {
      [mapContainerMinSizeQuery]: {
        flexFlow: 'column wrap-reverse',
        overflowY: 'hidden',
      },
    },
    // Add bottom offset to nav bar when map-info bar is expanded to avoid overlap
    navBarContainerWithExpandedMapInfo: {
      bottom: NAV_BAR_BOTTOM_OFFSET_EXPANDED,
    },
    navBtnGroupColumns: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(6),
      alignItems: 'center',
    },
    navBtnGroup: {
      borderRadius: theme.spacing(5),
      backgroundColor: theme.palette.geoViewColor?.bgColor.light[500],
      overflow: 'clip',
      '& .MuiButtonGroup-grouped:not(:last-child)': {
        borderColor: theme.palette.geoViewColor?.bgColor.light[900],
      },
    },
    /**
     * Enables button wrapping within groups when container meets minimum size.
     *
     * See navBarContainerMultiColumn for threshold rationale.
     */
    navBtnGroupMultiColumn: {
      [mapContainerMinSizeQuery]: {
        flexWrap: 'wrap',
        maxHeight: NAV_BAR_BUTTON_GROUP_MAX_HEIGHT,
      },
    },
    navButton: {
      backgroundColor: theme.palette.geoViewColor?.bgColor.light[500],
      color: theme.palette.geoViewColor?.bgColor.dark[900],
      borderRadius: 0,
      width: '44px',
      height: '44px',
      maxWidth: '44px',
      minWidth: '44px',
      padding: 'initial',
      transition: 'background-color 0.3s ease-in-out',
      '&:not(:last-of-type)': {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.light[900]}`,
      },
      '&:not(:first-of-type)': {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      '&:hover': {
        backgroundColor: theme.palette.geoViewColor?.bgColor.light[500],
        color: theme.palette.geoViewColor?.bgColor.dark[700],
      },
      '&:focus': {
        backgroundColor: theme.palette.geoViewColor?.bgColor.light[500],
        color: theme.palette.geoViewColor?.bgColor.dark[700],
      },
      '&:active': {
        backgroundColor: theme.palette.geoViewColor?.bgColor.light[500],
        color: theme.palette.geoViewColor?.bgColor.dark[950],
      },
      '&.highlighted.active': {
        backgroundColor: theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main,
        color: theme.palette.geoViewColor?.white ?? theme.palette.common.white,
        '& .MuiSvgIcon-root': {
          color: `inherit`,
          fill: `${theme.palette.geoViewColor?.white ?? theme.palette.common.white}`,
          stroke: `${theme.palette.geoViewColor?.white ?? theme.palette.common.white}`,
        },
      },
    },
    popper: {
      zIndex: theme.zIndex.modal,
    },
    popoverPaper: {
      // If panelWidth is provided, use it; otherwise auto-size with constraints
      width: panelWidth ?? 'auto',
      minWidth: '180px',
      maxWidth: '70vw',
      maxHeight: 'min(100vh, 500px)',
      display: 'flex',
      flexDirection: 'column',
      marginRight: theme.spacing(6),
    },
    popoverTitleContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      minHeight: '48px',
      borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100] ?? theme.palette.divider}`,
      padding: '4px 8px 4px 16px',
      flexShrink: 0,
      gap: '8px',
    },
    popoverTitleLabel: {
      fontSize: theme.palette.geoViewFontSize?.default ?? theme.typography.fontSize,
      fontWeight: '700',
      color: theme.palette.geoViewColor?.textColor.main ?? theme.palette.text.primary,
      flexShrink: 1,
      padding: 0,
    },
    popoverTitleActions: {
      display: 'flex',
      flexShrink: 0,
      color: theme.palette.geoViewColor?.textColor.main ?? theme.palette.text.primary,
    },
    popoverTitle: {
      fontSize: theme.palette.geoViewFontSize?.default ?? theme.typography.fontSize,
      fontWeight: '700',
      color: theme.palette.geoViewColor?.textColor.main ?? theme.palette.text.primary,
      minHeight: '48px',
      borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100] ?? theme.palette.divider}`,
      display: 'flex',
      alignItems: 'center',
      padding: '4px 16px',
    },
    popoverContent: {
      '&.MuiDialogContent-root': {
        padding: '16px 16px',
        flexGrow: 1 /* Forces this child to fill all remaining space */,
        minHeight: 0,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main} transparent`,
      },
    },
    button: {
      justifyContent: 'flex-start',
      '&[aria-pressed="true"]': {
        backgroundColor: theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main,
        color: theme.palette.geoViewColor?.white ?? theme.palette.common.white,
        // Force icon colors to white when pressed
        '& .MuiSvgIcon-root': {
          color: theme.palette.geoViewColor?.white ?? theme.palette.common.white,
          fill: theme.palette.geoViewColor?.white ?? theme.palette.common.white,
          stroke: theme.palette.geoViewColor?.white ?? theme.palette.common.white,
        },
        '&:hover': {
          backgroundColor: theme.palette.geoViewColor?.primary.dark[200] ?? theme.palette.primary.dark,
        },
      },
    },
    rotationControlContainer: {
      width: '100%',
      maxWidth: '300px',
      padding: `0 ${theme.spacing(11)}`,
    },
    rotationLabelBox: {
      display: 'flex',
      justifyContent: 'center',
      paddingTop: theme.spacing(7),
      minWidth: 0,
    },
    rotationLabel: {
      fontWeight: 'bold',
    },
    rotationLabelProjection: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'inline',
      },
    },
    rotationButtonContainer: {
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: theme.spacing(7),
      gap: 1,
      [theme.breakpoints.up('sm')]: {
        flexDirection: 'row',
      },
    },
    rotationIconBase: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.3s ease-in-out',
    },
  };
};
