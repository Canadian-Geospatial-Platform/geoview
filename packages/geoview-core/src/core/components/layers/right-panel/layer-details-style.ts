import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  categoryTitle: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  layerDetails: {
    borderColor: theme.palette.primary.main,
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '20px',
    overflow: 'auto',
    maxHeight: '700px',
  },
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  opacityMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '8px 20px 7px 15px',
    backgroundColor: '#F6F6F6',
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
    color: 'text.primary',
    fontSize: 16,
    noWrap: true,
    marginLeft: 20,
  },
});
