import HomeIcon from "@mui/icons-material/Home";

import { useMap } from "react-leaflet";

import { Button } from "../../../../ui";

export default function Home(): JSX.Element {
  // get map and set initial bounds to use in zoom home
  const map = useMap();
  const initBounds = map.getBounds();

  function setHome() {
    map.fitBounds(initBounds);
  }

  return (
    <Button
      id="home"
      type="icon"
      tooltip="mapnav.home"
      tooltipPlacement="left"
      icon={<HomeIcon />}
      onClick={setHome}
    />
  );
}
