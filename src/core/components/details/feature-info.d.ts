import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
/** Properties for the FeatureInfo component. */
interface FeatureInfoProps {
    /** The feature info entry to display. */
    feature: TypeFeatureInfoEntry;
    /** The container type (appBar or footerBar). */
    containerType: TypeContainerBox;
}
/**
 * Creates the feature info component.
 *
 * @param props - Properties defined in FeatureInfoProps interface
 * @returns The feature info component, or null if no feature
 */
export declare function FeatureInfo({ feature, containerType }: FeatureInfoProps): JSX.Element | null;
export {};
//# sourceMappingURL=feature-info.d.ts.map