import { Input, styled } from '@mui/material';

export const sxClasses = {
  root: {
    position: 'absolute',
    top: 16,
    left: 80,
    maxWidth: 400,
    width: 400,
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
  searchResult: {
    position: 'relative',
    display: 'flex',
    zIndex: 1100,
    marginTop: 6,
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
