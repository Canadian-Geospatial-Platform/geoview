import { memo, ReactNode, useEffect, useRef } from 'react';
import { DialogProps } from '@mui/material';
import { CloseIcon, Dialog, DialogContent, IconButton } from '@/ui';

interface FullScreenDialogProps extends DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Constant styles to prevent recreation on each render
const DIALOG_CONTENT_STYLES = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'end',
} as const;

const CLOSE_BUTTON_STYLES = {
  marginBottom: '1.5rem',
} as const;

// Memoizes entire component, preventing re-renders if props haven't changed
// TODO: Unmemoize this component, probably, because it's in 'common' folder
export const FullScreenDialog = memo(function FullScreenDialog({
  open,
  onClose,
  children,
  ...dialogProps
}: FullScreenDialogProps): JSX.Element {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const closeButton = document.querySelector('.buttonFilledOutline') as HTMLButtonElement;
        if (closeButton) {
          closeButton.focus();
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [open]);



  return (
    <Dialog
      fullScreen
      maxWidth="xl"
      open={open}
      onClose={onClose}
      disablePortal={false}
      {...dialogProps}
      sx={{ maxHeight: '100% !important' }}
    >
      <DialogContent sx={DIALOG_CONTENT_STYLES}>
        <IconButton 
          ref={closeButtonRef}
          onClick={onClose} 
          color="primary" 
          className="buttonFilledOutline" 
          sx={CLOSE_BUTTON_STYLES}
        >
          <CloseIcon />
        </IconButton>
        {children}
      </DialogContent>
    </Dialog>
  );
});
