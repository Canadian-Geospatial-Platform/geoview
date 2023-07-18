/* eslint-disable react/require-default-props */
import { useState } from 'react';
import { Popover as MaterialPopover } from '@mui/material';
import { IconButton, HomeIcon } from '..';

/**
 * Properties for the Popover element
 */
interface PopoverProps {
  className?: string | undefined;
}

// const sxClasses = {
//   loadingIcon: {
//     animation: 'rotate 1s infinite linear',
//     '@keyframes rotate': {
//       from: {
//         transform: 'rotate(360deg)',
//       },
//       to: {
//         transform: 'rotate(0deg)',
//       },
//     },
//   },
// };

/**
 * Create a customized Material UI Popover
 *
 * @param {PopoverProps} props the properties passed to the Popover element
 * @returns {JSX.Element} the created Popover element
 */
export function Popover(props: PopoverProps): JSX.Element {
  const { className = '' } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  // TODO This file needs more modicaiton to make dynamic anchorOrigin and transformOrigin

  return (
    <>
      <IconButton
        aria-describedby={id}
        id="version-button"
        tooltip="appbar.version"
        tooltipPlacement="bottom-end"
        onClick={handleClick}
        className={className}
      >
        <HomeIcon />
      </IconButton>
      <MaterialPopover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
      >
        Content of popover
      </MaterialPopover>
    </>
  );
}
