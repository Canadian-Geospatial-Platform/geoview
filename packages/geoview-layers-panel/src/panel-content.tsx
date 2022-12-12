import {
  toJsonObject,
  TypeJsonObject,
  TypeWindow,
  TypeButtonPanel,
  payloadIsALayerConfig,
  payloadIsRemoveGeoViewLayer,
} from 'geoview-core';
import { DetailedReactHTMLElement } from 'react';

import LayerStepper from './layer-stepper';

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
  const { api, react, ui } = cgpv;
  const { useState, useEffect } = react;
  const [addLayerVisible, setAddLayerVisible] = useState(false);
  const [mapLayers, setMapLayers] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [legend, setLegend] = useState<DetailedReactHTMLElement<{}, HTMLElement>>();
  const { Typography, IconButton, AddIcon, Box } = ui.elements;

  const { displayLanguage } = api.map(mapId!);

  const translations: TypeJsonObject = toJsonObject({
    en: {
      addLayer: 'Add Layer',
    },
    fr: {
      addLayer: 'Ajouter Couche',
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

  const onClick = () => setAddLayerVisible((state: boolean) => !state);

  const addLayer = (addGeoviewLayerId: string) => {
    if (Object.keys(api.map(mapId).layer.geoviewLayers).includes(addGeoviewLayerId)) {
      setMapLayers((orderedLayers) => [addGeoviewLayerId, ...orderedLayers]);
    } else {
      console.error('geoviewLayerId is not in the layers list');
    }
  };

  const removeLayer = (removeGeoviewLayerId: string) => {
    setMapLayers((orderedLayers) => orderedLayers.filter((layerId) => layerId !== removeGeoviewLayerId));
  };

  useEffect(() => {
    setMapLayers(Object.keys(api.map(mapId!).layer.geoviewLayers));
    api.event.on(
      api.eventNames.LAYER.EVENT_REMOVE_LAYER,
      (payload) => {
        if (payloadIsRemoveGeoViewLayer(payload)) {
          removeLayer(payload.geoviewLayer.geoviewLayerId);
        }
      },
      mapId
    );
    api.event.on(
      api.eventNames.LAYER.EVENT_ADD_LAYER,
      (payload) => {
        if (payloadIsALayerConfig(payload)) {
          api.event.on(
            api.eventNames.LAYER.EVENT_LAYER_ADDED,
            () => {
              addLayer(payload.layerConfig.geoviewLayerId);
              api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, mapId, payload.layerConfig.geoviewLayerId);
            },
            mapId,
            payload.layerConfig.geoviewLayerId
          );
        }
      },
      mapId
    );
    return () => {
      api.event.off(api.eventNames.LAYER.EVENT_ADD_LAYER, mapId);
      api.event.off(api.eventNames.LAYER.EVENT_REMOVE_LAYER, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLegend(api.map(mapId!).legend.createLegend({ layerIds: mapLayers, isRemoveable: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  useEffect(() => {
    api.event.on(
      api.eventNames.PANEL.EVENT_PANEL_CLOSE,
      () => {
        setAddLayerVisible(false);
      },
      mapId,
      buttonPanel.buttonPanelId
    );

    return () => {
      api.event.off(api.eventNames.PANEL.EVENT_PANEL_CLOSE, mapId, buttonPanel.buttonPanelId);
    };
  }, [api, buttonPanel.buttonPanelId, mapId]);

  return (
    <Box sx={sxClasses.mainContainer}>
      {addLayerVisible && <LayerStepper mapId={mapId!} setAddLayerVisible={setAddLayerVisible} />}
      {/* <Box sx={sxClasses.topControls} style={{ display: addLayerVisible ? 'none' : 'flex' }}>
        <div>Expand All</div>
        <div>Hide All</div>
      </Box> */}
      <div style={{ display: addLayerVisible ? 'none' : 'block' }}>{legend}</div>
      <Box sx={sxClasses.addLayerSection} onClick={onClick}>
        <Typography>{translations[displayLanguage].addLayer}</Typography>
        <IconButton>
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default PanelContent;
