/* eslint-disable react/require-default-props */
import { TypeWindow, getLocalizedValue, TypeTabs, AbstractGeoViewVector } from 'geoview-core';

interface Props {
  mapId: string;
}
const w = window as TypeWindow;

/**
 * Create an element that displays the data grid footer component
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
  }, [api, mapId]);

  setTimeout(() => {
    dataLayers.forEach((layerId) => {
      const layerSelection = document.getElementById(`${layerId}-groupLayerSelection`);
      if (layerSelection) {
        (layerSelection as HTMLSelectElement).addEventListener('change', function onChange(this) {
          const { selectedIndex } = this;
          const datagridTables = document.getElementsByClassName(`${layerId}-layer-datagrid-table`);
          if (datagridTables.length > 0) {
            for (let i = 0; i < datagridTables.length; i++) {
              (datagridTables[i] as HTMLDivElement).setAttribute('style', `display:${i !== selectedIndex ? 'none' : 'block'}`);
            }
          }
        });
      }
    });
  }, 2000);

  return (
    <Tabs
      tabsProps={{
        variant: 'scrollable',
      }}
      tabs={dataLayers.map((layerId, index): TypeTabs => {
        const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId] as AbstractGeoViewVector;
        const labelValue = getLocalizedValue(geoviewLayerInstance.geoviewLayerName, mapId);

        // TODO: needs refactor here for group layers.
        return {
          value: index,
          label: labelValue !== undefined ? labelValue : `data-${index}`,
          content: () =>
            api.map(mapId).dataGrid.createDataGrid({
              layerId,
            }),
        };
      })}
    />
  );
}
