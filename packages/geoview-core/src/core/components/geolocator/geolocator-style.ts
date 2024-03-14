import { Input, Theme, styled } from '@mui/material';

export const sxClasses = {
  root: {
    position: 'absolute',
    top: 12,
    left: 80,
    maxWidth: 350,
    width: 350,
  },
  geolocator: {
    position: 'relative',
    display: 'flex',
    zIndex: 1100,
    '& form': {
      display: 'flex',
      width: '100%',
      paddingLeft: 5,
    },
    '& .MuiPaper-root': {
      backgroundColor: 'background.default',
      color: 'text.primary',
      '& .MuiToolbar-root': {
        justifyContent: 'space-between',
      },
    },
  },
  progressBar: {
    position: 'relative',
    zIndex: 1100,
    '& span': {
      width: '100%',
    },
  },
  filter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'end',
    padding: 6,
    paddingTop: 2,
    '& .MuiInputLabel-formControl': {
      fontSize: (theme: Theme) => theme.palette.geoViewFontSize.default,
      marginTop: 0,
    },
    '& .MuiSelect-select': {
      padding: '0px 12px 4px 0px !important',
    },
  },
  searchResult: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1100,
    marginTop: 6,
  },
  filterListError: {
    listStyleType: 'disc',
    listStylePosition: 'inside',
    '& li': {
      display: 'list-item',
      paddingLeft: 12,
      '& .MuiListItemText-root': {
        display: 'inline-flex',
        marginLeft: '-8px',
      },
    },
  },
};

export const sxClassesList = {
  listStyle: {
    fontSize: (theme: Theme) => theme.palette.geoViewFontSize.sm,
    '& .list-title': {
      '>div': {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
  },
  main: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& span': {
      fontSize: (theme: Theme) => theme.palette.geoViewFontSize.xs,
      ':first-of-type': {
        fontSize: (theme: Theme) => theme.palette.geoViewFontSize.sm,
      },
    },
  },
};

export const StyledInputField = styled(Input)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  fontSize: theme.palette.geoViewFontSize.default,
  '& .MuiInputBase-input': {
    transition: theme.transitions.create('width'),
    width: '100%',
  },
})) as unknown as typeof Input;
