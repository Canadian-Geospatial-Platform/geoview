import { useContext } from 'react';

import { MapContext } from '../../../app-start';

import { api } from '../../../../app';

import { Button, ZoomInIcon } from '../../../../ui';

/**
 * Zoom in button properties
 */
interface ZoomInProps {
  className?: string;
  iconClassName?: string;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
  iconClassName: '',
};

/**
 * Create a zoom in button
 *
 * @param {ZoomInProps} props zoom in button properties
 * @returns {JSX.Element} return the created zoom in button
 */
export default function ZoomIn(props: ZoomInProps): JSX.Element {
  const { className, iconClassName } = props;

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  /**
   * Causes the map to zoom in
   */
  function zoomIn() {
    const { map } = api.map(mapId);

    const currentZoom = map.getView().getZoom();

    if (currentZoom) map.getView().animate({ zoom: currentZoom + 0.5, duration: 500 });
  }

  return (
    <Button
      id="zoomIn"
      type="icon"
      tooltip="mapnav.zoomIn"
      tooltipPlacement="left"
      icon={<ZoomInIcon />}
      onClick={() => zoomIn()}
      className={className}
      iconClassName={iconClassName}
    />
  );
}

ZoomIn.defaultProps = defaultProps;
