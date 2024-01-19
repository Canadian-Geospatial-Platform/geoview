import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { Box, AddCircleOutlineIcon, ButtonGroup, DeleteOutlineIcon, HandleIcon, Tooltip, VisibilityOutlinedIcon } from '@/ui';
import { useLayerStoreActions, useLayersDisplayState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLayersViewDisplayState } from './types';

interface ResponsiveButtonProps {
  tooltipKey: string;
  translationKey: string;
  icon: JSX.Element;
  newState: TypeLayersViewDisplayState;
}

function ResponsiveButton(props: ResponsiveButtonProps): JSX.Element {
  const { tooltipKey, translationKey, icon, newState } = props;
  const { t } = useTranslation<string>();
  const breakpoint = 510;

  // state
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // access store
  const displayState = useLayersDisplayState();
  const { setDisplayState } = useLayerStoreActions();

  const handleSetDisplayState = (dispState: TypeLayersViewDisplayState): void => {
    setDisplayState(dispState);
  };

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (screenWidth < breakpoint) {
    return (
      <Tooltip title={t(tooltipKey)} placement="top" enterDelay={1000}>
        <Button
          sx={{ paddingLeft: '20px' }}
          variant={displayState === newState ? 'contained' : 'outlined'}
          startIcon={icon}
          onClick={() => handleSetDisplayState(newState)}
        />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={t(tooltipKey)} placement="top" enterDelay={1000}>
      <Button
        variant={displayState === newState ? 'contained' : 'outlined'}
        startIcon={icon}
        onClick={() => handleSetDisplayState(newState)}
      >
        {t(translationKey)}
      </Button>
    </Tooltip>
  );
}

export function LayersToolbar(): JSX.Element {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', padding: '18px 18px 0px 18px' }}>
      <ButtonGroup size="small" variant="outlined" aria-label="outlined button group">
        <ResponsiveButton
          tooltipKey="general.view"
          translationKey="general.view"
          icon={<VisibilityOutlinedIcon fontSize="small" />}
          newState="view"
        />
        <ResponsiveButton
          tooltipKey="legend.addLayer"
          translationKey="general.add"
          icon={<AddCircleOutlineIcon fontSize="small" />}
          newState="add"
        />
        <ResponsiveButton
          tooltipKey="legend.sortLayers"
          translationKey="legend.sort"
          icon={<HandleIcon fontSize="small" />}
          newState="order"
        />
        <ResponsiveButton
          tooltipKey="legend.removeLayer"
          translationKey="general.remove"
          icon={<DeleteOutlineIcon fontSize="small" />}
          newState="remove"
        />
      </ButtonGroup>
    </Box>
  );
}
