import { memo, ReactElement } from 'react';
import { Fade as MaterialFade, FadeProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

interface TypeFadeProps extends Omit<FadeProps, 'children'> {
  children: ReactElement;
}

/**
 * Create a customized Material UI Fade component.
 * This is a simple wrapper around MaterialFade that maintains
 * full compatibility with Material-UI's Fade props.
 *
 * @param {FadeProps} props - All valid Material-UI Fade props
 * @returns {JSX.Element} The Fade component
 */
export const Fade = memo(function Fade({ children, ...props }: TypeFadeProps): JSX.Element {
  logger.logTraceRender('ui/fade/fade');

  return <MaterialFade {...props}>{children}</MaterialFade>;
});
