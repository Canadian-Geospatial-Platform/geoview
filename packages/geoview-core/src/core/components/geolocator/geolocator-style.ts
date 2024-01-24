import { Input, styled } from '@mui/material';

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
      fontSize: '14px',
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
  main: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& span': {
      fontSize: '0.75rem',
      ':first-of-type': {
        fontWeight: 'bold',
        fontSize: '0.875rem',
      },
    },
  },
};

export const StyledInputField = styled(Input)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  fontSize: '1rem',
  '& .MuiInputBase-input': {
    transition: theme.transitions.create('width'),
    width: '100%',
  },
})) as unknown as typeof Input;
