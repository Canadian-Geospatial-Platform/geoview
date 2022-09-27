import { useContext } from 'react';

import { fromLonLat } from 'ol/proj';

import { MapContext } from '../../../app-start';

import { IconButton, HomeIcon } from '../../../../ui';

import { api } from '../../../../app';

/**
 * Interface used for home button properties
 */
interface HomeProps {
  className?: string | undefined;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Create a home button to return the user to the map center
 *
 * @param {HomeProps} props the home button properties
 * @returns {JSX.Element} the created home button
 */
export default function Home(props: HomeProps): JSX.Element {
  const { className } = props;

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  /**
   * Return user to map initial center
   */
  function setHome() {
    // get map and set initial bounds to use in zoom home
    const { center, zoom } = api.map(mapId).mapFeaturesConfig.map.viewSettings;

    const { currentProjection } = api.map(mapId);

    const projectionConfig = api.projection.projections[currentProjection];

    api
      .map(mapId)
      .map.getView()
      .animate({
        center: fromLonLat(center, projectionConfig),
        duration: 500,
        zoom,
      });
  }

  return (
    <IconButton id="home" tooltip="mapnav.home" tooltipPlacement="left" onClick={() => setHome()} className={className}>
      <HomeIcon />
    </IconButton>
  );
}

Home.defaultProps = defaultProps;
