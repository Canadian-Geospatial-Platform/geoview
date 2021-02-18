/* eslint-disable func-names */
/* eslint-disable object-shorthand */
(function () {
    /**
     * BasemapSwitcher plugin that will create a react component to list basemaps and switch them
     */
    class BasemapSwitcher {
        translations = () => {
            return {
                'en-CA': {
                    'basemap-transport-label': {
                        name: 'Transport with Labels',
                        desc: '',
                    },
                    'basemap-transport': {
                        name: 'Transport without labels',
                        desc: '',
                    },
                    'basemap-shaded': {
                        name: 'Shaded Relief',
                        desc: '',
                    },
                    'basemap-shaded-label': {
                        name: 'Shaded Relief with Labels',
                        desc: '',
                    },
                    layer: {
                        type: 'CBMT',
                    },
                },
                'fr-CA': {
                    'basemap-transport-label': {
                        name: 'Transport avec des étiquettes',
                        desc: '',
                    },
                    'basemap-transport': {
                        name: 'Transport sans étiquettes',
                        desc: '',
                    },
                    'basemap-shaded': {
                        name: 'Relief ombré',
                        desc: '',
                    },
                    'basemap-shaded-label': {
                        name: 'Relief ombré avec étiquettes',
                        desc: '',
                    },

                    layer: {
                        type: 'CBCT',
                    },
                },
            };
        };

        added = () => {
            const { api, react, makeStyles, translate } = this;
            const { mapId } = this.props;

            // used to create react element
            const h = this.createElement;

            // get the map language
            const language = api.map(mapId);

            const { useState, useEffect } = react;
            const { useTranslation } = translate;

            const useStyles = makeStyles((theme) => ({
                listContainer: {
                    overflowY: 'scroll',
                    height: '600px',
                },
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

            const component = () => {
                const [basemapList, setBasemapList] = useState([]);

                const classes = useStyles();

                const { t } = useTranslation();

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
                        api.map(mapId).createBasemap(basemap);
                    }
                };

                /**
                 * Update the basemap with the layers on the map
                 *
                 * @param {string} id update the basemap on the map
                 */
                const setBasemap = (id) => {
                    api.map(mapId).setBasemap(id);
                };

                /**
                 * load existing basemaps and create new basemaps
                 */
                useEffect(() => {
                    // get existing basemaps
                    const { basemaps } = api.map(mapId);

                    // set the basemaps in the list
                    setBasemapList(basemaps);

                    // create a new basemap with transport and label layers
                    createBasemap('transportWithLabels', {
                        name: t('basemap-transport-label.name'),
                        description:
                            'This Canadian basemap provides geographic context with bilingual labels and an emphasis on transportation networks. From Natural Resources Canada.',
                        descSummary: '',
                        altText: t('basemap-transport-label.name'),
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
                                    t('layer.type')
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
                        name: t('basemap-transport.name'),
                        description:
                            'This Canadian basemap provides geographic context that emphasis on transportation networks. From Natural Resources Canada.',
                        descSummary: '',
                        altText: t('basemap-transport.name'),
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
                        name: t('basemap-shaded.name'),
                        description:
                            '":"This Canadian base map provides geographic context using shaded relief. From Natural Resources Canada.',
                        descSummary: '',
                        altText: t('basemap-shaded.name'),
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
                        name: t('basemap-shaded-label.name'),
                        description:
                            '":"This Canadian base map provides geographic context using shaded relief with labels. From Natural Resources Canada.',
                        descSummary: '',
                        altText: t('basemap-shaded-label.name'),
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

                return h(
                    'div',
                    {
                        className: classes.listContainer,
                    },
                    basemapList.map((basemap) => {
                        return h(
                            'div',
                            {
                                role: 'button',
                                tabIndex: '0',
                                className: classes.card,
                                onClick: () => setBasemap(basemap.id),
                                onKeyPress: () => setBasemap(basemap.id),
                                key: basemap.id,
                            },
                            typeof basemap.thumbnailUrl === 'string' &&
                                h('img', { src: basemap.thumbnailUrl, alt: basemap.altText, className: classes.thumbnail }),
                            Array.isArray(basemap.thumbnailUrl) &&
                                basemap.thumbnailUrl.map((thumbnail, index) => {
                                    return h('img', { key: index, src: thumbnail, alt: basemap.altText, className: classes.thumbnail });
                                }),
                            h('div', { className: classes.container }, basemap.name)
                        );
                    })
                );
            };

            // button props
            const button = {
                tooltip: 'Basemap Switcher',
                icon: '<i class="material-icons">map</i>',
            };

            // panel props
            const panel = {
                title: 'Basemap Switcher',
                icon: '<i class="material-icons">map</i>',
                content: component,
                width: 200,
            };

            // create a new button panel on the appbar
            api.map(mapId).createAppbarButtonPanel(button, panel, null);
        };
    }

    // export this plugin
    window.plugins = window.plugins || {};
    window.plugins.basemapSwitcher = BasemapSwitcher;
})();
