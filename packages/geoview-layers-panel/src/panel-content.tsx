<<<<<<< HEAD
import { TypePanelContentProps, TypeProps } from 'geoview-core';
=======
import { TypePanelContentProps, TypeProps, TypeWindow } from 'geoview-core';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d

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
  const { mapId } = props;

<<<<<<< HEAD
  const cgpv = w['cgpv'];
=======
  const { cgpv } = w;
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
  const { api, react, ui } = cgpv;
  const { useState, useEffect } = react;
  const [addLayerVisible, setAddLayerVisible] = useState(false);
  const [mapLayers, setMapLayers] = useState({});
  const { Button } = ui.elements;

  const { language } = api.map(mapId);

<<<<<<< HEAD
  const translations: TypeProps<TypeProps<any>> = {
=======
  const translations: TypeProps<TypeProps<string>> = {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
    'en-CA': {
      addLayer: 'Add Layer',
    },
    'fr-CA': {
      addLayer: 'Ajouter Couche',
    },
  };

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
      api.eventNames.EVENT_LAYER_ADDED,
      () =>
        setMapLayers(() => ({
          ...api.map(mapId).layer.layers,
        })),
      mapId
    );
    api.event.on(
      api.eventNames.EVENT_REMOVE_LAYER,
      () =>
        setMapLayers(() => ({
          ...api.map(mapId).layer.layers,
        })),
      mapId
    );
    api.event.on(
      api.eventNames.EVENT_PANEL_CLOSE,
      () => {
        setAddLayerVisible(false);
      },
      mapId
    );

    return () => {
      api.event.off(api.eventNames.EVENT_LAYER_ADDED, mapId);
      api.event.off(api.eventNames.EVENT_REMOVE_LAYER, mapId);
      api.event.off(api.eventNames.EVENT_PANEL_CLOSE, mapId);
    };
  }, [api, mapId]);

  return (
    <>
      <div className={classes.mainContainer}>
        <Button
          className={classes.addLayerButton}
          tooltip={translations[language].addLayer}
          tooltipPlacement="right"
          variant="contained"
          type="icon"
          icon='<i class="material-icons">add</i>'
          onClick={onClick}
        />
      </div>
<<<<<<< HEAD
      <div style={{ display: addLayerVisible ? 'inherit' : 'none' }}>
        <LayerStepper mapId={mapId} setAddLayerVisible={setAddLayerVisible} />
      </div>
=======
      {addLayerVisible && <LayerStepper mapId={mapId} setAddLayerVisible={setAddLayerVisible} />}
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
      <div style={{ display: addLayerVisible ? 'none' : 'inherit' }}>
        <LayersList mapId={mapId} layers={mapLayers} language={language} />
      </div>
    </>
  );
}

export default PanelContent;
