import { Dispatch, SetStateAction } from 'react';
import { TypeWmsLegendStyle } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
export interface TypeWMSStyleProps {
    layerId: string;
    mapId: string;
    subLayerId: string | undefined;
    style: TypeWmsLegendStyle;
    currentWMSStyle: string | undefined;
    setCurrentWMSStyle: Dispatch<SetStateAction<string>>;
}
/**
 * Legend Item for a WMS style
 *
 * @returns {JSX.Element} the legend list item
 */
export declare function WMSStyleItem(props: TypeWMSStyleProps): JSX.Element;
