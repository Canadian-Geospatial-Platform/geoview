import 'yet-another-react-lightbox/styles.css';
/** Slide definition for the lightbox. */
export interface LightBoxSlides {
    /** The image source URL. */
    src: string;
    /** The image alt text. */
    alt: string;
    /** The download URL for the image. */
    downloadUrl: string;
}
/** Props for the LightboxImg component. */
export interface LightboxProps {
    /** Whether the lightbox is open. */
    open: boolean;
    /** The slides to display. */
    slides: LightBoxSlides[];
    /** The initial slide index. */
    index: number;
    /** Callback invoked when the lightbox exit animation completes. */
    exited: () => void;
    /** Optional callback invoked when the active slide changes. */
    onSlideChange?: (index: number) => void;
}
/**
 * Creates the lightbox image viewer component.
 *
 * Memoized to prevent re-renders when parent updates but lightbox props have not changed.
 *
 * @returns The lightbox element
 */
export declare const LightboxImg: import("react").NamedExoticComponent<LightboxProps>;
//# sourceMappingURL=lightbox.d.ts.map