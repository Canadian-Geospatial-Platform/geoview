import { ZoomInIcon } from "../../../../ui";

import { useMap } from "react-leaflet";

import { Button } from "../../../../ui";

export default function ZoomIn(): JSX.Element {
  // get map to use in zoom function
  const map = useMap();

  function zoomIn() {
    map.zoomIn();
  }

  return (
    <Button
      id="zoomIn"
      type="icon"
      tooltip="mapnav.zoomIn"
      tooltipPlacement="left"
      icon={<ZoomInIcon />}
      onClick={zoomIn}
    />
  );
}
