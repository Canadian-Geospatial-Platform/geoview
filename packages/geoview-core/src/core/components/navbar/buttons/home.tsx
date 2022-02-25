import { useMap } from "react-leaflet";

import { Button, HomeIcon } from "../../../../ui";

interface HomeProps {
  className?: string | undefined;
}

export default function Home(props: HomeProps): JSX.Element {
  const { className } = props;
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
      className={className}
    />
  );
}
