/* eslint-disable react/jsx-no-constructed-context-values */
import { styled } from '@mui/material';
import { useState } from 'react';
import { TypeLegendProps, TypeLegendItemProps } from './types';
import { api, TypeDisplayLanguage } from '@/app';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { Grid, Box } from '@/ui';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { LayersSelect } from '../layers-select/LayersSelect';

export interface LegendProps extends TypeLegendProps {
  mapId: string;
}
const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
  position: 'relative',
  zIndex: 0,
}));


export function Legend2(props: LegendProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  const [selectedLayer, setSelectedLayer] = useState<TypeLegendItemProps | null>(null);
  const [selectedLayerNames, setSelectedLayerNames] = useState<string[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]); // Store selected layers
  const [isSelectedLayersClicked, setIsSelectedLayersClicked] = useState(false);

  const onOpenDetails = function (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined): void {
    const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];

    let selectedLayerNames: string[] = [];

    if (layerConfigEntry) {
      const localizedNames = layerConfigEntry.layerName as Record<TypeDisplayLanguage, string> | undefined;
      if (localizedNames) {
        selectedLayerNames = [Object.values(localizedNames).filter(name => name)[0]] as string[];
      }
    } else if (geoviewLayerInstance?.geoviewLayerName) {
      const localizedNames = geoviewLayerInstance.geoviewLayerName as Record<TypeDisplayLanguage, string> | undefined;
      if (localizedNames) {
        selectedLayerNames = [Object.values(localizedNames).filter(name => name)[0]] as string[];
      }
      console.log(selectedLayerNames);
    }
    
    

    // if (selectedLayerNames.length > 0) {
    //   const isLayerSelected = selectedLayerNames.some(name => selectedLayers.includes(name));
    //   if (selectedLayers.includes(layerId)) {
    //     setSelectedLayers(prevSelectedLayers =>
    //       prevSelectedLayers.filter(selectedId => !selectedLayerNames.includes(selectedId))
    //     );
    //   } else {
    //     setSelectedLayers(prevSelectedLayers => [...prevSelectedLayers, ...selectedLayerNames]);
    //   }
    // }

    if (selectedLayers.includes(layerId)) {
      setSelectedLayers(prevSelectedLayers => prevSelectedLayers.filter(selectedId => selectedId !== layerId));
    } else {
      setSelectedLayers(prevSelectedLayers => [...prevSelectedLayers, layerId]);
    }

    setSelectedLayerNames(selectedLayerNames);

    const det: TypeLegendItemProps = {
      layerId,
      subLayerId: undefined,
      geoviewLayerInstance,
      layerConfigEntry,
      isRemoveable,
      canSetOpacity,
    };

    setSelectedLayer(null);

    setTimeout(() => {
      setSelectedLayer(det);
    }, 300);
  };

  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });

  const leftPanel = () => {
    return (
      <LayersSelect
        mapId={mapId}
        layerIds={layerIds}
        canSetOpacity={canSetOpacity}
        expandAll={expandAll}
        hideAll={hideAll}
        isRemoveable={false}
        canZoomTo
        canSort
        onOpenDetails={(_layerId: string, _layerConfigEntry: TypeLayerEntryConfig | undefined) =>
          onOpenDetails(_layerId, _layerConfigEntry)
        }
      />
    );
  };

  function selectedLayersBox() {
    if (isSelectedLayersClicked) {
      return (
        <div>
          <p>Selected Layers</p>
          <ul>
          {selectedLayers.map((layerId, index) => (
              <li key={index}>{layerId}</li>
            ))}
            {/* {selectedLayerNames.map((layerName, index) => (
              <li key={index}>{layerName}</li>
            ))} */}
          </ul>
        </div>
      );
    } else if (selectedLayer) {
      return <LegendItemDetails {...selectedLayer} />;
    }
    return null;
  }

  function toggleSmallBox() {
    setIsSelectedLayersClicked(!isSelectedLayersClicked);
  }

  return (
    <Box sx={{ px: '20px', pb: '20px', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '10px' }}>Legend Overview</h2>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', width: '200px'}}>
        <input
          type="text"
          placeholder="Selected Layers"
          style={{
            flex: 1,
            width: '5px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            marginRight: '1px',
          }}
        />
        <div
          style={{
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={toggleSmallBox}
        >
          <div
            style={{
              width: '0',
              height: '0',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '6px solid #000',
            }}
          ></div>
        </div>
      </div>
  
      {/* Legend Panes */}
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid item xs={12} sm={6}>
          {/* <p>Left Pane</p> */}
          <Item>
            {leftPanel()}
          </Item>
        </Grid>
        <Grid item xs={12} sm={6}>
          {/* <p>Right Pane</p> */}
          <Item>
            {selectedLayersBox()}
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
}
