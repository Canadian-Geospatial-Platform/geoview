/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';

// use material ui theming
const useStyles = makeStyles((theme) => ({
    featuresContainer: {
        overflow: 'hidden',
        overflowY: 'auto',
        width: '100%',
    },
    featureItem: {
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
    },
    featureIconTextContainer: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    featureItemIconContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '32px',
        minWidth: '32px',
        height: '32px',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 2px 1px -1px rgb(0 0 0 / 12%)',
    },
    featureItemIcon: {},
    featureItemText: {
        display: 'inline-block',
        width: '100%',
        fontWeight: 400,
        marginLeft: '10px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        fontSize: '16px',
    },
}));

/**
 * Interface used for the Features List properties
 */
interface FeaturesListProps {
    selectLayer: any;
    selectedLayer: any;
    selectFeature: any;
    buttonPanel: any;
    getSymbol: any;
    setPanel: any;
}

/**
 * A react component to display layer entries
 *
 * @param {FeaturesListProps} props properties of the component
 * @returns A react JSX Element containing the entry list of a layer
 */
const FeaturesList = (props: FeaturesListProps): JSX.Element => {
    const { selectedLayer, selectLayer, selectFeature, setPanel, getSymbol, buttonPanel } = props;

    const { displayField, fieldAliases, layerData, renderer } = selectedLayer;

    const classes = useStyles();

    const { t } = useTranslation();

    /**
     * Switch to the feature / entry info panel content
     *
     * @param {Object} attributes attributes object for the layer attributes
     * @param {Object} symbolImage symbology image data
     */
    const goToFeatureInfo = (attributes: any, symbolImage: any) => {
        // add a back action button on the entry information panel to go back to the entry list
        buttonPanel.panel.addActionButton('back', t('action_back'), '<i class="material-icons">keyboard_backspace</i>', () => {
            if (layerData.length === 1) {
                setPanel(true, false, false);
            } else {
                // go back to entry list when clicked
                selectLayer();
            }
        });

        // set panel content to the entry information
        selectFeature({
            attributes,
            displayField,
            fieldAliases,
            symbol: symbolImage,
            numOfEntries: layerData.length,
        });
    };

    useEffect(() => {
        // add new action button that goes back to the layers list
        buttonPanel.panel.addActionButton('back', t('action_back'), '<i class="material-icons">keyboard_backspace</i>', () => {
            // set the panel content back to the map server layer list
            setPanel(true, false, false);
        });
    }, []);

    return layerData.length > 0 ? (
        <div className={classes.featuresContainer}>
            {
                // loop through each entry
                layerData.map((feature: any, i: any) => {
                    const { attributes } = feature;

                    // get symbol
                    const symbolImage = getSymbol(renderer, attributes);

                    // get the title from the attributes, if no title was defined in the layer then set it to the objectId
                    const title = attributes[displayField].length > 0 ? `${attributes[displayField]}` : `${attributes.OBJECTID}`;

                    return (
                        <div
                            key={i}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    goToFeatureInfo(attributes, symbolImage);
                                }
                            }}
                            role="button"
                        >
                            <div
                                className={classes.featureItem}
                                onClick={() => {
                                    goToFeatureInfo(attributes, symbolImage);
                                }}
                                role="button"
                            >
                                <div className={classes.featureIconTextContainer}>
                                    <div className={classes.featureItemIconContainer}>
                                        {symbolImage.imageData ? (
                                            <img
                                                className={classes.featureItemIcon}
                                                src={`data:${symbolImage.contentType};base64, ${symbolImage.imageData}`}
                                                alt=""
                                            />
                                        ) : renderer.symbol.legendImageUrl ? (
                                            <img className={classes.featureItemIcon} src={renderer.symbol.legendImageUrl} alt="" />
                                        ) : (
                                            <div className={classes.featureItemIcon} />
                                        )}
                                    </div>
                                    <span className={classes.featureItemText} title={title}>
                                        {title}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            }
        </div>
    ) : (
        <div className={classes.featureItemText}>{t('nothing_found')}</div>
    );
};

export default FeaturesList;
