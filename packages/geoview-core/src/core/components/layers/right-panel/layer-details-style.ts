import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  categoryTitle: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  layerDetails: {
    borderColor: 'geoViewColors.primary.main',
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '20px',
    overflowY: 'auto',
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
        fontWeight: 'bold',
        borderTop: '1px solid #ccc',
        borderBottom: '2px solid #ccc',
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
    color: 'geoViewColors.primary.main',
    fontSize: theme.palette.geoViewText.lg,
    noWrap: true,
    marginLeft: 20,
  },
});
