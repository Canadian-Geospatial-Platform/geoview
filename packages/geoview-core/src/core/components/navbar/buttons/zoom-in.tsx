import { useMap } from "react-leaflet";

import { Button, ZoomInIcon } from "../../../../ui";

interface ZoomInProps {
  className?: string | undefined;
}

export default function ZoomIn(props: ZoomInProps): JSX.Element {
  const { className } = props;
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
      className={className}
    />
  );
}
