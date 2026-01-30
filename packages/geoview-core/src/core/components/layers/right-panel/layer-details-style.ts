import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the layers right panel
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  categoryTitle: {
    textAlign: 'left',
    fontWeight: '600',
    fontSize: theme.palette.geoViewFontSize.lg,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  layerDetails: {
    padding: '16px',
  },
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: '20px',
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
  verticalDivider: {
    width: '1px',
    height: '30px',
    backgroundColor: theme.palette.geoViewColor.bgColor.dark[300],
  },
  layerMoreInfoFilters: {
    listStyleType: 'disc',
    listStylePosition: 'outside',
    paddingLeft: '20px',
  },
  layerMoreInfoFiltersItem: {
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
});
