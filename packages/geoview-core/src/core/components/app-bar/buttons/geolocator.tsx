import { useState } from 'react';
import { IconButton, SearchIcon } from '@/ui';
import { useUIStoreActions } from '@/core/stores/ui-state';

/**
 * Interface used for geolocator button properties
 */
interface GeolocatorProps {
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
  const { sx = {} } = props;
  const [active, setActive] = useState(true);

  const { setGeolocatorActive } = useUIStoreActions();

  const click = () => {
    setActive(!active);

    setGeolocatorActive(active);
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
