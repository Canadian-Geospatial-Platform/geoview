import { useStore } from 'zustand';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TypeDisplayLanguage } from '@/app';
import { Box, List, Typography, Paper, ListItem, Tooltip, ListItemText, ListItemIcon, IconButton, KeyboardArrowDownIcon } from '@/ui';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { getSxClasses } from './legend-style';
import { TypeLegendLayer } from './types';

export interface LegendOverviewProps {
  mapId: string;
}

export function LegendOverview(props: LegendOverviewProps): JSX.Element {
  const { mapId } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t, i18n } = useTranslation<string>();
  const store = getGeoViewStore(mapId);
  const legendLayers = useStore(store, (state) => state.legendState.legendLayers);

  const numItems = 33;
  /* START fake store data here */

  function renderLegendLayer(layer: TypeLegendLayer) {
    const layerName = layer.layerName[i18n.language as TypeDisplayLanguage];
    return (
      <ListItem key={layerName}>
        <Tooltip title={layerName} placement="top" enterDelay={1000}>
          <ListItemText primary={layerName} />
        </Tooltip>

        <ListItemIcon style={{ justifyContent: 'right' }}>
          <IconButton color="primary">
            <KeyboardArrowDownIcon />
          </IconButton>
        </ListItemIcon>
      </ListItem>
    );
  }

  return (
    <Paper>
      <Box>
        <Typography sx={sxClasses.legendTitle}>
          <strong>{t('legend.bold_selection')}</strong> {t('legend.overview_title')}
        </Typography>
        <Typography sx={{ fontSize: '0.6em', textAlign: 'left', marginBottom: '16.5px' }}>
          {numItems} {t('legend.items_available')}
        </Typography>
      </Box>
      <List sx={{ width: '100%', padding: '20px' }}>{legendLayers.map((item) => renderLegendLayer(item))}</List>
    </Paper>
  );
}
