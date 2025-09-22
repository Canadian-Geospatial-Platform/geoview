import { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
interface GuideSearchProps {
    guide: TypeGuideObject | undefined;
    onSectionChange: (sectionIndex: number) => void;
    onSearchStateChange: (searchTerm: string, highlightFunction: (content: string, sectionIndex: number) => string) => void;
}
export declare function GuideSearch({ guide, onSectionChange, onSearchStateChange }: GuideSearchProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=guide-search.d.ts.map