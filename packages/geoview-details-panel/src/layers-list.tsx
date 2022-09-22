/* eslint-disable react/no-array-index-key */
import { markerDefinitionPayload } from 'geoview-core/src/api/events/payloads/marker-definition-payload';
import { AbstractGeoViewLayer, TypeWindow, toJsonObject } from 'geoview-core';
import { TypeLayersListProps } from './details-panel-types';

// get the window object
const w = window as TypeWindow;

/**
 * A react component that will list the map server layers defined in the map config
 *
 * @param {TypeLayersListProps} props properties passed to the component
 * @returns a React JSX Element containing map server layers
 */
function LayersList(props: TypeLayersListProps): JSX.Element {
  const { layersData, selectFeature, selectLayer, getSymbol, clickPos, mapId } = props;

  // access the cgpv object from the window object
  const { cgpv } = w;

  // access the api calls
  const { api, ui } = cgpv;

  // get event names
  const EVENT_NAMES = api.eventNames;

  // use material ui theming
  const useStyles = ui.makeStyles(() => ({
    layersContainer: {
      overflow: 'hidden',
      overflowY: 'auto',
      width: '100%',
    },
    layerItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '5px 0',
      padding: '10px 5px',
      boxSizing: 'content-box',
      '&:hover': {
        cursor: 'pointer',
        backgroundColor: '#c9c9c9',
      },
      zIndex: 1000,
      border: 'none',
      width: '100%',
    },
    layerParentText: {
      fontSize: '16px',
      fontWeight: 'bold',
    },
    layerCountTextContainer: {
      display: 'flex',
      // justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
    },
    layerFeatureCount: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '32px',
      minWidth: '32px',
      height: '32px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 2px 1px -1px rgb(0 0 0 / 12%)',
      marginRight: '10px',
      color: 'black',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    layerItemText: {
      fontSize: '14px',
      // fontWeight: 'bold',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  }));

  const classes = useStyles();

  /**
   * Switch to the feature list / entries panel content
   *
   * @param {Object} data data object of all layers
   * @param {number} layerKey the layer object to list it's entries
   */
  const goToFeatureList = (data: AbstractGeoViewLayer, layerKey: number) => {
    const { layerData, displayField, fieldAliases, renderer } = data.listOfLayerEntryConfig[layerKey];

    // set the layer entry data
    selectLayer(data.listOfLayerEntryConfig[layerKey]);

    // check if the layer has only one entry
    if (layerData.length === 1) {
      // go to the entry information skipping entry list
      const attributes = layerData[0]?.attributes;
      selectFeature(
        toJsonObject({
          attributes,
          displayField,
          fieldAliases,
          symbol: getSymbol(renderer, attributes),
          numOfEntries: 1,
        })
      );
    }
  };

  return (
    <div className={classes.layersContainer}>
      {
        // loop through each map server layer
        Object.keys(layersData).map((dataKey) => {
          const data = layersData[dataKey];

          return (
            <div key={data.id}>
              {
                // loop through each layer in the map server
                Object.keys(data.layers).map((layerKey: string, index: number) => {
                  const { layer, layerData, groupLayer } = data.layers[layerKey];

                  return (
                    <div
                      key={index}
                      tabIndex={layerData.length > 0 && !groupLayer ? 0 : -1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (!groupLayer) {
                            e.preventDefault();
                            goToFeatureList(data, layerKey);
                          }
                        }
                      }}
                      role="button"
                    >
                      {
                        // if the map server is a group layer then display its title as a header of it's sub layers
                        groupLayer ? (
                          <div className={classes.layerParentText} title={layer.name}>
                            {layer.name}
                          </div>
                        ) : (
                          <button
                            type="button"
                            tabIndex={-1}
                            className={classes.layerItem}
                            disabled={layerData.length === 0}
                            onClick={
                              layerData.length > 0
                                ? () => {
                                    // if a layer is clicked
                                    goToFeatureList(data, layerKey);

                                    api.event.emit(
                                      markerDefinitionPayload(
                                        EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW,
                                        mapId,
                                        clickPos!,
                                        getSymbol(data.layers[layerKey].renderer, layerData[0].attributes)!
                                      )
                                    );
                                  }
                                : undefined
                            }
                          >
                            <div className={classes.layerCountTextContainer}>
                              <span className={classes.layerFeatureCount}>{layerData.length}</span>
                              <div className={classes.layerItemText} title={layer.name}>
                                {layer.name}
                              </div>
                            </div>
                          </button>
                        )
                      }
                    </div>
                  );
                })
              }
            </div>
          );
        })
      }
    </div>
  );
}

export default LayersList;
