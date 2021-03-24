/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeStyles } from '@material-ui/core/styles';

// use material ui theming
const useStyles = makeStyles((theme) => ({
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

/**
 * interface for the layers list properties
 */
interface LayersListProps {
    layersData: any;
    selectLayer: any;
    selectFeature: any;
    getSymbol: any;
}

/**
 * A react component that will list the map server layers defined in the map config
 *
 * @param {LayersListProps} props properties passed to the component
 * @returns a React JSX Element containing map server layers
 */
const LayersList = (props: LayersListProps): JSX.Element => {
    const { layersData, selectFeature, selectLayer, getSymbol } = props;

    const classes = useStyles();

    /**
     * Switch to the feature list / entries panel content
     *
     * @param {Object} data data object of all layers
     * @param {Object} layerObj the layer object to list it's entries
     */
    const goToFeatureList = (data: any, layerObj: any) => {
        const { layerData, displayField, fieldAliases, renderer } = data.layers[layerObj];

        // set the layer entry data
        selectLayer(data.layers[layerObj]);

        // check if the layer has only one entry
        if (layerData.length === 1) {
            // go to the entry information skipping entry list
            selectFeature({
                attributes: layerData[0].attributes,
                displayField,
                fieldAliases,
                symbol: getSymbol(renderer, layerData[0].attributes),
                numOfEntries: 1,
            });
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
                                Object.keys(data.layers).map((layerObj, index) => {
                                    const { layer, layerData, groupLayer } = data.layers[layerObj];

                                    return (
                                        <div
                                            key={index}
                                            tabIndex={layerData.length > 0 && !groupLayer ? 0 : -1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (!groupLayer) {
                                                        goToFeatureList(data, layerObj);
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
                                                        className={classes.layerItem}
                                                        disabled={layerData.length === 0}
                                                        onClick={
                                                            layerData.length > 0
                                                                ? () => {
                                                                      // if a layer is clicked
                                                                      goToFeatureList(data, layerObj);
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
};

export default LayersList;
