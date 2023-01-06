/* eslint-disable react/require-default-props */
import { DetailedReactHTMLElement, JSXElementConstructor, ReactElement } from 'react';
import { TypeWindow, payloadIsALayerConfig, payloadIsRemoveGeoViewLayer, getLocalizedValue } from 'geoview-core';

interface Props {
  mapId: string;
}
const w = window as TypeWindow;

/**
 * Create an element that displays the data drig footer component
 *
 * @returns {JSX.Element} created data grid footer component
 */
export function DataItem({ mapId }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, ui, react } = cgpv;
  const { Tabs } = ui.elements;

  const { useState, useEffect } = react;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const [dataLayers, setDataLayers] = useState<string[]>([]);

  useEffect(() => {
    setDataLayers(Object.keys(api.map(mapId!).layer.geoviewLayers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tabs
      tabsProps={{
        variant: 'scrollable',
      }}
      tabs={dataLayers.map((layerId, index): any => {
        const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];

        return {
          value: index,
          label: getLocalizedValue(geoviewLayerInstance.geoviewLayerName, mapId),
          content: () => api.map(mapId).dataGrid.createDataGrid({ layerId }),
        }
      })}
    />
  );
}
