import { useMap } from "react-leaflet";

import { Button, ZoomOutIcon } from "../../../../ui";

interface ZoomOutProps {
  className?: string | undefined;
}

export default function ZoomOut(props: ZoomOutProps): JSX.Element {
  const { className } = props;

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
      className={className}
    />
  );
}
