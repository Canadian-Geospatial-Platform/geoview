import { CardMedia as MaterialCardMedia, CardMediaProps } from '@mui/material';
import { memo, useCallback } from 'react';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Card Media
 */
interface TypeCardMediaProps extends CardMediaProps {
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
 * Create a customized Material UI Card Media
 *
 * @param {TypeCardMediaProps} props the properties passed to the Card Media element
 * @returns {JSX.Element} the created Card Media element
 */
export const CardMedia = memo(function CardMedia(props: TypeCardMediaProps): JSX.Element {
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
});
