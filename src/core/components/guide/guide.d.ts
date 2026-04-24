import type { TypeContainerBox } from '@/core/types/global-types';
/** Props for the Guide component. */
interface GuideType {
    /** The container box type for layout. */
    containerType: TypeContainerBox;
}
/**
 * Creates the guide component to display help content.
 *
 * Memoized to prevent re-renders when parent updates but containerType has not changed.
 *
 * @param props - Properties defined in GuideType interface
 * @returns The guide component
 */
export declare const Guide: import("react").NamedExoticComponent<GuideType>;
export {};
//# sourceMappingURL=guide.d.ts.map