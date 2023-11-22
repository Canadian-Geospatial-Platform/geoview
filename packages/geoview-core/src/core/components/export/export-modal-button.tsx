import { useContext } from 'react';
import { IconButton, DownloadIcon } from '@/ui';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { MapContext } from '@/core/app-start';

/**
 * Interface used for export button properties
 */
interface ExportProps {
  className?: string;
}

/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function Export(props: ExportProps): JSX.Element {
  const { className } = props;

  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  // get store function
  const { openModal } = useUIStoreActions();

  return (
    <IconButton
      id={`${mapId}-export-btn`}
      tooltip="appbar.export"
      tooltipPlacement="bottom-end"
      onClick={() => openModal({ activeElementId: 'export', callbackElementId: `${mapId}-export-btn` })}
      className={className}
    >
      <DownloadIcon />
    </IconButton>
  );
}

/**
 * default properties values
 */
Export.defaultProps = {
  className: '',
};
