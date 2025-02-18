import { useCallback } from 'react';
import { CardMedia as MaterialCardMedia, CardMediaProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Card Media component extending Material-UI's CardMediaProps
 */
export interface CardMediaPropsExtend extends CardMediaProps {
  alt: string;
  cardComponent?: 'img' | 'video';
  click?(): void;
  keyDown?(event: React.KeyboardEvent): void;
}

// Define constant styles outside component to prevent recreation
const DEFAULT_STYLES = {
  cursor: 'pointer',
  '&:focus': {
    outline: '2px solid #1976d2', // use theme color if available
  },
} as const;

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
function CardMediaUI(props: CardMediaPropsExtend): JSX.Element {
  logger.logTraceRender('ui/card-media/card-media');

  // Get constant from props
  const { sx, src, alt, cardComponent = 'img', click, keyDown, ...rest } = props;

  // Memoize event handlers
  const handleClick = useCallback(() => {
    logger.logTraceUseCallback('UI.CARD MEDIA - click');

    click?.();
  }, [click]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      logger.logTraceUseCallback('UI.CARD MEDIA - keyboard click');
      // Only trigger on Enter or Space key
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        keyDown?.(event);
      }
    },
    [keyDown]
  );

  // Combine custom styles with default styles
  const combinedSx = {
    ...DEFAULT_STYLES,
    ...(typeof sx === 'object' ? sx : {}),
  };

  return (
    <MaterialCardMedia
      component={cardComponent}
      sx={combinedSx}
      alt={alt}
      src={src}
      tabIndex={0}
      onClick={click ? handleClick : undefined}
      onKeyDown={keyDown ? handleKeyDown : undefined}
      {...rest}
    />
  );
}

export const CardMedia = CardMediaUI;
