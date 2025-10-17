import type { ReactNode, CSSProperties } from 'react';
/**
 * Properties for the Accordion element
 */
export interface AccordionProps {
    /** Unique identifier for the accordion */
    id: string;
    /** Custom styles using CSS properties */
    sx: CSSProperties;
    /** Array of accordion items to display */
    items: Array<AccordionItem>;
    /** Custom class name for styling */
    className: string;
    /** Whether the accordion should be expanded by default */
    defaultExpanded: boolean;
    /** Whether to show a loading icon during transitions */
    showLoadingIcon: boolean;
}
/**
 * Structure for individual accordion items
 */
export type AccordionItem = {
    /** The title text displayed in the accordion header */
    title: string;
    /** The content to be displayed when the accordion section is expanded */
    content: ReactNode;
};
/**
 * A customizable accordion component built on Material-UI's Accordion.
 * Provides expandable/collapsible sections with optional loading states and animations.
 *
 * @component
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
 * @param {AccordionProps} props - The properties for the Accordion component
 * @returns {JSX.Element} A rendered accordion component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link AccordionItem} for the structure of individual accordion items
 * @see {@link https://mui.com/material-ui/react-accordion/}
 */
declare function AccordionUI(props: AccordionProps): ReactNode;
export declare const Accordion: typeof AccordionUI;
export {};
//# sourceMappingURL=accordion.d.ts.map