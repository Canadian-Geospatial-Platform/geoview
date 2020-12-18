import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n.use(initReactI18next)
    // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
    // learn more: https://github.com/i18next/i18next-http-backend
    .use(Backend)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        debug: true,

        lng: 'fr-CA',
        fallbackLng: 'f-CA',
        whitelist: ['en-CA', 'fr-CA'],
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        backend: {
            loadPath: `${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/locales/{{lng}}/{{ns}}.json`,
        },
        // special options for react-i18next
        // learn more: https://react.i18next.com/components/i18next-instance
        react: {
            useSuspense: true,
            wait: true,
        },
    });

export default i18n;
