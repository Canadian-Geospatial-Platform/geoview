import type React from 'react';
import { toJsonObject, TypeJsonObject, TypeButtonPanel } from 'geoview-core';
import { logger } from 'geoview-core/src/core/utils/logger';

import LayerStepper from './layer-stepper';
import ReorderLayersList from './reorder-layers-list';

type TypePanelContentProps = {
  buttonPanel: TypeButtonPanel;
  mapId: string;
};

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns {JSX.Element} A React JSX Element with the details panel
 */
function PanelContent(props: TypePanelContentProps): JSX.Element {
  const { mapId, buttonPanel } = props;

  const { cgpv } = window;
  const { api, ui, react } = cgpv;
  const { useState, useEffect } = react;
  const [addLayerVisible, setAddLayerVisible] = useState(false);
  const [reorderLayersVisible, setReorderLayersVisible] = useState(false);
  const [mapLayers, setMapLayers] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [legend, setLegend] = useState<React.DetailedReactHTMLElement<{}, HTMLElement> | null>();
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

  const displayLanguage = api.maps[mapId].getDisplayLanguage();

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
    // Log
    logger.logTraceCoreAPIEvent('PANEL-CONTENT - updateLayers');

    if (api.maps[mapId].layer?.layerOrder !== undefined) setMapLayers([...api.maps[mapId].layer.layerOrder].reverse());
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('PANEL-CONTENT - mount 1');

    api.event.on(api.eventNames.MAP.EVENT_MAP_LOADED, updateLayers, mapId);
    api.event.on(api.eventNames.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED, updateLayers, `${mapId}/LegendsLayerSet`);

    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_LOADED, mapId, updateLayers);
      api.event.off(api.eventNames.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED, mapId, updateLayers);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // setLegend(api.maps[mapId!].legend.createLegend({ layerIds: mapLayers, isRemoveable: true, canSetOpacity: true, canZoomTo: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('PANEL-CONTENT - mount 2');

    const setAddLayerVisibleListenerFunction = () => {
      // Log
      logger.logTraceCoreAPIEvent('PANEL-CONTENT - setAddLayerVisibleListenerFunction');

      setAddLayerVisible(false);
    };

    api.event.on(api.eventNames.PANEL.EVENT_PANEL_CLOSE, setAddLayerVisibleListenerFunction, `${mapId}/${buttonPanel.buttonPanelId}`);
    return () => {
      api.event.off(api.eventNames.PANEL.EVENT_PANEL_CLOSE, `${mapId}/${buttonPanel.buttonPanelId}`, setAddLayerVisibleListenerFunction);
    };
  }, [api, buttonPanel.buttonPanelId, mapId]);

  // DEPRECATED, THIS PACKAGE WILL BE REMOVE SOON
  // TODO: REMOVE
  useEffect(() => {
    // setLegend(
    //   api.maps[mapId!].legend.createLegend({
    //     layerIds: mapLayers,
    //     isRemoveable: true,
    //     canSetOpacity: true,
    //     expandAll: isExpandAll,
    //     canZoomTo: true,
    //   })
    // );
    setLegend(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpandAll]);

  useEffect(() => {
    // setLegend(
    //   api.maps[mapId!].legend.createLegend({
    //     layerIds: mapLayers,
    //     isRemoveable: true,
    //     canSetOpacity: true,
    //     hideAll: isHideAll,
    //     canZoomTo: true,
    //   })
    // );
    setLegend(null);
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
      const x = window.scrollX;
      const y = window.scrollY;
      window.onscroll = () => {
        window.scrollTo(x, y);
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      window.onscroll = () => {};
    }
  }, [reorderLayersVisible]);

  return (
    <>
      <Menu anchorEl={actionMenuAnchorElement} open={actionMenuOpen} onClose={handleCloseMenu}>
        <MenuItem onClick={() => handleExpandAllClick(true)}>
          <ListItemIcon>
            <ExpandMoreIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].expandAll as string}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExpandAllClick(false)}>
          <ListItemIcon>
            <ExpandLessIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].collapseAll as string}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShowAllClick(true)}>
          <ListItemIcon>
            <VisibilityIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].showAll as string}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShowAllClick(false)}>
          <ListItemIcon>
            <VisibilityOffIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].hideAll as string}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleReorderLayersClick(true)}>
          <ListItemIcon>
            <ReorderIcon />
          </ListItemIcon>
          <ListItemText>{translations[displayLanguage].reorderLayers as string}</ListItemText>
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
            {translations[displayLanguage].addLayer as string}
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
