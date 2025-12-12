import type { TypeFieldEntry } from '@/api/types/map-schema-types';
interface FeatureInfoTableProps {
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
}
export declare const FeatureItem: import("react").NamedExoticComponent<FeatureItemProps>;
export declare const FeatureRow: import("react").NamedExoticComponent<FeatureRowProps>;
export declare const FeatureInfoTable: import("react").NamedExoticComponent<FeatureInfoTableProps>;
export {};
//# sourceMappingURL=feature-info-table.d.ts.map