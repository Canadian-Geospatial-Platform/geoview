import { IconButton, SearchIcon } from '@/ui';
import { useUIStoreActions, useUIAppbarGeolocatorActive } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface GeoLocatorType {
  closeAllPanels: () => void;
}

/**
 * Geolocator Button component
 * @param {} closeAllPanels
 * @returns {JSX.Element} the geolocator button
 */
export default function Geolocator({ closeAllPanels }: GeoLocatorType): JSX.Element {
  const { setGeolocatorActive } = useUIStoreActions();
  const active = useUIAppbarGeolocatorActive();

  const click = (): void => {
    //  close all panels in appbar if opened any.
    if (closeAllPanels) {
      closeAllPanels();
    }
    setGeolocatorActive(!active);
  };

  return (
    <IconButton
      id="geolocator"
      tooltip="appbar.geolocator"
      tooltipPlacement="bottom-end"
      onClick={click}
      color="primary"
      className={`buttonFilled ${active ? 'active' : ''}`}
    >
      <SearchIcon />
    </IconButton>
  );
}
