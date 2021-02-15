import React, { useEffect, useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    card: {
        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
        transition: '0.3s',
        borderRadius: '5px',
        '&:hover': {
            boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.2)',
        },
        marginBottom: 10,
        height: '120px',
        width: '100%',
        display: 'block',
        position: 'relative',
    },
    thumbnail: {
        borderRadius: '5px',
        position: 'absolute',
        height: '100%',
        width: '100%',
        opacity: 0.8,
    },
    container: {
        background: 'rgba(0,0,0,.68)',
        color: '#fff',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 5px',
        boxSizing: 'border-box',
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: 'inherit',
    },
}));

/**
 * Create a new basemap switcher component
 *
 * @param {*} props basemap switcher properties
 */
const BasemapSwitcher = (props) => {
    const [basemapList, setBasemapList] = useState([]);

    const classes = useStyles();

    // get a reference to the viewer api
    const { cgpv } = window;

    // get the mapId and language passed in when loading the component
    const { mapId, language } = props;

    /**
     * Create a new basemap
     *
     * @param {string} id the id of the basemap to be created
     * @param {Object} basemapProps basemap properties
     */
    const createBasemap = (id, basemapProps) => {
        // check if basemap with provded ID exists
        const exists = basemapList.filter((basemap) => basemap.id === id);

        // if basemap does not exist then create a new one
        if (exists.length === 0) {
            const basemap = { ...basemapProps, id };

            // create the basemap
            cgpv.api.map(mapId).createBasemap(basemap);
        }
    };

    /**
     * Update the basemap with the layers on the map
     *
     * @param {string} id update the basemap on the map
     */
    const setBasemap = (id) => {
        cgpv.api.map(mapId).setBasemap(id);
    };

    /**
     * load existing basemaps and create new basemaps
     */
    useEffect(() => {
        // get existing basemaps
        const { basemaps } = cgpv.api.map(mapId);

        // set the basemaps in the list
        setBasemapList(basemaps);

        // create a new basemap with transport and label layers
        createBasemap('transportWithLabels', {
            name: 'Transport with Labels',
            description:
                'This Canadian basemap provides geographic context with bilingual labels and an emphasis on transportation networks. From Natural Resources Canada.',
            descSummary: '',
            altText: 'Transport with labels',
            thumbnailUrl: '',
            layers: [
                {
                    id: 'transport',
                    type: 'transport',
                    url:
                        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
                    opacity: 1,
                },
                {
                    id: 'label',
                    type: 'label',
                    url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg'.replaceAll(
                        'xxxx',
                        language === 'en-CA' ? 'CBMT' : 'CBCT'
                    ),
                    opacity: 0.75,
                },
            ],
            attribution: 'test attribution',
            zoomLevels: {
                min: 0,
                max: 0,
            },
        });

        // create a new basemap with only transport layer
        createBasemap('transportWithNoLabels', {
            name: 'Transport without labels',
            description:
                'This Canadian basemap provides geographic context that emphasis on transportation networks. From Natural Resources Canada.',
            descSummary: '',
            altText: 'Transport without labels',
            thumbnailUrl: '',
            layers: [
                {
                    id: 'transport',
                    type: 'transport',
                    url:
                        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
                    opacity: 1,
                },
            ],
            attribution: 'test attribution',
            zoomLevels: {
                min: 0,
                max: 0,
            },
        });

        // create a new basemap with shaded relief layer
        createBasemap('shadedRelief', {
            name: 'Shaded Relief',
            description: '":"This Canadian base map provides geographic context using shaded relief. From Natural Resources Canada.',
            descSummary: '',
            altText: 'Shaded Relief',
            thumbnailUrl: '',
            layers: [
                {
                    id: 'shaded',
                    type: 'shaded',
                    url:
                        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
                    opacity: 1,
                },
            ],
            attribution: 'test attribution',
            zoomLevels: {
                min: 0,
                max: 0,
            },
        });

        // create a new basemap with shaded relief and labels layer
        createBasemap('shadedLabel', {
            name: 'Shaded Relief with Labels',
            description:
                '":"This Canadian base map provides geographic context using shaded relief with labels. From Natural Resources Canada.',
            descSummary: '',
            altText: 'Shaded Relief with Labels',
            thumbnailUrl: '',
            layers: [
                {
                    id: 'shaded',
                    type: 'shaded',
                    url:
                        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
                    opacity: 1,
                },
                {
                    id: 'label',
                    type: 'label',
                    url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg'.replaceAll(
                        'xxxx',
                        language === 'en-CA' ? 'CBMT' : 'CBCT'
                    ),
                    opacity: 1,
                },
            ],
            attribution: 'test attribution',
            zoomLevels: {
                min: 0,
                max: 0,
            },
        });
    }, []);

    return (
        <div>
            {basemapList.map((basemap) => {
                return (
                    <div
                        role="button"
                        tabIndex="0"
                        className={classes.card}
                        onClick={() => setBasemap(basemap.id)}
                        onKeyPress={() => setBasemap(basemap.id)}
                        key={basemap.id}
                    >
                        {typeof basemap.thumbnailUrl === 'string' && (
                            <img src={basemap.thumbnailUrl} alt={basemap.altText} className={classes.thumbnail} />
                        )}

                        {Array.isArray(basemap.thumbnailUrl) &&
                            basemap.thumbnailUrl.map((thumbnail) => {
                                return <img src={thumbnail} alt={basemap.altText} className={classes.thumbnail} />;
                            })}

                        <div className={classes.container}>{basemap.name}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default BasemapSwitcher;
