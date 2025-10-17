import type { CSSProperties } from 'react';
/**
 * Interface used for custom html elements
 */
interface HtmlToReactProps {
    htmlContent: string;
    className?: string;
    style?: CSSProperties;
    extraOptions?: Record<string, unknown>;
    itemOptions?: Record<string, unknown>;
}
/**
 * Convert an HTML string to a JSX component
 *
 * @param {HtmlToReactProps} props the properties to pass to the converted component
 * @returns {JSX.Element} returns the converted JSX component
 */
export declare function UseHtmlToReact({ htmlContent, className, style, extraOptions, itemOptions }: HtmlToReactProps): JSX.Element;
export {};
//# sourceMappingURL=use-html-to-react.d.ts.map