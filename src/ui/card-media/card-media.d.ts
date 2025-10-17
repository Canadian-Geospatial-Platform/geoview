import type { CardMediaProps } from '@mui/material';
/**
 * Properties for the Card Media component extending Material-UI's CardMediaProps
 */
export interface CardMediaPropsExtend extends CardMediaProps {
    alt: string;
    cardComponent?: 'img' | 'video';
    click?(): void;
    keyDown?(event: React.KeyboardEvent): void;
}
/**
 * A customized Material UI Card Media component with keyboard accessibility support.
 *
 * @component
 * @example
 * ```tsx
 * // Basic image usage
 * <CardMedia
 *   component="img"
 *   src="/path/to/image.jpg"
 *   alt="Description of image"
 * />
 *
 * // With click handler
 * <CardMedia
 *   src="/path/to/image.jpg"
 *   alt="Clickable image"
 *   click={() => handleImageClick()}
 * />
 *
 * // Video component
 * <CardMedia
 *   cardComponent="video"
 *   src="/path/to/video.mp4"
 *   alt="Video description"
 * />
 *
 * // GeoView implementation with lighbox
 * <CardMedia
 *   key={generateId()}
 *   sx={{ ...sxClasses.featureInfoItemValue, cursor: 'pointer' }}
 *   alt={`${alias} ${index}`}
 *   className={`returnLightboxFocusItem-${index}`}
 *   src={item}
 *   tabIndex={0}
 *   onClick={() => onInitLightBox(featureInfoItem.value as string, featureInfoItem.alias, index)}
 *   onKeyDown={(event: React.KeyboardEvent) => {
 *   if (event.key === 'Enter') {
 *      onInitLightBox(featureInfoItem.value as string, `${index}_${featureInfoItem.alias}`, index);
 *    }
 *   }}
 * />
 * ```
 *
 * @param {CardMediaPropsExtend} props - The properties for the Card Media element
 * @returns {JSX.Element} A rendered Card Media element
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-card/#media}
 */
declare function CardMediaUI(props: CardMediaPropsExtend): JSX.Element;
export declare const CardMedia: typeof CardMediaUI;
export {};
//# sourceMappingURL=card-media.d.ts.map