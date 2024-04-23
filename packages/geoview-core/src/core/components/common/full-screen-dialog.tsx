import { DialogProps } from '@mui/material';
import { ReactNode } from 'react';
import { CloseIcon, Dialog, DialogContent, IconButton } from '@/ui';

interface FullScreenDialogProps extends DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

function FullScreenDialog(props: FullScreenDialogProps): JSX.Element {
  const { open, onClose, children } = props;

  return (
    <Dialog fullScreen maxWidth="xl" open={open} onClose={onClose} disablePortal>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
        <IconButton onClick={onClose} color="primary" className="style2" sx={{ marginBottom: '1.5rem' }}>
          <CloseIcon />
        </IconButton>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default FullScreenDialog;
