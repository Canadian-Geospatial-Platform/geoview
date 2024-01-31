import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  rightIcons: {
    backgroundColor: theme.palette.geoViewColors.bgColor.dark[100],
    marginTop: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    borderTop: 1,
    paddingTop: '0 !important',
    borderColor: 'divider',
    height: '100%',
  },
  tab: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 'min(4vw, 24px)',
    padding: '16px 2%',
    textTransform: 'capitalize',
    '&.Mui-selected': {
      color: 'secondary.main',
    },
    '.MuiTab-iconWrapper': {
      marginRight: '7px',
      maxWidth: '18px',
    },
  },
});
