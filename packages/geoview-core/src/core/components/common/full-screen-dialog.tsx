import type { ReactNode } from 'react';
import { memo, useRef, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import type { DialogProps } from '@mui/material';

import { CloseIcon, Dialog, DialogTitle, DialogContent, IconButton, Box } from '@/ui';
import { logger } from '@/core/utils/logger';

/** Properties for the FullScreenDialog component. */
interface FullScreenDialogProps extends DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback fired when dialog closes. Matches MUI Dialog signature */
  onClose: (event?: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
  /** Callback when dialog exit animation completes */
  onExited?: () => void;
  /** Title text for the dialog header */
  title: string;
  /** Dialog content elements */
  children: ReactNode;
}

/** Styles for the dialog content container. */
const DIALOG_CONTENT_STYLES = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'end',
} as const;

/** Styles for the close button. */
const CLOSE_BUTTON_STYLES = {
  margin: '10px',
} as const;

/** Styles for the dialog header container. */
const DIALOG_HEADER_STYLES = (theme: Theme): SxProps => ({
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}`,
});

/** Styles for the dialog title text. */
const DIALOG_TITLE_STYLES = (theme: Theme): SxProps => ({
  fontSize: theme.palette.geoViewFontSize.lg,
  fontWeight: '600',
});

/**
 * Fullscreen dialog with custom header and accessibility features.
 *
 * Wraps Material-UI's Dialog with fullscreen layout, custom header with close button,
 * and body scroll lock management. Handles focus management for keyboard accessibility.
 *
 * @param props - Fullscreen dialog configuration (see FullScreenDialogProps)
 * @returns Fullscreen dialog component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
// TODO: Unmemoize this component, probably, because it's in 'common' folder
export const FullScreenDialog = memo(function FullScreenDialog({
  open,
  onClose,
  onExited,
  title,
  children,
  ...dialogProps
}: FullScreenDialogProps): JSX.Element {
  // Log
  logger.logTraceRender('components/common/full-screen-dialog');

  // Ref for the close button
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  // Manage body scroll when dialog is open
  useEffect(() => {
    logger.logTraceUseEffect('FULL-SCREEN DIALOG - body scroll lock', open);

    if (!open) {
      // When dialog is not open, do not modify body overflow
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cleanup: restore previous overflow when dialog closes or component unmounts
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <Dialog
      disableAutoFocus
      disableRestoreFocus
      fullScreen
      maxWidth="xl"
      open={open}
      onClose={(event, reason) => {
        // Call the original onClose handler with parameters
        // Material-UI Dialog automatically handles ESC key presses and backdrop clicks.
        // We forward the event and reason ('escapeKeyDown' | 'backdropClick') to the parent
        // so they can differentiate how the dialog was closed if needed.
        // Focus restoration after closing is handled separately via onExited callback.
        onClose(event, reason);
      }}
      slotProps={{
        transition: {
          onEntered: () => {
            // Focus on the close button after dialog opens for keyboard accessibility.
            // This ensures keyboard users know where they are and can easily close the dialog
            // with Enter/Space (or ESC key which is handled by Material-UI automatically).
            closeButtonRef.current?.focus();
          },
          onExited,
        },
      }}
      disablePortal={false}
      {...dialogProps}
    >
      <Box sx={DIALOG_HEADER_STYLES(theme)}>
        <DialogTitle sx={DIALOG_TITLE_STYLES(theme)}>{title}</DialogTitle>
        <IconButton
          iconRef={closeButtonRef}
          onClick={(event) => onClose(event, 'backdropClick')}
          aria-label={t('general.closeFullscreen')}
          color="primary"
          className="buttonFilledOutline"
          sx={CLOSE_BUTTON_STYLES}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={DIALOG_CONTENT_STYLES}>{children}</DialogContent>
    </Dialog>
  );
});
