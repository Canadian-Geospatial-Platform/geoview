import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  categoryTitle: {
    textAlign: 'left',
    fontWeight: '600',
    fontSize: theme.palette.geoViewFontSize.lg,
  },
  layerDetails: {
    padding: '20px',
  },
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerOpacityControlContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'right',
    justifyContent: 'right',
    '& #layerOpacity': {
      width: { xs: '100%', sm: '100%', md: '50%', lg: '40%', xl: '40%' },
    },
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
    color: theme.palette.geoViewColor.textColor.main,
    fontSize: theme.palette.geoViewFontSize.default,
    noWrap: true,
    marginLeft: 20,
  },
  wmsImage: {
    maxWidth: '100%',
    height: 'auto',
  },
});
