import React from 'react';
import './translation/i18n';
import { Theme } from '@mui/material/styles';
import { TypeMapFeaturesConfig } from './types/global-types';
import { TypeInteraction } from '../app';
declare module '@mui/styles/defaultTheme' {
    interface DefaultTheme extends Theme {
        iconImg: React.CSSProperties;
    }
}
export declare const MapContext: React.Context<TypeMapContext>;
/**
 * Type used for the map context
 */
export type TypeMapContext = {
    mapId: string;
    interaction: TypeInteraction;
    mapFeaturesConfig?: TypeMapFeaturesConfig;
};
/**
 * interface used when passing map features configuration
 */
interface AppStartProps {
    mapFeaturesConfig: TypeMapFeaturesConfig;
}
/**
 * Initialize the app with maps from inline html configs, url params
 */
declare function AppStart(props: AppStartProps): JSX.Element;
export default AppStart;
