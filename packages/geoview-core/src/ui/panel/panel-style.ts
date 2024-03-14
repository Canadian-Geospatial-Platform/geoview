import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  panelContainer: {
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    height: 'calc(100% - 35px)',
    borderRadius: 0,
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      minWidth: '100%',
    }!,
    '& .MuiCardHeader-root': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark[50],
      borderBottomColor: theme.palette.geoViewColor?.bgColor.dark[100],
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      height: 64,
    },
    '& .MuiCardHeader-title': {
      fontSize: theme.palette.geoViewFontSize.default,
      paddingTop: 8,
      textTransform: 'uppercase',
    },
    '& .MuiCardHeader-action': {
      '& .MuiButtonBase-root': {
        border: `1px solid ${theme.palette.geoViewColor?.primary.main}`,
        height: 44,
        width: 44,
        marginRight: 8,
        transition: 'all 0.3s ease-in-out',
        '& .MuiSvgIcon-root': {
          width: 24,
          height: 24,
        },
        '&:last-child': {
          marginRight: 0,
        },
        '&:hover': {
          backgroundColor: theme.palette.geoViewColor?.bgColor.dark[100],
        },
      },
    },
  },
  panelContentContainer: {
    position: 'relative',
    flexBasis: 'auto',
    overflow: 'hidden',
    overflowY: 'auto',
    boxSizing: 'border-box',
    marginBottom: 16,
    '&:last-child': {
      paddingBottom: 0,
    },
    height: 'calc(100% - 64px)',
  },
});
