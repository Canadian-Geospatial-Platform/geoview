import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the MUI modal
 *
 * @param {Theme} theme the theme object
 * @param {string | number} [width] - Optional width for the dialog
 * @param {string | number} [height] - Optional height for the dialog
 * @returns {Object} the sx classes object
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

/**
 * Get dialog styles with optional width and height
 *
 * @param {SxStyles} baseDialogStyle - The base dialog style from sxClasses.dialog
 * @param {string | number} [width] - Optional width for the dialog
 * @param {string | number} [height] - Optional height for the dialog
 * @returns {SxStyles} The merged dialog styles
 * @deprecated Use getSxClasses with width and height parameters instead
 */
export const getDialogWithSize = (baseDialogStyle: SxStyles, width?: string | number, height?: string | number): SxStyles => ({
  ...baseDialogStyle,
  ...(width || height
    ? {
        '& .MuiDialog-paper': {
          ...(width && { width }),
          ...(height && { height, maxHeight: 'calc(90vh - 200px)' }),
          maxWidth: 'none',
        },
      }
    : {}),
});
