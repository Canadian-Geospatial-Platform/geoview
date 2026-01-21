type SxClasses = Record<string, object>;

/**
 * Get custom sx classes for the legend
 *
 * @param {any} theme the theme object
 * @returns {Object} the sx classes object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxClasses => ({
  // Main container styles
  container: {
    padding: '20px',
    paddingBottom: '40px', // For map info bar
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    maxWidth: '350px',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: `${theme.palette.geoViewColor.bgColor.main}`,
  },

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
