// /* eslint-disable react/require-default-props */
// import type React from 'react';
// import { PayloadBaseClass } from 'geoview-core/src/api/events/payloads';
// import {
//   TypeAllQueriesDonePayload,
//   MapMouseEventPayload,
//   TypeWindow,
//   payloadIsAMapMouseEvent,
//   payloadIsAllQueriesDone,
//   TypeArrayOfLayerData,
//   getLocalizedValue,
//   Coordinate,
// } from 'geoview-core';

// interface Props {
//   mapId: string;
//   buttonId?: string;
// }

// const w = window as TypeWindow;

// /**
//  * Create an element that displays the details component
//  *
//  * @returns {JSX.Element} created details component
//  */
// TODO line 28 is a duplication of line 29, but without the props as we don't need them for now to bypass lint error
export function DetailsItem(): JSX.Element {
  // export function DetailsItem({ mapId, buttonId }: Props): JSX.Element {
  //   const { cgpv } = w;
  //   const { api, react } = cgpv;

  //   const { useState, useEffect } = react;

  //   const [details, setDetails] = useState<TypeArrayOfLayerData>([]);
  //   // eslint-disable-next-line @typescript-eslint/ban-types
  //   const [list, setList] = useState<React.ReactElement>();
  //   const [LngLat, setLngLat] = useState<Coordinate>([]);
  //   const [handlerName, setHandlerName] = useState<string | null>(null);

  //   const panel = api.maps[mapId].appBarButtons.getAppBarButtonPanelById(buttonId === undefined ? '' : buttonId)?.panel;

  //   const allQueriesDoneListenerFunction = (payload: PayloadBaseClass) => {
  //     if (payloadIsAllQueriesDone(payload)) {
  //       const { resultSets } = payload as TypeAllQueriesDonePayload;
  //       const newDetails: TypeArrayOfLayerData = [];
  //       Object.keys(resultSets).forEach((layerPath) => {
  //         const layerName = getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId)!;
  //         const features = resultSets[layerPath]!.data;
  //         if (features.length > 0) {
  //           newDetails.push({ layerPath, layerName, features });
  //         }
  //       });
  //       if (newDetails.length > 0) {
  //         setDetails(newDetails);
  //         // open the details panel
  //         panel?.open();
  //       } else {
  //         setDetails([]);
  //       }
  //     } else {
  //       setDetails([]);
  //     }
  //   };

  //   const eventMapSingleClickListenerFunction = (payload: PayloadBaseClass) => {
  //     if (payloadIsAMapMouseEvent(payload)) {
  //       const { coordinates } = payload as MapMouseEventPayload;
  //       setHandlerName(payload.handlerName);
  //       setLngLat(coordinates.lnglat);
  //     } else {
  //       setLngLat([]);
  //     }
  //   };

  //   useEffect(() => {
  //     // create the listener to return the details
  //     api.event.on(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, allQueriesDoneListenerFunction, `${mapId}/FeatureInfoLayerSet`);
  //     // get click info.
  //     api.event.on(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, eventMapSingleClickListenerFunction, mapId);

  //     return () => {
  //       api.event.off(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId, allQueriesDoneListenerFunction);
  //       api.event.off(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, mapId, eventMapSingleClickListenerFunction);
  //     };
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, []);

  //   useEffect(() => {
  //     setList(
  //       api.maps[mapId].details.createDetails(mapId, details, {
  //         mapId,
  //         location: LngLat,
  //         backgroundStyle: 'dark',
  //         singleColumn: true,
  //         handlerName,
  //       })
  //     );
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [details, LngLat]);

  return <div>This feature is deprecated.</div>;
}
