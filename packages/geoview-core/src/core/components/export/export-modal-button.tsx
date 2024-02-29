import { IconButton, DownloadIcon } from '@/ui';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/app';

/**
 * Interface used for export button properties
 */
interface ExportProps {
  className?: string;
  sxDetails?: object;
}

/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function ExportButton(props: ExportProps): JSX.Element {
  const { className, sxDetails } = props;

  // get store function
  const mapId = useGeoViewMapId();
  const { openModal } = useUIStoreActions();

  return (
    <IconButton
      id={`${mapId}-export-btn`}
      tooltip="appbar.export"
      tooltipPlacement="bottom-end"
      onClick={() => openModal({ activeElementId: 'export', callbackElementId: `${mapId}-export-btn` })}
      sx={sxDetails}
      className={className}
    >
      <DownloadIcon />
    </IconButton>
  );
}

/**
 * default properties values
 */
ExportButton.defaultProps = {
  className: '',
  sxDetails: undefined,
};
