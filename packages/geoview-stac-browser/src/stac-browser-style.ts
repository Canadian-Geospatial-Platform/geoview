import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Gets the sx classes for the STAC browser components.
 *
 * @param theme - The MUI theme
 * @returns The sx style definitions
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
    gap: theme.spacing(1),
  },
  backLink: {
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5, 0),
  },
  stickyNav: {
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5, 0.5),
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.geoViewColor?.bgColor.dark[50] ?? theme.palette.background.paper,
    zIndex: 1,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  browseToolbar: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  mapControls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  modeToggle: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  modeButton: {
    flex: 1,
    borderRadius: theme.shape.borderRadiusNone,
    borderBottom: '2px solid transparent',
    padding: theme.spacing(1),
    fontWeight: 500,
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.light[200],
    cursor: 'pointer',
    textAlign: 'center',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  modeButtonActive: {
    borderBottom: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
    color: theme.palette.geoViewColor?.primary.main,
    fontWeight: 600,
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    flex: 1,
  },
  searchButton: {
    marginTop: 'auto',
  },
  filterActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    marginTop: 'auto',
    '& > button': {
      flex: 1,
    },
  },
  filterRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  filterLabel: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.main,
  },
  propertyFilterRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
    gap: theme.spacing(0.75),
    alignItems: 'center',
    '& > select, & > input': {
      minWidth: 0,
      maxWidth: '100%',
      padding: theme.spacing(0.5),
    },
  },
  resultsList: {
    padding: theme.spacing(1),
  },
  itemList: {
    listStyle: 'none',
    margin: theme.spacing(0),
    padding: theme.spacing(0),
  },
  resultCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadiusMd,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  resultTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.textColor.main,
  },
  resultMeta: {
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.light[200],
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  thumbnail: {
    width: '100%',
    maxHeight: 150,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadiusMd,
  },
  detailTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.lg,
    color: theme.palette.geoViewColor?.textColor.main,
  },
  detailDescription: {
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.textColor.main,
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
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadiusMd,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
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
    color: theme.palette.geoViewColor?.textColor.light[200],
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
  },
  dateInputRow: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  containedInExtentCheckbox: {
    marginLeft: theme.spacing(0.25),
  },
  dateInput: {
    flex: 1,
    '& input': {
      fontSize: theme.palette.geoViewFontSize?.sm,
      padding: theme.spacing(0.75),
    },
  },
  collectionsListBox: {
    maxHeight: 150,
    overflow: 'auto',
  },
  detailSection: {
    padding: theme.spacing(0, 1.5),
  },
  previewImage: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    borderRadius: theme.shape.borderRadiusMd,
  },

  // Collection card styles
  collectionCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.geoViewColor?.primary.main,
    },
  },
  collectionTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.textColor.main,
  },
  collectionDescription: {
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.light[200],
    lineHeight: 1.4,
  },

  // Keyword chips
  keywordChipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  },
  keywordChip: {
    display: 'inline-block',
    padding: theme.spacing(0.25, 1),
    fontSize: '0.75rem',
    backgroundColor: theme.palette.action.selected,
    color: theme.palette.geoViewColor?.textColor.main,
    whiteSpace: 'nowrap',
  },

  // Metadata section (collection detail)
  metadataSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(0, 1.5, 1),
  },
  metadataRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
  },
  metadataLabel: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.main,
  },
  zoomButton: {
    fontSize: theme.palette.geoViewFontSize?.sm,
  },

  // Items section (collection detail)
  itemsSectionTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.textColor.main,
    marginBottom: theme.spacing(0.5),
  },
  itemCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.75, 1, 0.5, 0.5),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderLeftWidth: 5,
  },
  itemCardHeader: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'flex-start',
  },
  itemCheckbox: {
    padding: theme.spacing(0.25),
  },
  itemSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: theme.spacing(1.5),
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.light[200],
  },
  itemSummaryLabel: {
    fontWeight: 600,
  },
  itemCardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.25, 0.5),
    '& .MuiButton-root': {
      fontSize: theme.palette.geoViewFontSize?.sm,
      minWidth: 0,
      padding: theme.spacing(0.25, 0.75),
    },
  },
  itemActionActive: {
    backgroundColor: theme.palette.action.selected,
  },
  selectionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.action.hover,
    fontSize: theme.palette.geoViewFontSize?.sm,
    flexShrink: 0,
  },

  // Metadata key/value view
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(90px, 35%) 1fr',
    columnGap: theme.spacing(1),
    rowGap: theme.spacing(0.25),
    margin: theme.spacing(0),
    padding: theme.spacing(0.5, 0.5, 0.5, 1),
    fontSize: theme.palette.geoViewFontSize?.sm,
  },
  metadataKey: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.main,
    overflowWrap: 'anywhere',
  },
  metadataValue: {
    margin: theme.spacing(0),
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.light[200],
    overflowWrap: 'anywhere',
  },
  itemRowText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  itemThumbnail: {
    width: 60,
    height: 60,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadiusMd,
    flexShrink: 0,
  },
  assetTypeBadge: {
    display: 'inline-block',
    padding: theme.spacing(0.25, 0.75),
    fontSize: '0.7rem',
    fontWeight: 600,
    borderRadius: theme.shape.borderRadiusSm,
    backgroundColor: theme.palette.geoViewColor?.primary.main,
    color: theme.palette.geoViewColor?.white,
    marginRight: theme.spacing(0.5),
  },
  assetRoleBadge: {
    display: 'inline-block',
    padding: theme.spacing(0.25, 0.75),
    fontSize: '0.65rem',
    fontWeight: 500,
    borderRadius: theme.shape.borderRadiusSm,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.geoViewColor?.textColor.light[200],
    textTransform: 'uppercase',
  },
  assetActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flexShrink: 0,
  },
  assetBadgeRow: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
  },
  paginationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 0),
  },

  // Search results grouped by collection
  collectionGroup: {
    marginBottom: theme.spacing(1.5),
  },
  collectionGroupTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.primary.main,
    padding: theme.spacing(0.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(0.5),
  },
});
