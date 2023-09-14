import { styled } from '@mui/material';
import React, { useState } from 'react';
import { api } from '@/app';
import { LegendItemsDetailsProps } from './types';
import { Box, Grid } from '@/ui';
import { LegendItems } from './legend-items/legend-items';
import { LegendItemsDetails } from './legend-item-details/legend-items-details';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));
export function Legend(props: LegendItemsDetailsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });

  // const [selectedMainLayer, setSelectedMainLayer] = React.useState<string | null>(null);
  // console.log(selectedMainLayer);
  // const handleMainLayerClick = (layerId: string) => {
  //   setSelectedMainLayer(layerId);
  // };

  //   const leftPanel = () => {
  //     return (
  //       <LegendItems
  //         mapId={mapId}
  //         layerIds={layerIds}
  //         canSetOpacity={canSetOpacity}
  //         expandAll={expandAll}
  //         hideAll={hideAll}
  //         isRemoveable={isRemoveable}
  //         canZoomTo
  //         // onMainLayerClick={handleMainLayerClick}
  //       />
  //     );
  //   };

  //   const rightPanel = () => {
  //     // Condition to render sublayers in the right panel when a main layer is selected
  //     if (selectedMainLayer) {
  //       return (
  //         <LegendItemsDetails
  //           mapId={mapId}
  //           layerIds={[selectedMainLayer]}
  //           canSetOpacity={canSetOpacity}
  //           expandAll={expandAll}
  //           hideAll={hideAll}
  //           isRemoveable={isRemoveable}
  //           canZoomTo
  //           // subLayerId={subLayerId}
  //         />
  //       );
  //     } else {
  //       return (
  //         <Item>
  //           <p>This will be the right panel eventually</p>
  //         </Item>
  //       );
  //     }
  //   };

  //   return (
  //     <Box sx={{ px: '20px', pb: '20px', display: 'flex', flexDirection: 'column' }}>
  //       <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
  //         <Grid item xs={12} sm={4}>
  //           <Item>{leftPanel()}</Item>
  //         </Grid>
  //         <Grid item xs={12} sm={6}>
  //           <Item>{rightPanel()}</Item>
  //         </Grid>
  //       </Grid>
  //     </Box>
  //   );
  // }

  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const leftPanel = () => {
    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsCheckboxChecked(event.target.checked);
    };

    return (
      <>
        {/* <label htmlFor="showRightPanel">Show Right Panel</label> */}
        <input type="checkbox" id="showRightPanel" checked={isCheckboxChecked} onChange={handleCheckboxChange} />
        <br />
        <LegendItems
          mapId={mapId}
          layerIds={layerIds}
          canSetOpacity={canSetOpacity}
          expandAll={expandAll}
          hideAll={hideAll}
          isRemoveable={isRemoveable}
          canZoomTo
        />
      </>
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

  return (
    <Box sx={{ px: '20px', pb: '20px', display: 'flex', flexDirection: 'column' }}>
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid item xs={12} sm={4}>
          <Item>{leftPanel()}</Item>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Item>
            {isCheckboxChecked ? (
              <>
                <p>This will be right panel eventually </p>
                {rightPanel()}
              </>
            ) : (
              <p>This will be the right panel eventually</p>
            )}
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
}
