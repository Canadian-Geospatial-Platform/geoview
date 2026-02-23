import type { TypeDisplayLanguage, TypeFieldEntry } from '@/api/types/map-schema-types';
import { type TemporalMode, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
interface FeatureInfoTableProps {
    layerPath: string;
    featureInfoList: TypeFieldEntry[];
}
interface FeatureItemProps {
    item: string;
    alias: string;
    index: number;
    featureInfoItem: TypeFieldEntry;
    onInitLightBox: (value: string, alias: string, index: number) => void;
}
interface FeatureRowProps {
    featureInfoItem: TypeFieldEntry;
    onInitLightBox: (value: string, alias: string, index: number) => void;
    language: TypeDisplayLanguage;
    layerDateTemporalMode: TemporalMode;
    displayDateFormat: TypeDisplayDateFormat;
    displayDateTimezone: TimeIANA;
}
export declare const FeatureItem: import("react").NamedExoticComponent<FeatureItemProps>;
export declare const FeatureRow: import("react").NamedExoticComponent<FeatureRowProps>;
export declare const FeatureInfoTable: import("react").NamedExoticComponent<FeatureInfoTableProps>;
export {};
//# sourceMappingURL=feature-info-table.d.ts.map