import { useState } from 'react';
import { IconButton, SearchIcon } from '@/ui';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Geolocator Button component
 *
 * @returns {JSX.Element} the geolocator button
 */
export default function Geolocator(): JSX.Element {
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
      className={`${!active ? 'style2' : ''}`}
    >
      <SearchIcon />
    </IconButton>
  );
}
