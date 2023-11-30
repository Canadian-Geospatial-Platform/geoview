import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material';
import { CloseButton, LayerTitle, ResponsiveGrid } from '../common';
import { Box, DeleteIcon, HandleIcon, IconButton, Paper } from '@/ui';
import { getSxClasses } from './layers-style';
import { useLayersDisplayState, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersActions } from './left-panel/layers-actions';
import { LayersList } from './left-panel/layers-list';
import { LayerDetails } from './right-panel/layer-details';
import { AddNewLayer } from './left-panel/add-new-layer';
import { useLegendHelpers } from './hooks/helpers';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function LayersPanel() {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isLayersListPanelVisible, setIsLayersListPanelVisible] = useState(false);

  const layerDetailsRef = useRef<HTMLDivElement>(null);

  const selectedLayer = useSelectedLayer(); // get store value
  const displayState = useLayersDisplayState();

  
  // Using helpers
  const helpers = useLegendHelpers();

  useEffect(() => {
    helpers.populateLegendStoreWithFakeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  useEffect(() => {
    if (layerDetailsRef.current) {
      layerDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedLayer]);

  const leftPanel = () => {
    return (
      <div>
        <LayersActions />
        {displayState === 'add' ? <AddNewLayer /> : <LayersList setIsLayersListPanelVisible={setIsLayersListPanelVisible} />}
      </div>
    );
  };

  const rightPanel = () => {
    if (selectedLayer && displayState === 'view') {
      return (
        <Item ref={layerDetailsRef}>
          <LayerDetails layerDetails={selectedLayer} />
        </Item>
      );
    }
    if (displayState === 'remove') {
      return (
        <Paper sx={{ padding: '20px' }}>
          <h3>Removing layers</h3>
          <Box sx={sxClasses.rightPanel.buttonDescriptionContainer}>
            <IconButton>
              <DeleteIcon style={{ fill: '#a9a9a9' }} />
            </IconButton>
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ipsum perspiciatis doloribus veritatis iste? Quae alias praesentium,
              delectus reprehenderit itaque voluptatibus!
            </p>
          </Box>
        </Paper>
      );
    }
    if (displayState === 'order') {
      return (
        <Paper sx={{ padding: '20px' }}>
          <h3>Re-ordering layers</h3>
          <Box sx={sxClasses.rightPanel.buttonDescriptionContainer}>
            <IconButton>
              <HandleIcon style={{ fill: '#a9a9a9' }} />
            </IconButton>
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Praesentium animi, perferendis nemo quas sequi totam minima ad
              labore.
            </p>
          </Box>
        </Paper>
      );
    }

    return null;
  };

  return (
    <Box sx={sxClasses.layersPanelContainer}>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left isEnlargeDataTable={false} isLayersPanelVisible={isLayersListPanelVisible}>
          <LayerTitle>{t('general.layers')}</LayerTitle>
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isEnlargeDataTable={false} isLayersPanelVisible={isLayersListPanelVisible}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'right',
            }}
          >
            <CloseButton isLayersPanelVisible={isLayersListPanelVisible} setIsLayersPanelVisible={setIsLayersListPanelVisible} />
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root sx={{ mt: 8 }}>
        <ResponsiveGrid.Left isEnlargeDataTable={false} isLayersPanelVisible={isLayersListPanelVisible}>
          {leftPanel()}
        </ResponsiveGrid.Left>

        <ResponsiveGrid.Right isEnlargeDataTable={false} isLayersPanelVisible={isLayersListPanelVisible}>
          {rightPanel()}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}
