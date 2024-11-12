import 'yet-another-react-lightbox/styles.css';
/**
 * Interface used for lightbox properties and slides
 */
export interface LightboxProps {
    open: boolean;
    slides: LightBoxSlides[];
    index: number;
    exited: () => void;
    scale?: number;
}
export interface LightBoxSlides {
    src: string;
    alt: string;
    downloadUrl: string;
}
/**
 * Create an element that displays a lightbox
 *
 * @param {LightboxProps} props the lightbox properties
 * @returns {JSX.Element} created lightbox element
 */
export declare function LightboxImg(props: LightboxProps): JSX.Element;
