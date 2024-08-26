import { useState } from "react";
import { Button, IconButton, Snackbar } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface CopyToClipboardButtonProps {
  textToCopy: string;
}

export const CopyToClipboardButton = (props: CopyToClipboardButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
    navigator.clipboard.writeText(props.textToCopy);
  };

  return (
    <>
      <Button size="small" onClick={handleClick} variant="contained" color="primary" startIcon={<ContentCopyIcon />}>
        Copy to Clipboard
      </Button>
      <Snackbar
        message="Copied to clibboard"
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  );
};

