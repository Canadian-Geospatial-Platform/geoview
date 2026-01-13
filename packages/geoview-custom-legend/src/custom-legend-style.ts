type SxStyles = Record<string, unknown>;

/**
 * Get custom sx classes for the legend
 *
 * @param theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: unknown): SxStyles => {
  const t = theme as Record<string, unknown>;
  const palette = t.palette as Record<string, unknown> | undefined;
  const primary = palette?.primary as Record<string, unknown> | undefined;
  const text = palette?.text as Record<string, unknown> | undefined;
  const grey = palette?.grey as Record<string, unknown> | undefined;
  return {
    container: {
      padding: '20px',
      paddingBottom: '40px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    title: {
      textAlign: 'left',
      fontWeight: '600',
      color: (primary?.main as string) || '#1976d2',
      fontSize: '1rem',
    },
    subtitle: {
      fontWeight: 'normal',
      fontSize: '1rem',
      textAlign: 'left',
    },
    layersListContainer: {
      padding: '20px',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    legendLayerListItem: {
      padding: '6px 4px',
      '& .layerTitle': {
        fontSize: '1rem',
        fontWeight: '600',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        '>p': {
          margin: 0,
          color: (text?.secondary as string) || '#666',
          fontSize: '0.875rem',
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
        color: (text?.secondary as string) || '#666',
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
            borderLeft: `5px solid ${(grey?.[300] as string) || '#ccc'}`,
            fontStyle: 'italic',
            color: (text?.disabled as string) || '#999',
          },
          '&.checked': {
            borderLeft: `5px solid ${(grey?.[600] as string) || '#666'}`,
          },
        },
      },
      '& .outOfRange': {
        '& .layerTitle': {
          color: (grey?.[700] as string) || '#777',
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
      fontSize: '1.25rem',
      fontWeight: '600',
      lineHeight: '1.5em',
    },
    legendInstructionsBody: {
      fontSize: '1rem',
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
      borderBottom: `1px solid ${(palette?.divider as string) || '#e0e0e0'}`,
      paddingTop: '8px',
      paddingLeft: '8px',
    },
  };
};
