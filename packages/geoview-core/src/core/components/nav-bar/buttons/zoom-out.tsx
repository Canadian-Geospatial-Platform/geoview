import { useContext } from 'react';
import { api } from '@/app';
import { IconButton, ZoomOutIcon } from '@/ui';
import { MapContext } from '@/core/app-start';

/**
 * Zoom out button properties
 */
interface ZoomOutProps {
  className?: string;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Create a zoom out button
 *
 * @param {ZoomOutProps} props the zoom out button properties
 * @returns {JSX.Element} return the new created zoom out button
 */
export default function ZoomOut(props: ZoomOutProps): JSX.Element {
  const { className } = props;

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Causes the map to zoom out
   */
  function zoomOut() {
    const { map } = api.map(mapId);

    const currentZoom = map.getView().getZoom();

    if (currentZoom) map.getView().animate({ zoom: currentZoom - 0.5, duration: 500 });
  }

  return (
    <IconButton id="zoomOut" tooltip="mapnav.zoomOut" tooltipPlacement="left" onClick={() => zoomOut()} className={className}>
      <ZoomOutIcon />
    </IconButton>
  );
}

ZoomOut.defaultProps = defaultProps;
