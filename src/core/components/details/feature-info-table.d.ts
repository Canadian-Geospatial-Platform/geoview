import type { TypeDisplayLanguage, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import { type TemporalMode, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
interface FeatureInfoTableProps {
    layerPath: string;
    featureInfoList: TypeFieldEntry[];
    containerType: TypeContainerBox;
}
interface FeatureItemProps {
    item: string;
    alias: string;
    index: number;
    uniqueItemId: string;
    mapId: string;
    containerType: TypeContainerBox;
    featureInfoItem: TypeFieldEntry;
    onInitLightBox: (images: string, altText: string, returnFocusId: string, index?: number, scale?: number) => void;
}
interface FeatureRowProps {
    featureInfoItem: TypeFieldEntry;
    onInitLightBox: (images: string, altText: string, returnFocusId: string, index?: number, scale?: number) => void;
    language: TypeDisplayLanguage;
    layerDateTemporalMode: TemporalMode;
    displayDateFormat: TypeDisplayDateFormat;
    displayDateTimezone: TimeIANA;
    containerType: TypeContainerBox;
}
export declare const FeatureItem: import("react").NamedExoticComponent<FeatureItemProps>;
export declare const FeatureRow: import("react").NamedExoticComponent<FeatureRowProps>;
export declare const FeatureInfoTable: import("react").NamedExoticComponent<FeatureInfoTableProps>;
export {};
//# sourceMappingURL=feature-info-table.d.ts.map