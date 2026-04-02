import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

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
    fontSize: theme.palette.geoViewFontSize.lg,
  },
  layerDetails: {
    padding: '16px',
  },
  itemsGrid: {
    width: '100%',
    '& .MuiGrid-container': {
      '&:first-of-type': {
        borderTop: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}`,
        borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}`,
      },
      '& .MuiGrid-item': {
        padding: '3px 6px',

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
    color: theme.palette.geoViewColor.textColor.main,
    fontSize: theme.palette.geoViewFontSize.default,
    alignSelf: 'center',
  },
  wmsImage: {
    maxWidth: '100%',
    height: 'auto',
  },
  layerInfo: {
    color: theme.palette.geoViewColor.textColor.light[200],
    fontSize: theme.palette.geoViewFontSize.sm,
    '& .info-container': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      '& a': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginLeft: '4px',
        flex: 1,
        minWidth: 0,
      },
    },
  },
  infoSection: {
    marginBottom: theme.spacing(2),
  },
  infoSectionTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize.default,
    color: theme.palette.geoViewColor.textColor.main,
    marginBottom: theme.spacing(0.5),
  },
  infoSectionContent: {
    paddingLeft: theme.spacing(1),
  },
  verticalDivider: {
    width: '1px',
    height: '30px',
    backgroundColor: theme.palette.geoViewColor.bgColor.dark[300],
    // Absorb flex gap so divider spacing equals half a normal gap on each side (7.5px + 1px + 7.5px)
    margin: '0 -7.5px',
  },
  layerDetailsListGroup: {
    listStyleType: 'disc',
    listStylePosition: 'outside',
    paddingLeft: '20px',
  },
  layerDetailsListItem: {
    display: 'list-item',
    paddingTop: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    '& .MuiListItemText-root': {
      margin: 0,
      '& .MuiTypography-root': {
        whiteSpace: 'normal',
      },
    },
  },
  formControlLabelFull: {
    margin: 0,
    width: '100%',
    gap: '8px',
    '& .MuiFormControlLabel-label': {
      width: '100%',
      flex: 1,
    },
  },

  formControlLabel: {
    margin: 0,
    gap: '8px',
    '& .MuiFormControlLabel-label': {
      flex: 1,
    },
  },

  checkboxLabelContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});
