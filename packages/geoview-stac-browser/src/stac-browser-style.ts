/**
 * Gets the sx classes for the STAC browser components.
 *
 * @param theme - The MUI theme
 * @returns The sx style definitions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): any => ({
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: theme.spacing(1),
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  filterRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  filterLabel: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize.sm,
    color: theme.palette.geoViewColor.textColor.main,
  },
  searchButton: {
    marginTop: theme.spacing(1),
  },
  resultsList: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(1),
  },
  resultCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  resultTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize.default,
    color: theme.palette.geoViewColor.textColor.main,
  },
  resultMeta: {
    fontSize: theme.palette.geoViewFontSize.sm,
    color: theme.palette.geoViewColor.textColor.light[200],
  },
  thumbnail: {
    width: '100%',
    maxHeight: 150,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius,
  },
  detailPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  detailTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize.lg,
    color: theme.palette.geoViewColor.textColor.main,
  },
  detailContent: {
    padding: theme.spacing(1.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  detailDescription: {
    fontSize: theme.palette.geoViewFontSize.default,
    color: theme.palette.geoViewColor.textColor.main,
  },
  assetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  assetItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  noResults: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
    color: theme.palette.geoViewColor.textColor.light[200],
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(1),
  },
  dateInputRow: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    '& input': {
      fontSize: theme.palette.geoViewFontSize.sm,
      padding: theme.spacing(0.75),
    },
  },
});
