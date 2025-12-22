type SxClasses = Record<string, object>;

/**
 * Get custom sx classes for the legend
 *
 * @param theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = <T extends Record<string, unknown>>(theme: T): SxClasses => {
  const typedTheme = theme as unknown as {
    palette: {
      geoViewColor: {
        textColor: { main: string; light: Record<string, string> };
        bgColor: { main: string; dark: Record<string, string> };
      };
      geoViewFontSize: { md: string; sm: string; lg: string; default: string };
      grey: Record<string, string>;
    };
    breakpoints: {
      down: (breakpoint: string) => string;
      up: (breakpoint: string) => string;
    };
  };

  return {
    container: {
      padding: '20px',
      paddingBottom: '40px', // For map info bar
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    title: {
      textAlign: 'left',
      fontWeight: '600',
      color: typedTheme.palette.geoViewColor.textColor.main,
      fontSize: typedTheme.palette.geoViewFontSize.md,
    },
    subtitle: {
      fontWeight: 'normal',
      fontSize: typedTheme.palette.geoViewFontSize.md,
      textAlign: 'left',
    },
    layersListContainer: {
      padding: '20px',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',

      [typedTheme.breakpoints.down('sm')]: {
        width: '100%',
      },
      [typedTheme.breakpoints.up('md')]: {
        width: '50%',
      },
      [typedTheme.breakpoints.up('lg')]: {
        width: '33.33%',
      },
    },
    legendLayerListItem: {
      padding: '6px 4px',
      '& .layerTitle': {
        fontSize: typedTheme.palette.geoViewFontSize.md,
        fontWeight: '600',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        '>p': {
          margin: 0,
          color: typedTheme.palette.geoViewColor.textColor.light[400],
          fontSize: typedTheme.palette.geoViewFontSize.sm,
          lineHeight: 1.43,
        },
        '>div': {
          whiteSpace: 'normal',
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        },
      },

      '& .layerTitle > .MuiListItemText-secondary': {
        color: typedTheme.palette.geoViewColor.textColor.light[400],
      },

      '& .MuiListItemText-root': {
        marginLeft: '12px',
      },

      '& .MuiCollapse-vertical': {
        marginLeft: '6px',

        '& ul': {
          marginTop: 0,
          padding: 0,
        },
        '& li': {
          paddingLeft: '6px',
          marginBottom: '3px',
          fontWeight: '400',

          '&.unchecked': {
            borderLeft: `5px solid ${typedTheme.palette.geoViewColor.bgColor.dark[200]}`,
            fontStyle: 'italic',
            color: typedTheme.palette.geoViewColor.textColor.light[600],
          },

          '&.checked': {
            borderLeft: `5px solid ${typedTheme.palette.geoViewColor.bgColor.dark[600]}`,
          },
        },
      },
      '& .outOfRange': {
        '& .layerTitle': {
          color: `${typedTheme.palette.grey[700]}`,
          fontStyle: 'italic',
        },
      },
      '& .outOfRangeButton': {
        display: 'none',
      },
    },
    collapsibleContainer: {
      width: '100%',
      padding: '10px 0',
      margin: '0px 10px',
    },
    legendInstructionsTitle: {
      fontSize: typedTheme.palette.geoViewFontSize.lg,
      fontWeight: '600',
      lineHeight: '1.5em',
    },
    legendInstructionsBody: {
      fontSize: typedTheme.palette.geoViewFontSize.default,
    },
    subList: {
      width: '100%',
      '& .MuiListItemIcon-root': {
        minWidth: '1rem',
      },
      '& img': {
        maxWidth: '1.5rem',
      },
    },
    layerStackIcons: {
      flexWrap: 'wrap',
      '& button': {
        padding: '0.25rem',
        marginRight: 0,
        '& svg': {
          width: '1.25rem',
          height: '1.25rem',
        },
      },
    },
    toggleableItem: {
      cursor: 'pointer',
    },
    toggleBar: {
      borderBottom: `1px solid ${typedTheme.palette.geoViewColor.bgColor.dark[100]}`,
      paddingTop: '8px',
      paddingLeft: '8px',
    },
  };
};
