import { useMap } from "react-leaflet";

import { Button, ZoomOutIcon } from "../../../../ui";

export default function ZoomOut(): JSX.Element {
  // get map to use in zoom function
  const map = useMap();

  function zoomOut() {
    map.zoomOut();
  }

  return (
    <Button
      id="zoomOut"
      type="icon"
      tooltip="mapnav.zoomOut"
      tooltipPlacement="left"
      icon={<ZoomOutIcon />}
      onClick={zoomOut}
    />
  );
}
