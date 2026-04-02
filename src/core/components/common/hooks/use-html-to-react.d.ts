import type { CSSProperties } from 'react';
/** Properties for the HTML-to-React converter component. */
interface HtmlToReactProps {
    htmlContent: string;
    className?: string;
    style?: CSSProperties;
    extraOptions?: Record<string, unknown>;
    itemOptions?: Record<string, unknown>;
}
/**
 * Converts an HTML string to a JSX component.
 *
 * @param props - The properties for the HTML-to-React conversion
 * @returns The converted JSX component
 */
export declare function UseHtmlToReact({ htmlContent, className, style, extraOptions, itemOptions }: HtmlToReactProps): JSX.Element;
export {};
//# sourceMappingURL=use-html-to-react.d.ts.map