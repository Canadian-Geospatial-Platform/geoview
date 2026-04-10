import type { TypeDisplayLanguage, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import type { TemporalMode, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
/** Properties for the FeatureInfoTable component. */
interface FeatureInfoTableProps {
    /** The layer path for date format lookups. */
    layerPath: string;
    /** The list of field entries to display. */
    featureInfoList: TypeFieldEntry[];
    /** The container type (appBar or footerBar). */
    containerType: TypeContainerBox;
}
/** Properties for the FeatureItem component. */
interface FeatureItemProps {
    /** The item value string. */
    item: string;
    /** The field alias label. */
    alias: string;
    /** The item index within the field values. */
    index: number;
    /** The unique item identifier for focus management. */
    uniqueItemId: string;
    /** The GeoView map ID. */
    mapId: string;
    /** The container type (appBar or footerBar). */
    containerType: TypeContainerBox;
    /** The full field entry data. */
    featureInfoItem: TypeFieldEntry;
    /** Callback to initialize the lightbox for image viewing. */
    onInitLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
}
/** Properties for the FeatureRow component. */
interface FeatureRowProps {
    /** The field entry data. */
    featureInfoItem: TypeFieldEntry;
    /** Callback to initialize the lightbox for image viewing. */
    onInitLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
    /** The display language. */
    language: TypeDisplayLanguage;
    /** The temporal mode for the layer. */
    layerDateTemporalMode: TemporalMode;
    /** The date display format for the layer. */
    displayDateFormat: TypeDisplayDateFormat;
    /** The timezone for date display. */
    displayDateTimezone: TimeIANA;
    /** The container type (appBar or footerBar). */
    containerType: TypeContainerBox;
}
/**
 * Creates a single feature item cell (image, HTML, or text with links).
 *
 * Memoized to avoid re-rendering unchanged items in the feature table.
 *
 * @param props - Properties defined in FeatureItemProps interface
 * @returns The rendered feature item
 */
export declare const FeatureItem: import("react").NamedExoticComponent<FeatureItemProps>;
/**
 * Creates a table row for a single feature field entry.
 *
 * Memoized to avoid re-rendering unchanged rows in the feature table.
 *
 * @param props - Properties defined in FeatureRowProps interface
 * @returns The rendered table row
 */
export declare const FeatureRow: import("react").NamedExoticComponent<FeatureRowProps>;
/**
 * Creates the feature info table component.
 *
 * Memoized to avoid re-rendering the table when parent re-renders with same data.
 *
 * @param props - Properties defined in FeatureInfoTableProps interface
 * @returns The feature info table
 */
export declare const FeatureInfoTable: import("react").NamedExoticComponent<FeatureInfoTableProps>;
export {};
//# sourceMappingURL=feature-info-table.d.ts.map