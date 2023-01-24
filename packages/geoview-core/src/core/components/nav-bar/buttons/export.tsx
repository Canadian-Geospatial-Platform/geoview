import { MouseEventHandler } from 'react';
import { IconButton, DownloadIcon } from '../../../../ui';

/**
 * Interface used for home button properties
 */
interface ExportProps {
  className?: string | undefined;
  openModal: MouseEventHandler<HTMLButtonElement>;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function Export(props: ExportProps): JSX.Element {
  const { className, openModal } = props;

  return (
    <IconButton id="export" tooltip="mapnav.export" tooltipPlacement="left" onClick={openModal} className={className}>
      <DownloadIcon />
    </IconButton>
  );
}

Export.defaultProps = defaultProps;
