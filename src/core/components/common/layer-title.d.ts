/// <reference types="react" />
interface LayerTitleProp {
    children: React.ReactNode;
    hideTitle?: boolean;
    fullWidth?: boolean;
}
/**
 * Create Layer Title.
 * @param {string} children the name of the layer.
 * @param {boolean} hideTitle hide the layer title for desktop view.
 * @param {boolean} fullWidth show and hide title when width of container is maximum.
 * @returns JSX.Element
 */
export declare function LayerTitle({ children, hideTitle, fullWidth }: LayerTitleProp): import("react").JSX.Element;
export declare namespace LayerTitle {
    var defaultProps: {
        hideTitle: boolean;
        fullWidth: boolean;
    };
}
export {};
