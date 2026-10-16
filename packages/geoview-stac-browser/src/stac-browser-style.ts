import type { Theme, SxStyles } from 'geoview-core/ui/style/types';
import { visuallyHidden } from 'geoview-core/ui/style/default';
import { getFormControlFocusIndicatorStyles } from 'geoview-core/ui/style/themeOptionsGenerator';

/** Default color of the collection extent footprint. */
export const COLLECTION_COLOR = '#1976d2';

/** Default fill opacity of the collection extent footprint, outline only. */
export const COLLECTION_FILL_OPACITY = 0;

/** Default color of item footprints. */
export const ITEM_COLOR = '#FF8C00';

/** Default fill opacity of item footprints shown while browsing a collection or viewing an item, outline only. */
export const ITEM_FILL_OPACITY = 0;

/** Default fill opacity of search-result footprints, outline only. */
export const SEARCH_FILL_OPACITY = 0;

/** Colors assigned to the selected items, distinct from the collection and item footprint colors. */
export const SELECTION_COLORS = ['#e53935', '#43a047', '#fdd835', '#8e24aa', '#00acc1', '#d81b60', '#7cb342', '#5e35b1'];

/** Fill opacity of selected item footprints. */
export const SELECTED_FILL_OPACITY = 0.25;

/**
 * Gets the styles of native date and number inputs, which are not InputBase controls and need the shared keyboard focus indicator.
 *
 * @param theme - The MUI theme
 * @returns The native input style definitions
 */
const getNativeInputSx = (theme: Theme): ReturnType<typeof getFormControlFocusIndicatorStyles> => ({
  minWidth: 0,
  maxWidth: '100%',
  padding: theme.spacing(0.5),
  font: 'inherit',
  '.geoview-keyboard-active &:focus-visible': theme.palette.geoViewColor
    ? getFormControlFocusIndicatorStyles(theme.palette.geoViewColor)
    : {},
});

/**
 * Gets the sx classes for the STAC browser components.
 *
 * @param theme - The MUI theme
 * @returns The sx style definitions
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  visuallyHidden,
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  viewContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
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
    '& > .MuiFormControl-root': {
      minWidth: 0,
    },
    '& > input': getNativeInputSx(theme),
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
  assetItemSelected: {
    backgroundColor: theme.palette.action.selected,
  },
  assetTitleSelected: {
    fontWeight: 600,
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
  pageRange: {
    marginLeft: 'auto',
    alignSelf: 'center',
    fontSize: theme.palette.geoViewFontSize?.sm,
  },
  dateInputRow: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    '& > input': { ...getNativeInputSx(theme), flex: 1 },
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
  collectionList: {
    listStyle: 'none',
    margin: theme.spacing(0),
    padding: theme.spacing(0),
  },
  collectionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
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
    display: 'block',
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.textColor.main,
  },
  collectionDescription: {
    display: 'block',
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.light[200],
    lineHeight: 1.4,
  },
  collectionSearchField: {
    flex: 1,
  },
  sortToggle: {
    color: theme.palette.geoViewColor?.textColor.light[200],
    backgroundColor: 'transparent',
    borderRadius: theme.shape.borderRadiusSm,
    '&[aria-pressed="true"]': {
      color: theme.palette.geoViewColor?.primary.main,
      backgroundColor: theme.palette.action.selected,
    },
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
    fontSize: theme.palette.geoViewFontSize?.xs,
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
  metadataPair: {
    display: 'contents',
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
    fontSize: theme.palette.geoViewFontSize?.xs,
    fontWeight: 600,
    borderRadius: theme.shape.borderRadiusSm,
    backgroundColor: theme.palette.geoViewColor?.primary.main,
    color: theme.palette.geoViewColor?.white,
    marginRight: theme.spacing(0.5),
  },
  assetRoleBadge: {
    display: 'inline-block',
    padding: theme.spacing(0.25, 0.75),
    fontSize: theme.palette.geoViewFontSize?.xs,
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
