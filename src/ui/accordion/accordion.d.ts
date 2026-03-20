import type { ReactNode, CSSProperties } from 'react';
/**
 * Configuration properties for the Accordion component.
 */
export interface AccordionProps {
    /** Unique identifier for the accordion container (auto-generated if omitted) */
    id: string;
    /** MUI theme-compatible styles applied to accordion container */
    sx: CSSProperties;
    /** Array of collapsible sections with title and content */
    items: Array<AccordionItem>;
    /** CSS class applied to each accordion section for custom styling */
    className: string;
    /** Initial expanded state for all accordion sections on mount */
    defaultExpanded: boolean;
    /** Display rotating loading icon during open/close transitions for async operations */
    showLoadingIcon: boolean;
}
/**
 * Single accordion section with title and expandable content.
 */
export type AccordionItem = {
    /** Display text shown in accordion header */
    title: string;
    /** Content rendered when section is expanded (can be any React node) */
    content: ReactNode;
};
/**
 * Customizable accordion component with expandable sections and optional loading states.
 *
 * Wraps Material-UI's Accordion to provide collapsible content sections with loading animation
 * support. Manages individual section states internally and renders a loading spinner icon
 * during transitions when showLoadingIcon is enabled. Useful for hierarchical information
 * display and progressive content disclosure.
 *
 * @param props - Accordion configuration (see AccordionProps interface)
 * @returns Rendered accordion with expandable sections
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Accordion
 *   id="my-accordion"
 *   items={[
 *     { title: "Section 1", content: <div>Content 1</div> },
 *     { title: "Section 2", content: <div>Content 2</div> }
 *   ]}
 * />
 *
 * // With loading icon and default expanded
 * <Accordion
 *   id="loading-accordion"
 *   items={items}
 *   showLoadingIcon={true}
 *   defaultExpanded={true}
 *   sx={{ maxWidth: '500px' }}
 * />
 *
 * // With custom styling
 * <Accordion
 *   id="styled-accordion"
 *   items={items}
 *   className="custom-accordion"
 *   sx={{
 *     backgroundColor: '#f5f5f5',
 *     borderRadius: '8px'
 *   }}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-accordion/}
 */
declare function AccordionUI(props: AccordionProps): ReactNode;
export declare const Accordion: typeof AccordionUI;
export {};
//# sourceMappingURL=accordion.d.ts.map