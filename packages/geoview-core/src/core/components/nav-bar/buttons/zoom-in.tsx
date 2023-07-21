import { useContext } from 'react';

import { MapContext } from '../../../app-start';

import { api } from '../../../../app';

import { IconButton, ZoomInIcon } from '@/ui';

/**
 * Zoom in button properties
 */
interface ZoomInProps {
  className?: string;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Create a zoom in button
 *
 * @param {ZoomInProps} props zoom in button properties
 * @returns {JSX.Element} return the created zoom in button
 */
export default function ZoomIn(props: ZoomInProps): JSX.Element {
  const { className } = props;

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Causes the map to zoom in
   */
  function zoomIn() {
    const { map } = api.map(mapId);

    const currentZoom = map.getView().getZoom();

    if (currentZoom) map.getView().animate({ zoom: currentZoom + 0.5, duration: 500 });
  }

  return (
    <IconButton id="zoomIn" tooltip="mapnav.zoomIn" tooltipPlacement="left" onClick={() => zoomIn()} className={className}>
      <ZoomInIcon />
    </IconButton>
  );
}

ZoomIn.defaultProps = defaultProps;
