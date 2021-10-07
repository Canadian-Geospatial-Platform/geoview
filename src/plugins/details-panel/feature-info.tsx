/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable no-nested-ternary */
import { useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import { TypeJSONObject, TypeFeatureInfoProps } from '../../types/cgpv-types';

// use material ui theming
const useStyles = makeStyles(() => ({
    featureInfoContainer: {
        width: '100%',
    },
    featureInfoHeader: {
        display: 'flex',
        alignItems: 'center',
    },
    featureInfoHeaderIconContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '32px',
        minWidth: '32px',
        height: '32px',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 2px 1px -1px rgb(0 0 0 / 12%)',
    },
    featureInfoHeaderIcon: {},
    featureInfoHeaderText: {
        marginLeft: '10px',
        width: '100%',
        fontSize: 18,
    },
    featureInfoItemsContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 20,
    },
    featureInfoItem: {
        display: 'flex',
        flexDirection: 'column',
        margin: '5px 0',
    },
    featureInfoItemKey: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    featureInfoItemValue: {
        fontSize: 16,
        backgroundColor: '#ddd',
    },
}));

/**
 * A react component that will return entry / feature information
 *
 * @param {Object} props properties for the component
 * @returns A react JSX Element with the entry / feature information
 */
const FeatureInfo = (props: TypeFeatureInfoProps): JSX.Element => {
    const { buttonPanel, selectedFeature, setPanel } = props;

    const { displayField, fieldAliases, attributes, symbol, numOfEntries } = selectedFeature;

    const classes = useStyles();

    const { t } = useTranslation<string>();

    useEffect(() => {
        // add new action button that goes back to the entry / features list or layers list
        buttonPanel.panel?.addActionButton('back', t('action_back'), '<i class="material-icons">keyboard_backspace</i>', () => {
            if (numOfEntries === 1) {
                // set panel back to layers list
                setPanel(true, false, false);
            } else {
                // set panel back to entry / feature list
                setPanel(false, true, false);
            }
        });
    }, []);

    return (
        <div className={classes.featureInfoContainer}>
            <div className={classes.featureInfoHeader}>
                <div className={classes.featureInfoHeaderIconContainer}>
                    {symbol.imageData ? (
                        <img
                            className={classes.featureInfoHeaderIcon}
                            src={`data:${symbol.contentType};base64, ${symbol.imageData}`}
                            alt=""
                        />
                    ) : symbol.legendImageUrl ? (
                        <img className={classes.featureInfoHeaderIcon} src={symbol.legendImageUrl as string} alt="" />
                    ) : (
                        <div className={classes.featureInfoHeaderIcon} />
                    )}
                </div>
                <span className={classes.featureInfoHeaderText}>
                    {(attributes[displayField as string] as TypeJSONObject[]).length > 0
                        ? `${attributes[displayField as string]}`
                        : `${attributes.OBJECTID}`}
                </span>
            </div>
            <div className={classes.featureInfoItemsContainer}>
                {
                    // loop through each attribute in the selected entry / feature
                    Object.keys(attributes).map((attrKey) => {
                        const attributeAlias = fieldAliases[attrKey] as string;
                        const attributeValue = attributes[attrKey] as string;

                        return (
                            attributeValue.length > 0 &&
                            attributeAlias !== 'OBJECTID' &&
                            attributeAlias !== 'SHAPE' &&
                            attributeAlias !== 'SHAPE_Length' &&
                            attributeAlias !== 'SHAPE_Area' && (
                                <div className={classes.featureInfoItem} key={attrKey} tabIndex={0}>
                                    <span className={classes.featureInfoItemKey}>{attributeAlias}</span>
                                    <span className={classes.featureInfoItemValue}>{attributeValue}</span>
                                </div>
                            )
                        );
                    })
                }
            </div>
        </div>
    );
};

export default FeatureInfo;
