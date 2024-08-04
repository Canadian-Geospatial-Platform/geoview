import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  dialog: {
    position: 'absolute',
    "& ~ & > div[class*='backdrop']": {
      backgroundColor: 'transparent',
    },
    '& .MuiPaper-root': {
      width: 450,
      height: 'auto',
      borderRadius: '6px',
    },
  },
  backdrop: {
    position: 'absolute',
    background: theme.palette?.backdrop,
  },
  content: {
    padding: theme.spacing(5, 0),
    whiteSpace: 'pre-line',
  },
  modalTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 10px',
  },
  modalTitleLabel: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  modalTitleActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  headerActionsContainer: {
    display: 'flex',
    padding: '5px 10px',
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(3),
    },
  },
  closedModal: {
    display: 'none',
  },
  createdAction: {
    width: `30%`,
    alignSelf: 'flex-end',
    '& > * ': {
      textAlign: 'center',
    },
  },
});
