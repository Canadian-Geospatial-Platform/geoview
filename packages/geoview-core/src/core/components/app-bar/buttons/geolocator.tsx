import { useState } from 'react';
import { IconButton, SearchIcon } from '@/ui';
import { getGeoViewStore } from '@/core/stores/stores-managers';

/**
 * Interface used for geolocator button properties
 */
interface GeolocatorProps {
  mapId: string;
  className?: string | undefined;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Geolocator Button component
 *
 * @returns {JSX.Element} the geolocator button
 */
export default function Geolocator(props: GeolocatorProps): JSX.Element {
  const { mapId, className } = props;
  const [active, setActive] = useState(true);
  const store = getGeoViewStore(mapId);

  const click = () => {
    setActive(!active);
    store.setState({
      appBarState: { ...store.getState().appBarState, geoLocatorActive: active },
    });
  };

  return (
    <IconButton
      id="geolocator"
      tooltip="appbar.geolocator"
      tooltipPlacement="bottom-end"
      onClick={click}
      className={`${className} ${active ? 'active' : ''}`}
    >
      <SearchIcon />
    </IconButton>
  );
}

Geolocator.defaultProps = defaultProps;
