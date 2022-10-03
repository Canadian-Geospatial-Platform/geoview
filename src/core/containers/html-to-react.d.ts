import { CSSProperties } from 'react';
/**
 * Interface used for custom html elements
 */
interface HtmlToReactProps {
    htmlContent: string;
    className?: string;
    style?: CSSProperties;
    extraOptions?: Record<string, unknown>;
}
/**
 * Convert an HTML string to a JSX component
 *
 * @param {HtmlToReactProps} props the properties to pass to the converted component
 * @returns {JSX.Element} returns the converted JSX component
 */
export declare function HtmlToReact(props: HtmlToReactProps): JSX.Element;
export {};
