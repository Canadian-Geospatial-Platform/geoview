import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the modal component.
 *
 * @param theme - The MUI theme object
 * @param width - Optional width for the dialog
 * @param height - Optional height for the dialog
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme, width?: string | number, height?: string | number): SxStyles => ({
  dialog: {
    position: 'absolute',
    "& ~ & > div[class*='backdrop']": {
      backgroundColor: 'transparent',
    },
    '& .MuiPaper-root': {
      borderRadius: '6px',
    },
    ...(width || height
      ? {
          '& .MuiDialog-paper': {
            ...(width && { width }),
            ...(height && { height, maxHeight: 'calc(90vh - 200px)' }),
            maxWidth: 'none',
          },
        }
      : {}),
  },
  backdrop: {
    position: 'absolute',
    background: theme.palette?.backdrop,
  },
  content: {
    padding: theme.spacing(0.75, 0),
    whiteSpace: 'pre-line',
  },
  modalTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1.25),
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[300]}`,
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
    padding: theme.spacing(0.5, 1.25),
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(0.5),
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
