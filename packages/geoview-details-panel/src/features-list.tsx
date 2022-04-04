/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { TypeJsonValue, TypeLayersEntry, TypeFeaturesListProps, TypeWindow, TypeJsonString, TypeJsonObject } from 'geoview-core';

const w = window as TypeWindow;

/**
 * A react component to display layer entries
 *
 * @param {TypeFeaturesListProps} props properties of the component
 * @returns A react JSX Element containing the entry list of a layer
 */
function FeaturesList(props: TypeFeaturesListProps): JSX.Element {
  const { selectedLayer, selectLayer, selectFeature, setPanel, getSymbol, buttonPanel } = props;

  // access the cgpv object from the window object
  const { cgpv } = w;

  // access the api calls
  const { react, ui, useTranslation } = cgpv;

  const { useEffect } = react;

  const { displayField, fieldAliases, layerData, renderer } = selectedLayer as TypeLayersEntry;

  // use material ui theming
  const useStyles = ui.makeStyles(() => ({
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

  const classes = useStyles();

  const { t } = useTranslation();

  /**
   * Switch to the feature / entry info panel content
   *
   * @param {Object} attributes attributes object for the layer attributes
   * @param {Object} symbolImage symbology image data
   */
  const goToFeatureInfo = (attributes: TypeJsonValue, symbolImage: TypeJsonValue) => {
    // add a back action button on the entry information panel to go back to the entry list
    buttonPanel.panel?.addActionButton('back', t('action_back'), '<i class="material-icons">keyboard_backspace</i>', () => {
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
    buttonPanel.panel?.addActionButton('back', t('action_back'), '<i class="material-icons">keyboard_backspace</i>', () => {
      // set the panel content back to the map server layer list
      setPanel(true, false, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return layerData.length > 0 ? (
    <div className={classes.featuresContainer}>
      {
        // loop through each entry
        layerData.map((feature: TypeJsonObject, i: number) => {
          const attributes = feature?.attributes;

          // get symbol
          const symbolImage = getSymbol(renderer, attributes);

          // get the title from the attributes, if no title was defined in the layer then set it to the objectId
          const attributesDisplayField = attributes[displayField] as TypeJsonString;
          const title =
            attributesDisplayField && attributesDisplayField.length > 0 ? `${attributesDisplayField}` : `${attributes.OBJECTID}`;

          return (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
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
                    {symbolImage!.imageData ? (
                      <img
                        className={classes.featureItemIcon}
                        src={`data:${symbolImage!.contentType};base64, ${symbolImage!.imageData}`}
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
}

export default FeaturesList;
