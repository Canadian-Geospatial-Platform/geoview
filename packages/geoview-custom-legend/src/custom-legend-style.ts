type SxClasses = Record<string, object>;

/**
 * Generates the main SX classes for styling components
 * @returns {SxClasses} An object containing the style classes
 */
export const getSxClassesMain = (): SxClasses => ({
  container: {
    padding: '20px',
    paddingBottom: '40px', // For map info bar
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
});

/**
 * Get custom sx classes for the legend
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxClasses => ({
  // Used by HeaderItem component
  headerItem: {
    borderBottom: `1px solid ${theme.palette.geoViewColor.grey.light[800]}`,
    marginBottom: '8px',
  },

  // Used by GroupItem component
  groupItem: {
    border: `1px solid ${theme.palette.geoViewColor.grey.light[800]}`,
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '8px',
  },

  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '4px 8px',
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[300],
    },
  },

  groupChildren: {
    paddingLeft: '16px',
    marginTop: '8px',
  },
});
