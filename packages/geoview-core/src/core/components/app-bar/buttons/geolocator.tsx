import { useState } from 'react';

import { api, booleanPayload } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { IconButton, SearchIcon } from '@/ui';

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

  const click = () => {
    setActive(!active);
    api.event.emit(booleanPayload(EVENT_NAMES.GEOLOCATOR.EVENT_GEOLOCATOR_TOGGLE, mapId, active));
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
