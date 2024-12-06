import 'yet-another-react-lightbox/styles.css';
/**
 * Interface used for lightbox properties and slides
 */
export interface LightBoxSlides {
    src: string;
    alt: string;
    downloadUrl: string;
}
export interface LightboxProps {
    open: boolean;
    slides: LightBoxSlides[];
    index: number;
    exited: () => void;
    scale?: number;
}
/**
 * Create an element that displays a lightbox
 *
 * @param {LightboxProps} props the lightbox properties
 * @returns {JSX.Element} created lightbox element
 */
export declare const LightboxImg: import("react").NamedExoticComponent<LightboxProps>;
