import { DialogProps } from '@mui/material';
import { ReactNode } from 'react';
import { CloseIcon, Dialog, DialogContent, IconButton } from '@/ui';

interface FullScreenDialogProps extends DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

function FullScreenDialog(props: FullScreenDialogProps) {
  const { open, onClose, children } = props;

  return (
    <Dialog fullScreen maxWidth="xl" open={open} onClose={onClose}>
      <DialogContent>
        <IconButton onClick={onClose} color="primary" className="style2">
          <CloseIcon />
        </IconButton>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default FullScreenDialog;
