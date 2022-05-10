import React from 'react';
import './translation/i18n';
import { Theme } from '@mui/material/styles';
import { TypeMapConfigProps, TypeMapContext } from './types/cgpv-types';
declare module '@mui/styles/defaultTheme' {
    interface DefaultTheme extends Theme {
    }
}
export declare const MapContext: React.Context<TypeMapContext>;
/**
 * interface used when passing configuration from the maps
 */
interface AppStartProps {
    configObj: TypeMapConfigProps;
}
/**
 * Initialize the app with maps from inline html configs, url params
 */
declare function AppStart(props: AppStartProps): JSX.Element;
export default AppStart;
