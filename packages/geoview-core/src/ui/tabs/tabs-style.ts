import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  rightIcons: {
    backgroundColor: theme.palette.geoViewColor?.bgColor.dark[100],
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
    fontSize: theme.palette.geoViewFontSize.default,
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
  mobileDropdown: {
    maxWidth: '200px',
    p: 6,
    '& .MuiInputBase-root': {
      borderRadius: '4px',
    },
    '& .MuiSelect-select': {
      padding: '8px 12px !important',
    },
  },
});
