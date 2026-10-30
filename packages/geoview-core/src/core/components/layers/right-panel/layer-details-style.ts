import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { ellipsisOverflow } from '@/ui/style/default';

/**
 * Get custom sx classes for the layers right panel
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  categoryTitle: {
    textAlign: 'left',
    fontWeight: '600',
    fontSize: theme.typography.h5.fontSize,
  },
  layerDetails: {
    padding: theme.spacing(2),
  },
  itemsGrid: {
    width: '100%',
    '& .MuiGrid-container': {
      '& .MuiGrid-item': {
        padding: theme.spacing(0.5, 0.75),

        '&:first-of-type': {
          width: '80px',
        },
        '&:nth-of-type(2)': {
          flexGrow: 1,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
      },
    },
  },
  tableIconLabel: {
    color: theme.palette.text.primary,
    fontSize: theme.typography.body1.fontSize,
    alignSelf: 'center',
  },
  wmsImage: {
    maxWidth: '100%',
    height: 'auto',
  },
  layerInfo: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.body2.fontSize,
    '& .info-container': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      '& a': {
        ...ellipsisOverflow,
        marginLeft: theme.spacing(0.5),
        flex: 1,
        minWidth: 0,
      },
    },
  },
  infoSection: {
    marginBottom: theme.spacing(0.25),
  },
  infoSectionTitle: {
    fontWeight: 600,
    fontSize: theme.typography.h6.fontSize,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.25),
  },
  infoSectionContent: {
    paddingLeft: theme.spacing(0.25),
  },
  swiperSectionContent: {
    paddingLeft: theme.spacing(1),
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  swiperSideSelect: {
    minWidth: '120px',
  },
  verticalDivider: {
    width: '1px',
    height: '30px',
    backgroundColor: theme.palette.divider,
    // Absorb flex gap so the 1px divider plus its margins equal layerButtonsGroup's gap (theme.spacing(2))
    margin: `0 calc(-1 * (${theme.spacing(2)} - 1px) / 2)`,
  },
  layerDetailsListGroup: {
    listStyleType: 'disc',
    listStylePosition: 'outside',
    paddingLeft: theme.spacing(2.5),
  },
  layerDetailsListItem: {
    display: 'list-item',
    paddingTop: theme.spacing(0),
    paddingBottom: theme.spacing(0),
    paddingLeft: theme.spacing(0),
    '& .MuiListItemText-root': {
      margin: theme.spacing(0),
      '& .MuiTypography-root': {
        whiteSpace: 'normal',
      },
    },
  },
  formControlLabelFull: {
    margin: theme.spacing(0),
    width: '100%',
    gap: theme.spacing(1),
    '& .MuiFormControlLabel-label': {
      width: '100%',
      flex: 1,
    },
  },

  formControlLabel: {
    margin: theme.spacing(0),
    gap: theme.spacing(1),
    '& .MuiFormControlLabel-label': {
      flex: 1,
    },
  },

  checkboxLabelContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  hiddenText: {
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
  },

  boldLabel: {
    fontWeight: 'bold',
  },

  sublayerListItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  sublayerChildrenContainer: {
    paddingLeft: theme.spacing(3.75),
    width: '100%',
  },

  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing(2),
  },

  headerTitleContainer: {
    textAlign: 'left',
    flex: 1,
    minWidth: 0,
  },

  layerButtonsGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },

  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap-reverse',
  },

  sectionDivider: {
    height: 'auto',
    marginTop: theme.spacing(1.25),
    marginBottom: theme.spacing(1.25),
  },

  attributionText: {
    marginTop: theme.spacing(1.25),
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },

  itemLabelIndented: {
    paddingLeft: theme.spacing(1),
  },

  itemGridItem: {
    marginBottom: theme.spacing(0.5),
  },

  wmsImageContainer: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },

  itemsGridColumn: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
});
