import { ReactElement } from 'react';
import { Fade as MaterialFade, FadeProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Fade component extending Material-UI's FadeProps
 */
export interface FadePropsExtend extends Omit<FadeProps, 'children'> {
  /** Content to be rendered in the fade transition */
  children: ReactElement;
}

/**
 * Create a customized Material UI Fade component.
 *
 * @component
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
 * @param {FadePropsExtend} props - All valid Material-UI Fade props
 * @returns {JSX.Element} The Fade component
 *
 * @see {@link https://mui.com/material-ui/transitions/#fade}
 */
function FadeUI({ children, ...props }: FadePropsExtend): JSX.Element {
  logger.logTraceRender('ui/fade/fade');

  return <MaterialFade {...props}>{children}</MaterialFade>;
}

export const Fade = FadeUI;
