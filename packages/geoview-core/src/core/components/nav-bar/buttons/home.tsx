import { useContext } from 'react';

import { fromLonLat } from 'ol/proj';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';

import { MapContext } from '../../../app-start';

import { IconButton, HomeIcon } from '@/ui';

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

  const { mapId } = mapConfig;

  /**
   * Return user to map initial center
   */
  function setHome() {
    // get map and set initial bounds to use in zoom home
    const { center, zoom } = api.map(mapId).mapFeaturesConfig.map.viewSettings;

    const { currentProjection } = api.map(mapId);

    const projectionConfig = api.projection.projections[currentProjection];

    const projectedCoords = fromLonLat(center, projectionConfig);
    const extent: Extent = [...projectedCoords, ...projectedCoords];

    const options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: zoom, duration: 500 };

    api.map(mapId).zoomToExtent(extent, options);
  }

  return (
    <IconButton id="home" tooltip="mapnav.home" tooltipPlacement="left" onClick={() => setHome()} className={className}>
      <HomeIcon />
    </IconButton>
  );
}

Home.defaultProps = defaultProps;
