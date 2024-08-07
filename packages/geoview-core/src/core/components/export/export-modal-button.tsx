import { IconButton, DownloadIcon } from '@/ui';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

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
export default function ExportButton({ className = '', sxDetails }: ExportProps): JSX.Element {
  // get store function
  const mapId = useGeoViewMapId();
  const { enableFocusTrap } = useUIStoreActions();

  return (
    <IconButton
      id={`${mapId}-export-btn`}
      tooltip="appbar.export"
      tooltipPlacement="bottom-end"
      onClick={() => enableFocusTrap({ activeElementId: 'export', callbackElementId: `${mapId}-export-btn` })}
      sx={sxDetails}
      className={className}
      aria-label="appbar.export"
    >
      <DownloadIcon />
    </IconButton>
  );
}
