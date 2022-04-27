import { toJsonObject, TypePanelContentProps, TypeJsonObject, TypeWindow } from 'geoview-core';

import LayerStepper from './layer-stepper';
import LayersList from './layers-list';

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
  const [mapLayers, setMapLayers] = useState({});
  const { Button } = ui.elements;

  const { language } = api.map(mapId);

  const translations: TypeJsonObject = toJsonObject({
    'en-CA': {
      addLayer: 'Add Layer',
    },
    'fr-CA': {
      addLayer: 'Ajouter Couche',
    },
  });

  const useStyles = ui.makeStyles(() => ({
    mainContainer: {
      display: 'flex',
      flexDirection: 'row',
    },
    addLayerButton: {
      width: 50,
      minWidth: 50,
      '& > div': {
        textAlign: 'center',
      },
    },
  }));
  const classes = useStyles();

  const onClick = () => setAddLayerVisible((state: boolean) => !state);

  useEffect(() => {
    setMapLayers(() => ({ ...api.map(mapId).layer.layers }));

    api.event.on(
      api.eventNames.LAYER.EVENT_LAYER_ADDED,
      () =>
        setMapLayers(() => ({
          ...api.map(mapId).layer.layers,
        })),
      mapId
    );
    api.event.on(
      api.eventNames.LAYER.EVENT_REMOVE_LAYER,
      () =>
        setMapLayers(() => ({
          ...api.map(mapId).layer.layers,
        })),
      mapId
    );
    api.event.on(
      api.eventNames.PANEL.EVENT_PANEL_CLOSE,
      () => {
        setAddLayerVisible(false);
      },
      mapId,
      buttonPanel.id
    );

    return () => {
      api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, mapId);
      api.event.off(api.eventNames.LAYER.EVENT_REMOVE_LAYER, mapId);
      api.event.off(api.eventNames.PANEL.EVENT_PANEL_CLOSE, mapId, buttonPanel.id);
    };
  }, [api, buttonPanel.id, mapId]);

  return (
    <>
      <div className={classes.mainContainer}>
        <Button
          className={classes.addLayerButton}
          tooltip={translations[language].addLayer as string}
          tooltipPlacement="right"
          variant="contained"
          type="icon"
          icon='<i class="material-icons">add</i>'
          onClick={onClick}
        />
      </div>
      {addLayerVisible && <LayerStepper mapId={mapId} setAddLayerVisible={setAddLayerVisible} />}
      <div style={{ display: addLayerVisible ? 'none' : 'inherit' }}>
        <LayersList mapId={mapId} layers={mapLayers} language={language} />
      </div>
    </>
  );
}

export default PanelContent;
