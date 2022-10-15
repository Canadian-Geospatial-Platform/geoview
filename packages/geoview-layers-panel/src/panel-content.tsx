import { toJsonObject, TypePanelProps, TypeJsonObject, TypeWindow } from 'geoview-core';

import LayerStepper from './layer-stepper';
import LayersList from './layers-list';

const w = window as TypeWindow;

/**
 * A react component that displays the details panel content
 *
 * @param {TypePanelContentProps} props the properties of the pane content
 * @returns {JSX.Element} A React JSX Element with the details panel
 */
function PanelContent(props: TypePanelProps): JSX.Element {
  const { panelMapId, buttonPanel } = props;

  const { cgpv } = w;
  const { api, react, ui } = cgpv;
  const { useState, useEffect } = react;
  const [addLayerVisible, setAddLayerVisible] = useState(false);
  const [mapLayers, setMapLayers] = useState({});
  const { Button } = ui.elements;

  const { displayLanguage } = api.map(panelMapId!);

  const translations: TypeJsonObject = toJsonObject({
    en: {
      addLayer: 'Add Layer',
    },
    fr: {
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
    setMapLayers(() => ({ ...api.map(panelMapId!).layer.layers }));

    api.event.on(
      api.eventNames.LAYER.EVENT_LAYER_ADDED,
      () =>
        setMapLayers(() => ({
          ...api.map(panelMapId!).layer.layers,
        })),
      panelMapId
    );
    api.event.on(
      api.eventNames.LAYER.EVENT_REMOVE_LAYER,
      () =>
        setMapLayers(() => ({
          ...api.map(panelMapId!).layer.layers,
        })),
      panelMapId
    );
    api.event.on(
      api.eventNames.PANEL.EVENT_PANEL_CLOSE,
      () => {
        setAddLayerVisible(false);
      },
      panelMapId,
      buttonPanel.id
    );

    return () => {
      api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, panelMapId);
      api.event.off(api.eventNames.LAYER.EVENT_REMOVE_LAYER, panelMapId);
      api.event.off(api.eventNames.PANEL.EVENT_PANEL_CLOSE, panelMapId, buttonPanel.id);
    };
  }, [api, buttonPanel.id, panelMapId]);

  return (
    <>
      <div className={classes.mainContainer}>
        <Button
          className={classes.addLayerButton}
          tooltip={translations[displayLanguage].addLayer as string}
          tooltipPlacement="right"
          variant="contained"
          type="icon"
          icon='<i class="material-icons">add</i>'
          onClick={onClick}
        />
      </div>
      {addLayerVisible && <LayerStepper mapId={panelMapId!} setAddLayerVisible={setAddLayerVisible} />}
      <div style={{ display: addLayerVisible ? 'none' : 'inherit' }}>
        <LayersList mapId={panelMapId!} layers={mapLayers} displayLanguage={displayLanguage} />
      </div>
    </>
  );
}

export default PanelContent;
