import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  navBarRef: {
    position: 'absolute',
    right: theme.spacing(5),
    // height: '600px',
    // maxHeight: 'calc( 100% - 200px)',
    display: 'flex',
    flexDirection: 'row',
    marginRight: 0,
    zIndex: 150,
    pointerEvents: 'all',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transition: 'bottom 300ms ease-in-out',
  },
  navBtnGroupContainer: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    pointerEvents: 'auto',
    justifyContent: 'end',
    overflowY: 'hidden',
    padding: 5,
  },
  navBtnGroup: {
    borderRadius: theme.spacing(5),
    backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
    '&:not(:last-child)': {
      marginBottom: theme.spacing(11),
    },
    '& .MuiButtonGroup-grouped:not(:last-child)': {
      borderColor: theme.palette.geoViewColor.bgColor.light[900],
    },
  },
  navButton: {
    backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
    color: theme.palette.geoViewColor.bgColor.dark[900],
    borderRadius: theme.spacing(5),
    width: '44px',
    height: '44px',
    maxWidth: '44px',
    minWidth: '44px',
    padding: 'initial',
    transition: 'background-color 0.3s ease-in-out',
    '&:not(:last-of-type)': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.light[900]}`,
    },
    '&:not(:first-of-type)': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
      color: theme.palette.geoViewColor.bgColor.dark[700],
    },
    '&:focus': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
      color: theme.palette.geoViewColor.bgColor.dark[700],
    },
    '&:active': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
      color: theme.palette.geoViewColor.bgColor.dark[950],
    },
  },
});
