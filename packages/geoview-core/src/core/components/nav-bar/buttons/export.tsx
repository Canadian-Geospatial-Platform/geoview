import { MouseEventHandler } from 'react';

import { useTheme } from '@mui/material/styles';

import { IconButton, DownloadIcon } from '@/ui';
import { getSxClasses } from '../nav-bar-style';

/**
 * Interface used for home button properties
 */
interface ExportProps {
  openModal: MouseEventHandler<HTMLButtonElement>;
}

/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function Export(props: ExportProps): JSX.Element {
  const { openModal } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <IconButton id="export" tooltip="mapnav.export" tooltipPlacement="left" onClick={openModal} sx={sxClasses.navButton}>
      <DownloadIcon />
    </IconButton>
  );
}
