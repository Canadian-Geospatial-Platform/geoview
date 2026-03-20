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
 * Material-UI CardMedia component with keyboard accessibility and click handling.
 *
 * Wraps Material-UI's CardMedia to provide flexible image/video rendering with
 * keyboard event support for accessibility. Supports both image and video components
 * with click and keyDown callbacks. All Material-UI CardMedia props are supported
 * and passed through directly.
 *
 * @param props - CardMedia configuration (see CardMediaPropsExtend interface)
 * @returns CardMedia component with click and keyboard event handling
 *
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
 *   id={imageElementId}
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
 * @see {@link https://mui.com/material-ui/react-card/#media}
 */
declare function CardMediaUI(props: CardMediaPropsExtend): JSX.Element;
export declare const CardMedia: typeof CardMediaUI;
export {};
//# sourceMappingURL=card-media.d.ts.map