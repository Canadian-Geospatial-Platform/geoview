import { useContext, useState } from 'react';

import { MapContext } from '../../../app-start';

import { api } from '../../../../app';

import { Button, FullscreenIcon, FullscreenExitIcon } from '../../../../ui';

import { TypeHTMLElement } from '../../../types/cgpv-types';

/**
 * Interface used for fullscreen button properties
 */
interface FullscreenProps {
  className?: string;
  iconClassName?: string;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
  iconClassName: '',
};

/**
 * Create a toggle button to toggle between fullscreen
 *
 * @param {FullscreenProps} props the fullscreen button properties
 * @returns {JSX.Element} the fullscreen toggle button
 */
export default function Fullscreen(props: FullscreenProps): JSX.Element {
  const { className, iconClassName } = props;

  const [fs, setFs] = useState(false);

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  // TODO: need to trap the exit full screen event by ESC to arrange the fs state and icon
  /**
   * Toggle between fullscreen and window mode
   */
  function setFullscreen() {
    // api.map(mapId).map.getTargetElement().requestFullscreen();
    const { parentElement } = api.map(mapId).map.getTargetElement();

    if (parentElement) {
      setFs(!fs);
      api.map(mapId).toggleFullscreen(!fs, parentElement as TypeHTMLElement);
    }
  }

  return (
    <Button
      id="fullscreen"
      type="icon"
      tooltip="mapnav.fullscreen"
      tooltipPlacement="left"
      icon={!fs ? <FullscreenIcon /> : <FullscreenExitIcon />}
      onClick={() => setFullscreen()}
      className={className}
      iconClassName={iconClassName}
    />
  );
}

Fullscreen.defaultProps = defaultProps;
