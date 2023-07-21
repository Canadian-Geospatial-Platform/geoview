import { useContext, useState } from 'react';

import { MapContext } from '../../../app-start';

import { api } from '@/app';

import { IconButton, FullscreenIcon, FullscreenExitIcon } from '@/ui';
import { TypeHTMLElement } from '../../../types/global-types';

/**
 * Interface used for fullscreen button properties
 */
interface FullscreenProps {
  className?: string;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Create a toggle button to toggle between fullscreen
 *
 * @param {FullscreenProps} props the fullscreen button properties
 * @returns {JSX.Element} the fullscreen toggle button
 */
export default function Fullscreen(props: FullscreenProps): JSX.Element {
  const { className } = props;

  const [fs, setFs] = useState(false);

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  // TODO: need to trap the exit full screen event by ESC to arrange the fs state and icon
  /**
   * Toggle between fullscreen and window mode
   */
  function setFullscreen() {
    // api.map(mapId).map.getTargetElement().requestFullscreen();
    const element = document.getElementById(`shell-${mapId}`);

    if (element) {
      setFs(!fs);
      api.map(mapId).toggleFullscreen(!fs, element as TypeHTMLElement);
    }
  }

  return (
    <IconButton id="fullscreen" tooltip="mapnav.fullscreen" tooltipPlacement="left" onClick={() => setFullscreen()} className={className}>
      {!fs ? <FullscreenIcon /> : <FullscreenExitIcon />}
    </IconButton>
  );
}

Fullscreen.defaultProps = defaultProps;
