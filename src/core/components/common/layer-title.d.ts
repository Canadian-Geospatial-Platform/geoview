/// <reference types="react" />
interface LayerTitleProp {
    children: React.ReactNode;
    hideTitle?: boolean | undefined;
}
/**
 * Create Layer Title.
 * @param {string} children the name of the layer.
 * @param {boolean} hideTitle hide the layer title for desktop view.
 * @returns JSX.Element
 */
export declare function LayerTitle({ children, hideTitle }: LayerTitleProp): import("react").JSX.Element;
export {};
