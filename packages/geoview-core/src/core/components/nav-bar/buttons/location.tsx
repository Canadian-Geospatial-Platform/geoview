import { useContext } from 'react';

import { fromLonLat } from 'ol/proj';

import { MapContext } from '../../../app-start';

import { IconButton, EmojiPeopleIcon } from '../../../../ui';

import { Coordinate, api } from '../../../../app';

/**
 * Interface used for location button properties
 */
interface LocationProps {
  className?: string | undefined;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Create a location button to zoom to user location
 *
 * @param {LocationProps} props the location button properties
 * @returns {JSX.Element} the created location button
 */
export default function Location(props: LocationProps): JSX.Element {
  const { className } = props;

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Zoom to user location
   */
  function zoomToMe() {
    let coordinates: Coordinate = [];
    function success(pos: GeolocationPosition) {
      coordinates = [pos.coords.longitude, pos.coords.latitude];
      const { currentProjection } = api.map(mapId);
      const projectionConfig = api.projection.projections[currentProjection];

      api
        .map(mapId)
        .map.getView()
        .animate({
          center: fromLonLat(coordinates, projectionConfig),
          duration: 500,
          zoom: 10,
        });
    }

    function error(err: GeolocationPositionError) {
      // eslint-disable-next-line no-console
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error);
  }

  return (
    <IconButton id="location" tooltip="mapnav.location" tooltipPlacement="left" onClick={() => zoomToMe()} className={className}>
      <EmojiPeopleIcon />
    </IconButton>
  );
}

Location.defaultProps = defaultProps;
