// src/core/components/map/map.tsx
// TODO: do not deal with stuff not related to create the payload in the event, use the event on or store state to listen to change and do what is needed.
// !This was in mapZoomEnd event.... listen to the event in proper place
// Object.keys(layers).forEach((layer) => {
//   if (layer.endsWith('-unclustered')) {
//     const clusterLayerId = layer.replace('-unclustered', '');
//     const splitZoom =
//       (api.maps[mapId].layer.registeredLayers[clusterLayerId].source as TypeVectorSourceInitialConfig)!.cluster!.splitZoom || 7;
//     if (prevZoom < splitZoom && currentZoom >= splitZoom) {
//       api.maps[mapId].layer.registeredLayers[clusterLayerId]?.olLayer!.setVisible(false);
//       api.maps[mapId].layer.registeredLayers[layer]?.olLayer!.setVisible(true);
//     }
//     if (prevZoom >= splitZoom && currentZoom < splitZoom) {
//       api.maps[mapId].layer.registeredLayers[clusterLayerId]?.olLayer!.setVisible(true);
//       api.maps[mapId].layer.registeredLayers[layer]?.olLayer!.setVisible(false);
//     }
//   }
// });
