import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  categoryTitle: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  layerDetails: {
    borderColor: theme.palette.geoViewColor.primary.main,
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
    color: theme.palette.geoViewColor.primary.main,
    fontSize: theme.palette.geoViewFontSize.lg,
    noWrap: true,
    marginLeft: 20,
  },
});
