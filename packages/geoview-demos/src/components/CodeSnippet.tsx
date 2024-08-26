
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';
import javascript from "highlight.js/lib/languages/javascript";
import { useEffect, useRef, useState } from "react";
import { Box, Button, IconButton, Popover, Popper } from '@mui/material';
import JavascriptIcon from '@mui/icons-material/Javascript';
import { CopyToClipboardButton } from './CopyToClipboard';

hljs.registerLanguage("javascript", javascript);

interface CodeSnippetProps {
  code?: string;
}

export const CodeSnippet = (props: CodeSnippetProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightBlock(codeRef.current);
    }
  }, []);



  return (
    <Box sx={{position: 'relative'}}>
      <Box sx={{position: 'absolute', top: 5, right: 5}}>
        <CopyToClipboardButton textToCopy={props.code || ''} />
      </Box>
      <pre>
        <code className="javascript" ref={codeRef}>
          {props.code}
        </code>
      </pre>
    </Box>
  );
};



interface CodeSnippetPopupProps extends CodeSnippetProps { }


export function CodeSnipperPopup(props: CodeSnippetPopupProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <Button aria-describedby={id} variant="contained" onClick={handleClick}>
        <JavascriptIcon />
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <CodeSnippet code={props.code} />
      </Popover>
    </div>
  );
}