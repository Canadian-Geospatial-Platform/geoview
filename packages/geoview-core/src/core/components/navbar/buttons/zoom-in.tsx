import { useContext } from "react";

import { MapContext } from "../../../app-start";

import { api } from "../../../../api/api";

import { Button, ZoomInIcon } from "../../../../ui";

/**
 * Zoom in button properties
 */
interface ZoomInProps {
  className?: string | undefined;
}

/**
 * Create a zoom in button
 *
 * @param {ZoomInProps} props zoom in button properties
 * @returns {JSX.Element} return the created zoom in button
 */
export default function ZoomIn(props: ZoomInProps): JSX.Element {
  const { className } = props;

  const mapConfig = useContext(MapContext)!;

  const mapId = mapConfig.id;

  /**
   * Causes the map to zoom in
   */
  function zoomIn() {
    api.map(mapId).map.zoomIn();
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
