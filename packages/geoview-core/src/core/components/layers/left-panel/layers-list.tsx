import React from 'react';
import { useTheme } from '@mui/material';
import { SingleLayer } from './single-layer';
import { getSxClasses } from '../layers-style';
import { List } from '@/ui';
import { useLayersList } from '@/core/stores/layer-state';

export function LayersList(): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const legendLayers = useLayersList();

  const legendItems = legendLayers.map((details) => {
    return <SingleLayer key={`layerKey-${details.layerPath}-${details.layerPath}`} depth={0} layer={details} />;
  });

  return <List sx={sxClasses.list}>{legendItems}</List>;
}
