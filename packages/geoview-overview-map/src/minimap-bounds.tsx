// get window object
const w = window as any;

// access the cgpv object from the window object
const cgpv = w["cgpv"];

// access the api calls
const { api, react, reactLeaflet, reactLeafletCore } = cgpv;

// get event names
const EVENT_NAMES = api.eventNames;

// get react functions
const { useState, useEffect, useCallback, useMemo } = react;

// get react-leaflet events
const { useMapEvent } = reactLeaflet;

// get react-leaflet/core events
const { useEventHandlers } = reactLeafletCore;

/**
 * Interface for bound polygon properties
 */
interface MiniboundProps {
  parentId: string;
  parentMap: L.Map;
  minimap: L.Map;
  zoomFactor: number;
}

/**
 * Create and update the bound polygon of the parent's map extent
 * @param {MiniboundProps} props bound properties
 */
export const MinimapBounds = (props: MiniboundProps): JSX.Element => {
  const { parentId, parentMap, zoomFactor, minimap } = props;

  const [toggle, setToggle] = useState(false);

  // Clicking a point on the minimap sets the parent's map center
  const onClick = useCallback(
    (e) => {
      parentMap.setView(e.latlng, parentMap.getZoom());
    },
    [parentMap]
  );
  useMapEvent("click", onClick);

  // Keep track of bounds in state to trigger renders
  const [bounds, setBounds] = useState({
    height: 0,
    width: 0,
    top: 0,
    left: 0,
  });

  function updateMap(): void {
    // Update the minimap's view to match the parent map's center and zoom
    const newZoom =
      parentMap.getZoom() - zoomFactor > 0
        ? parentMap.getZoom() - zoomFactor
        : 0;

    minimap.flyTo(parentMap.getCenter(), newZoom);

    // Set in timeout the calculation to create the bound so parentMap getBounds has the updated bounds
    setTimeout(() => {
      minimap.invalidateSize();
      const pMin = minimap.latLngToContainerPoint(
        parentMap.getBounds().getSouthWest()
      );
      const pMax = minimap.latLngToContainerPoint(
        parentMap.getBounds().getNorthEast()
      );
      setBounds({
        height: pMin.y - pMax.y,
        width: pMax.x - pMin.x,
        top: pMax.y,
        left: pMin.x,
      });
    }, 500);
  }

  useEffect(() => {
    updateMap();

    // listen to API event when the overview map is toggled
    api.event.on(
      EVENT_NAMES.EVENT_OVERVIEW_MAP_TOGGLE,
      (payload: any) => {
        if (payload && parentId === payload.handlerName) {
          updateMap();
          setToggle(payload.status);
        }
      },
      parentId
    );

    // remove the listener when the component unmounts
    return () => {
      api.event.off(EVENT_NAMES.EVENT_OVERVIEW_MAP_TOGGLE, parentId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback(() => {
    updateMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimap, parentMap, zoomFactor]);

  // Listen to events on the parent map
  const handlers = useMemo(
    () => ({ moveend: onChange, zoomend: onChange }),
    [onChange]
  );
  const context = { __version: 1, map: parentMap };
  const leafletElement = {
    instance: parentMap,
    context,
  };
  useEventHandlers(leafletElement, handlers);

  return !toggle ? (
    <div
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        display: "block",
        opacity: 0.5,
        position: "absolute",
        border: "1px solid rgb(0, 0, 0)",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
      }}
    />
  ) : (
    <></>
  );
};
