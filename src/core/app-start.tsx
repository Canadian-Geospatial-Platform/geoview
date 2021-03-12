/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense } from 'react';

import '../assests/i18n/i18n';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import parse, { attributesToProps } from 'html-react-parser';

import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import { Shell } from '../components/layout/shell';
import { MapProps } from '../components/map/map';
import { theme } from '../assests/style/theme';

/**
 * interface used when passing html elements from the html pages
 */
interface AppStartProps {
    html: string;
}

/**
 * Inialize the app with maps from inline html configs, url params
 */
const AppStart = (props: AppStartProps): JSX.Element => {
    const { html } = props;

    /**
     * Create maps from inline configs with class name llwp-map in index.html
     */
    function getInlineMaps() {
        return parse(html, {
            trim: true,
            replace: (domNode) => {
                // parse map config and create maps
                if (domNode.attribs && domNode.attribs.class && domNode.attribs.class === 'llwp-map') {
                    // TODO: validate config before, if not complete, fill with defaiult values
                    const config: MapProps = JSON.parse((domNode.attribs['data-leaflet'] || '')?.replace(/'/g, '"'));

                    const i18nInstance = i18n.cloneInstance({
                        lng: config.language,
                        fallbackLng: config.language,
                    });

                    return (
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        <div {...attributesToProps(domNode.attribs)}>
                            <I18nextProvider i18n={i18nInstance}>
                                <Shell id={domNode.attribs.id} config={config} />
                            </I18nextProvider>
                        </div>
                    );
                }

                return null;
            },
        });
    }

    return (
        <ThemeProvider theme={theme}>
            <Suspense fallback="">
                <CssBaseline />
                {getInlineMaps()}
            </Suspense>
        </ThemeProvider>
    );
};

export default AppStart;
