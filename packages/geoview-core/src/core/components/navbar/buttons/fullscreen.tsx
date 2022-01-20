import { useState } from "react";

import FullscreenIcon from "@material-ui/icons/Fullscreen";
import FullscreenExitIcon from "@material-ui/icons/FullscreenExit";

import { useMap } from "react-leaflet";

import { ButtonMapNav } from "../button";

import { api } from "../../../../api/api";

export default function Fullscreen(): JSX.Element {
  const map = useMap();

  // TODO: need to trap the exit full screen event by ESC to arrange the fs state and icon
  const [fs, setFs] = useState(false);
  function setFullscreen() {
    setFs(!fs);
    api.map(map.id).toggleFullscreen(map.getContainer());
  }

  return (
    <ButtonMapNav
      tooltip="mapnav.fullscreen"
      icon={!fs ? <FullscreenIcon /> : <FullscreenExitIcon />}
      onClickFunction={setFullscreen}
    />
  );
}
