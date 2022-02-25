import { useState } from "react";

import { useMap } from "react-leaflet";

import { api } from "../../../../api/api";

import { Button, FullscreenIcon, FullscreenExitIcon } from "../../../../ui";

interface FullscreenProps {
  className?: string | undefined;
}

export default function Fullscreen(props: FullscreenProps): JSX.Element {
  const { className } = props;

  const map = useMap();

  // TODO: need to trap the exit full screen event by ESC to arrange the fs state and icon
  const [fs, setFs] = useState(false);
  function setFullscreen() {
    setFs(!fs);
    api.map(map.id).toggleFullscreen(map.getContainer());
  }

  return (
    <Button
      id="fullscreen"
      type="icon"
      tooltip="mapnav.fullscreen"
      tooltipPlacement="left"
      icon={!fs ? <FullscreenIcon /> : <FullscreenExitIcon />}
      onClick={setFullscreen}
      className={className}
    />
  );
}
