import type { TypeContainerBox } from '@/core/types/global-types';
import type { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
/** Props for the GuideSearch component. */
interface GuideSearchProps {
    /** The container type (footerBar, appBar, etc.). */
    containerType: TypeContainerBox;
    /** The guide content object. */
    guide: TypeGuideObject | undefined;
    /** Callback to change the active guide section. */
    onSectionChange: (sectionIndex: number) => void;
    /** Callback to notify parent of search state changes. */
    onSearchStateChange: (searchTerm: string, highlightFunction: (content: string, sectionIndex: number) => string) => void;
}
/**
 * Creates the guide search component.
 *
 * @param props - Properties defined in GuideSearchProps interface
 * @returns The guide search input and navigation controls
 */
export declare function GuideSearch({ containerType, guide, onSectionChange, onSearchStateChange }: GuideSearchProps): JSX.Element;
export {};
//# sourceMappingURL=guide-search.d.ts.map