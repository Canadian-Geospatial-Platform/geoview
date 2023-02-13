/* eslint-disable react/require-default-props */
import { TypeWindow, getLocalizedValue, TypeTabs } from 'geoview-core';

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

  const layerSelection = document.getElementById('groupLayerSelection');
  if (layerSelection) {
    layerSelection.addEventListener('change', function (e) {
      const selectedIndex = (document.getElementById('groupLayerSelection') as HTMLSelectElement)?.selectedIndex;
      const datagridTables = document.getElementsByClassName('layer-datagrid-table');
      if (datagridTables.length > 0) {
        for (let i = 0; i < datagridTables.length; i++) {
          (datagridTables[i] as HTMLDivElement).setAttribute('style', `display:${i !== selectedIndex ? 'none' : 'block'}`);
        }
      }
    });
  }

  useEffect(() => {
    setDataLayers(Object.keys(api.map(mapId!).layer.geoviewLayers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tabs
      tabsProps={{
        variant: 'scrollable',
      }}
      tabs={dataLayers.map((layerId, index): TypeTabs => {
        const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];
        const labelValue = getLocalizedValue(geoviewLayerInstance.geoviewLayerName, mapId);
        return {
          value: index,
          label: labelValue !== undefined ? labelValue : `data-${index}`,
          content: () => api.map(mapId).dataGrid.createDataGrid({ layerId }),
        };
      })}
    />
  );
}
