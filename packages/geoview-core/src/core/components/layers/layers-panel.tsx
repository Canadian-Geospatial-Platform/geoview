import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material';
import { CloseButton, EnlargeButton, LayerTitle, ResponsiveGrid } from '../common';
import { Box } from '@/ui';
import { getSxClasses } from './layers-style';
import { LegendItemsDetailsProps } from './types';
import { useLegendHelpers } from './hooks/helpers';
import { useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersActions } from './left-panel/layers-actions';
import { LayersList } from './left-panel/layers-list';
import { LayerDetails } from './right-panel/layer-details';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function LayersPanel({ mapId }: LegendItemsDetailsProps) {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  const layerDetailsRef = useRef<HTMLDivElement>(null);

  // Populating fake legend data
  const helpers = useLegendHelpers(mapId);

  const selectedLayer = useSelectedLayer(); // get store value

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
        <LayersList />
      </div>
    );
  };

  const rightPanel = () => {
    if (selectedLayer) {
      return (
        <Item ref={layerDetailsRef}>
          <LayerDetails layerDetails={selectedLayer} />
        </Item>
      );
    }

    return null;
  };

  return (
    <Box sx={sxClasses.layersPanelContainer}>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
          <LayerTitle>{t('general.layers')}</LayerTitle>
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              [theme.breakpoints.up('md')]: { justifyContent: 'right' },
              [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
            }}
          >
            <Box>
              <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
              <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
            </Box>
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root sx={{ mt: 8 }}>
        <ResponsiveGrid.Left isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
          {leftPanel()}
        </ResponsiveGrid.Left>

        <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
          {rightPanel()}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}
