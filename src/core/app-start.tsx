/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense } from 'react';

import '../assests/i18n/i18n';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import parse, { attributesToProps } from 'html-react-parser';

import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import { Config } from '../api/config';
import { Shell } from '../components/layout/shell';
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
                    // validate configuration and appply default if problem occurs then setup language
                    const configObj = new Config(domNode.attribs.id || '', (domNode.attribs['data-leaflet'] || '')?.replace(/'/g, '"'));
                    const i18nInstance = i18n.cloneInstance({
                        lng: configObj.language,
                        fallbackLng: configObj.language,
                    });

                    return (
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        <div {...attributesToProps(domNode.attribs)}>
                            <I18nextProvider i18n={i18nInstance}>
                                <Shell id={configObj.id} config={configObj.configuration} />
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
