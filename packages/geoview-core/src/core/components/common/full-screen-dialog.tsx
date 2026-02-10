import type { ReactNode } from 'react';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { DialogProps } from '@mui/material';
import { CloseIcon, Dialog, DialogTitle, DialogContent, IconButton, Box } from '@/ui';

interface FullScreenDialogProps extends DialogProps {
  open: boolean;
  onClose: (event?: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void; // Callback fired when dialog closes. Matches MUI Dialog signature.
  onExited?: () => void; // Callback when dialog exit animation completes
  title: string;
  children: ReactNode;
}

// Constant styles to prevent recreation on each render
const DIALOG_CONTENT_STYLES = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'end',
} as const;

const CLOSE_BUTTON_STYLES = {
  margin: '10px',
} as const;

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
  // Ref for the close button
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  return (
    <Dialog
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
      onTransitionExited={onExited}
      slotProps={{
        transition: {
          onEntered: () => {
            // Focus on the close button after dialog opens for keyboard accessibility.
            // This ensures keyboard users know where they are and can easily close the dialog
            // with Enter/Space (or ESC key which is handled by Material-UI automatically).
            closeButtonRef.current?.focus();
          },
        },
      }}
      disablePortal={false}
      {...dialogProps}
      sx={{ maxHeight: '100% !important' }}
    >
      <Box sx={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}`}}>
        <DialogTitle sx={{fontSize: theme.palette.geoViewFontSize.lg, fontWeight: '600'}}>
          {title}
        </DialogTitle>
        <IconButton
          iconRef={closeButtonRef}
          onClick={(event) => onClose(event, 'backdropClick')}
          aria-label={t('general.close')}
          color="primary"
          className="buttonFilledOutline"
          sx={CLOSE_BUTTON_STYLES}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={DIALOG_CONTENT_STYLES}>
        {children}
      </DialogContent>
    </Dialog>
  );
});
