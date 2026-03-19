import type { ReactElement } from 'react';
import type { FadeProps } from '@mui/material';
import { Fade as MaterialFade } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Fade component extending Material-UI's FadeProps
 */
export interface FadePropsExtend extends Omit<FadeProps, 'children'> {
  /** Content to be rendered in the fade transition */
  children: ReactElement;
}

/**
 * Material-UI Fade component for opacity-based visibility transitions.
 *
 * Wraps Material-UI's Fade to provide smooth opacity transition when showing/hiding
 * content. Controls visibility via the `in` prop with optional timeout and unmount
 * behaviors. All Material-UI Fade props are supported and passed through directly.
 *
 * @param props - Fade configuration (see FadePropsExtend interface)
 * @returns Fade component with smooth opacity transition effect
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Fade in={true}>
 *   <div>Content to fade</div>
 * </Fade>
 *
 * // With timeout
 * <Fade
 *   in={isVisible}
 *   timeout={300}
 * >
 *   <Card>Fading card</Card>
 * </Fade>
 *
 * // With unmount on exit
 * <Fade
 *   in={show}
 *   unmountOnExit
 * >
 *   <Typography>Content unmounts when faded out</Typography>
 * </Fade>
 * ```
 *
 * @see {@link https://mui.com/material-ui/transitions/#fade}
 */
function FadeUI({ children, ...props }: FadePropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/fade/fade');

  return <MaterialFade {...props}>{children}</MaterialFade>;
}

export const Fade = FadeUI;
