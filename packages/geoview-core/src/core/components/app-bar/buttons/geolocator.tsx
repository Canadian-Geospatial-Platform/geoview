import { useState } from 'react';
import { IconButton, SearchIcon } from '@/ui';
import { getGeoViewStore } from '@/core/stores/stores-managers';

/**
 * Interface used for geolocator button properties
 */
interface GeolocatorProps {
  mapId: string;
  sx?: React.CSSProperties;
}

/**
 * default properties values
 */
const defaultProps = {
  sx: {},
};

/**
 * Geolocator Button component
 *
 * @returns {JSX.Element} the geolocator button
 */
export default function Geolocator(props: GeolocatorProps): JSX.Element {
  const { mapId, sx = {} } = props;
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
      sx={sx}
      className={`${active ? 'active' : ''}`}
    >
      <SearchIcon />
    </IconButton>
  );
}

Geolocator.defaultProps = defaultProps;
