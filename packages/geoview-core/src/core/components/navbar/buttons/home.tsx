import { useContext } from "react";

import { MapContext } from "../../../app-start";

import { Button, HomeIcon } from "../../../../ui";

import { api } from "../../../../api/api";

/**
 * Interface used for home button properties
 */
interface HomeProps {
  className?: string | undefined;
}

/**
 * Create a home button to return the user to the map center
 *
 * @param {HomeProps} props the home button properties
 * @returns {JSX.Element} the created home button
 */
export default function Home(props: HomeProps): JSX.Element {
  const { className } = props;

  const mapConfig = useContext(MapContext)!;

  const mapId = mapConfig.id;

  /**
   * Return user to map initial center
   */
  function setHome() {
    // get map and set initial bounds to use in zoom home
    const initBounds = api.map(mapId).map.getBounds();

    api.map(mapId).map.fitBounds(initBounds);
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
