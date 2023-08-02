import type React from 'react';
import { toJsonObject, TypeJsonObject, TypeWindow, TypeButtonPanel, payloadIsLegendsLayersetUpdated, PayloadBaseClass } from 'geoview-core';

import LayerStepper from './layer-stepper';
import ReorderLayersList from './reorder-layers-list';

type TypePanelContentProps = {
  buttonPanel: TypeButtonPanel;
  mapId: string;
};

const w = window as TypeWindow;

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns {JSX.Element} A React JSX Element with the details panel
 */
function PanelContent(props: TypePanelContentProps): JSX.Element {
  const { mapId, buttonPanel } = props;

  const { cgpv } = w;
  const { api, ui, react } = cgpv;
  const { useState, useEffect } = react;
  const [addLayerVisible, setAddLayerVisible] = useState(false);
  const [reorderLayersVisible, setReorderLayersVisible] = useState(false);
  const [mapLayers, setMapLayers] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [legend, setLegend] = useState<React.DetailedReactHTMLElement<{}, HTMLElement>>();
  const [actionMenuAnchorElement, setActionMenuAnchorElement] = useState<null | HTMLElement>(null);
  const [isExpandAll, setExpandAll] = useState<boolean>(false);
  const [isHideAll, setHideAll] = useState<boolean>(false);
  const {
    IconButton,
    AddIcon,
    Box,
    ExpandMoreIcon,
    ExpandLessIcon,
    VisibilityIcon,
    VisibilityOffIcon,
    Menu,
    MenuItem,
    MenuIcon,
    ListItemIcon,
    ListItemText,
    ReorderIcon,
  } = ui.elements;

  const { displayLanguage } = api.map(mapId!);

  const translations: TypeJsonObject = toJsonObject({
    en: {
      addLayer: 'Add Layer',
      expandAll: 'Expand Groups',
      collapseAll: 'Collapse Groups',
      showAll: 'Show All',
      hideAll: 'Hide All',
      reorderLayers: 'Reorder Layers',
    },
    fr: {
      addLayer: 'Ajouter Couche',
      expandAll: 'Élargir les groupes',
      collapseAll: 'Réduire les groupes',
      showAll: 'Montrer tout',
      hideAll: 'Cacher tout',
      reorderLayers: 'Réorganiser les couches',
    },
  });

  const sxClasses = {
    mainContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: 'inherit',
    },
    topControls: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    addLayerSection: {
      display: 'flex',
      alignItems: 'center',
      marginTop: 'auto',
      justifyContent: 'end',
    },
  };

  const actionMenuOpen = Boolean(actionMenuAnchorElement);

  const updateLayers = () => {
    if (api.map(mapId).layer?.layerOrder !== undefined) setMapLayers([...api.map(mapId).layer.layerOrder].reverse());
  };

  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });
  useEffect(() => {
    const legendsLayerSetUpdatedListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsLegendsLayersetUpdated(payload)) {
        const { resultSets } = payload;
        const mapLayerSet: string[] = [];
        Object.keys(resultSets).forEach((layerPath) => {
          mapLayerSet.push(layerPath.split('/')[0]);
        });
        setMapLayers([...new Set(mapLayerSet)]);
      }
    };
    api.event.on(api.eventNames.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED, legendsLayerSetUpdatedListenerFunction, `${mapId}/$LegendsLayerSet$`);
    return () => {
      api.event.off(api.eventNames.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED, mapId, legendsLayerSetUpdatedListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLayersListenerFunction = () => updateLayers();

  useEffect(() => {
    api.event.on(
      api.eventNames.MAP.EVENT_MAP_LOADED,
      () => {
        updateLayers();
      },
      mapId
    );

    // TODO: Refactor properly to use the legend layer set #1104
    // api.event.on(
    //   api.eventNames.LAYER.EVENT_REMOVE_LAYER,
    //   (payload) => {
    //     if (payloadIsRemoveGeoViewLayer(payload)) {
    //       setMapLayers((orderedLayers) => orderedLayers.filter((layerId) => layerId !== payload.geoviewLayer.geoviewLayerId));
    //     }
    //   },
    //   mapId
    // );
    // api.event.on(
    //   api.eventNames.LAYER.EVENT_ADD_LAYER,
    //   (payload) => {
    //     if (payloadIsALayerConfig(payload)) {
    //       api.event.on(
    //         api.eventNames.LAYER.EVENT_LAYER_ADDED,
    //         () => {
    //           updateLayers();
    //           api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, `${mapId}/${payload.layerConfig.geoviewLayerId}`);
    //         },
    //         `${mapId}/${payload.layerConfig.geoviewLayerId}`
    //       );
    //     }
    //   },
    //   mapId
    // );
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_LOADED, mapId, updateLayersListenerFunction);
      api.event.off(api.eventNames.LAYER.EVENT_ADD_LAYER, mapId);
      api.event.off(api.eventNames.LAYER.EVENT_REMOVE_LAYER, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLegend(api.map(mapId!).legend.createLegend({ layerIds: mapLayers, isRemoveable: true, canSetOpacity: true, canZoomTo: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  useEffect(() => {
    const setAddLayerVisibleListenerFunction = () => setAddLayerVisible(false);

    api.event.on(api.eventNames.PANEL.EVENT_PANEL_CLOSE, setAddLayerVisibleListenerFunction, `${mapId}/${buttonPanel.buttonPanelId}`);
    return () => {
      api.event.off(api.eventNames.PANEL.EVENT_PANEL_CLOSE, `${mapId}/${buttonPanel.buttonPanelId}`, setAddLayerVisibleListenerFunction);
    };
  }, [api, buttonPanel.buttonPanelId, mapId]);

  useEffect(() => {
    setLegend(
      api
        .map(mapId!)
        .legend.createLegend({ layerIds: mapLayers, isRemoveable: true, canSetOpacity: true, expandAll: isExpandAll, canZoomTo: true })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpandAll]);

  useEffect(() => {
    setLegend(
      api
        .map(mapId!)
        .legend.createLegend({ layerIds: mapLayers, isRemoveable: true, canSetOpacity: true, hideAll: isHideAll, canZoomTo: true })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHideAll]);

  const handleShowAddLayer = () => {
    setAddLayerVisible((state: boolean) => !state);
  };

  const handleExpandMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchorElement(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setActionMenuAnchorElement(null);
  };

  const handleExpandAllClick = (isExpand: boolean) => {
    setExpandAll(isExpand);
    handleCloseMenu();
  };

  const handleShowAllClick = (isShow: boolean) => {
    setHideAll(!isShow);
    handleCloseMenu();
  };

  const handleReorderLayersClick = (isReorder: boolean) => {
    setReorderLayersVisible(isReorder);
    handleCloseMenu();
  };

  useEffect(() => {
    // this will disable all scrolling when the user is trying to reorder layers
    // TODO see issue #754 and atlassian/react-beautiful-dnd#460 - there may be a more elegant solution eventually if supported from the react-beautiful-dnd library
    if (reorderLayersVisible) {
      const x = w.scrollX;
      const y = w.scrollY;
      w.onscroll = () => {
        w.scrollTo(x, y);
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      w.onscroll = () => {};
    }
  }, [reorderLayersVisible]);

  return (
    <>
      <Menu anchorEl={actionMenuAnchorElement} open={actionMenuOpen} onClose={handleCloseMenu}>
        <MenuItem onClick={() => handleExpandAllClick(true)}>
          <ListItemIcon>
            <ExpandMoreIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].expandAll}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExpandAllClick(false)}>
          <ListItemIcon>
            <ExpandLessIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].collapseAll}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShowAllClick(true)}>
          <ListItemIcon>
            <VisibilityIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].showAll}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShowAllClick(false)}>
          <ListItemIcon>
            <VisibilityOffIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].hideAll}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleReorderLayersClick(true)}>
          <ListItemIcon>
            <ReorderIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].reorderLayers}</ListItemText>
        </MenuItem>
      </Menu>
      <Box sx={sxClasses.mainContainer}>
        {addLayerVisible && <LayerStepper mapId={mapId!} setAddLayerVisible={setAddLayerVisible} />}
        {reorderLayersVisible && (
          <ReorderLayersList
            mapId={mapId!}
            title={translations[displayLanguage].reorderLayers as string}
            layerIds={mapLayers}
            setMapLayers={setMapLayers}
            setReorderLayersVisible={setReorderLayersVisible}
          />
        )}
        <Box sx={sxClasses.topControls} style={{ display: addLayerVisible || reorderLayersVisible ? 'none' : 'flex' }}>
          <div>
            <IconButton color="primary" onClick={handleExpandMenuClick}>
              <MenuIcon />
            </IconButton>
          </div>
          <Box onClick={handleShowAddLayer}>
            {translations[displayLanguage].addLayer}
            <IconButton>
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
        <div style={{ display: addLayerVisible || reorderLayersVisible ? 'none' : 'block' }}>{legend}</div>
      </Box>
    </>
  );
}

export default PanelContent;
