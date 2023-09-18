import { styled } from '@mui/material';
import React, { useState } from 'react';
import { api } from '@/app';
import { Box, Grid } from '@/ui';
import { LegendItems } from './legend-items/legend-items';
import { LegendItem } from './legend-items/legend-item';
import { LegendItemsDetails } from './legend-item-details/legend-items-details';
// import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
// import { LayersSelect } from '../layers-select/LayersSelect';
import { LegendItemsProps } from './types';
// import { TypeLegendItemProps } from './types';
// import {LegendItemsDetailsProps} from './types'

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));


export function Legend2(props: LegendItemsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  
  // const [selectedLayer, setSelectedLayer] = useState<TypeLegendItemProps | null>(null);
  
  // const onOpenDetails = function (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined): void {
  // const geoviewLayerInstance = api.maps(mapId).layer.geoviewLayers[layerId];


  // const LegendItemsDet: LegendItemsDetailsProps = {
  //   layerId
  //   geoviewLayerInstance,
  //   subLayerId:undefined,
  //   layerConfigEntry,
  //   isRemoveable,
  //   canSetOpacity,
  //   isParentVisible:undefined,
  //   toggleParentVisible:undefined,
  //   expandAll,
  //   hideAll,
  //   canZoomTo:undefined
  //   };
  // const det: TypeLegendItemProps = {
  //     layerId,
  //     subLayerId: undefined,
  //     geoviewLayerInstance,
  //     layerConfigEntry,
  //     isRemoveable,
  //     canSetOpacity,
  //   };
  //   setSelectedLayer(null);
  //   setTimeout(() => {
  //     setSelectedLayer(det);
  //   }, 300);
  // };



  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const leftPanel = () => {
  //   return (
  //     <LayersSelect
  //       mapId={mapId}
  //       layerIds={layerIds}
  //       canSetOpacity={canSetOpacity}
  //       expandAll={expandAll}
  //       hideAll={hideAll}
  //       isRemoveable={false}
  //       canZoomTo
  //       canSort
  //       onOpenDetails={(_layerId: string, _layerConfigEntry: TypeLayerEntryConfig | undefined) =>
  //         onOpenDetails(_layerId, _layerConfigEntry)
  //       }
  //     />
  //   );
  // };

    const leftPanel = () => {
    return (
      <LegendItems
        mapId={mapId}
        layerIds={layerIds}
        canSetOpacity={canSetOpacity}
        expandAll={expandAll}
        hideAll={hideAll}
        isRemoveable={isRemoveable}
        canZoomTo
      />
    );
  };

  const rightPanel = () => {
    return (
      <LegendItemsDetails
        mapId={mapId}
        layerIds={layerIds}
        canSetOpacity={canSetOpacity}
        expandAll={expandAll}
        hideAll={hideAll}
        isRemoveable={isRemoveable}
        canZoomTo
      />
    );
  };

  // const rightPanel = () => {
  //   return (
  //     <LegendItemsDetails
  //     key={subItem.layerId}
  //     layerId={layerId}
  //     geoviewLayerInstance={geoviewLayerInstance}
  //     subLayerId={subLayer
  //       Id ? `${subLayerId}/${subItem.layerId}` : `${layerId}/${subItem.layerId}`}
  //     layerConfigEntry={subItem}
  //     isParentVisible={isParentVisible === false ? false : isChecked}
  //     canSetOpacity={canSetOpacity}
  //     toggleParentVisible={handleToggleLayer}
  //     expandAll={expandAll}
  //     hideAll={hideAll}
  //     canZoomTo={canZoomTo}
  //   />
  //   );
  // };

                

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // function rightPanel() {
  //   if (selectedLayer) {
  //     return <LegendItemDetails {...selectedLayer} />;
  //   }
  //   return null;
  // }

  return (
    <Box sx={{ px: '20px', pb: '20px', display: 'flex', flexDirection: 'column' }}>
      {/* <h2 style={{ marginBottom: '10px' }}>Legend</h2> */}
      {/* <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ornare posuere arcu, eu placerat nisl scelerisque eu. Integer
        molestie, libero quis maximus elementum, nunc ante facilisis nunc, in auctor nisi enim tincidunt sapien.
      </p> */}
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid item xs={12} sm={4}>
          <Item>{leftPanel()}</Item>
        </Grid>
        <Grid item xs={12} sm={6}>
            {/* <p>This will be right panel eventuallyy</p>   */}
         <Item>{rightPanel()}</Item>
           {/* <Item>{selectedLayer && <LegendItemDetails {...selectedLayer} />}</Item> */}
         </Grid>
       </Grid>
     </Box>
  );
}