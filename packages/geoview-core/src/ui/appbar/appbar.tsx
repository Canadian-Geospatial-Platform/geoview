import { memo, useMemo } from 'react';
import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI App Bar component.
 * This is a simple wrapper around MaterialAppBar that maintains
 * full compatibility with Material-UI's AppBar props.
 *
 * @param {AppBarProps} props - All valid Material-UI AppBar props
 * @returns {JSX.Element} The AppBar component
 */
export const AppBarUI = memo(function AppBarUI(props: AppBarProps): JSX.Element {
  logger.logTraceRender('ui/appbar/appbar');

  // Named AppBarUI because there's a conflicting (with core component) name via export * from '@/ui'; in external-types.ts
  const fadeInAnimation = useFadeIn();
  const AnimatedAppBar = useMemo(() => animated(MaterialAppBar), []);

  return <AnimatedAppBar style={fadeInAnimation} {...props} />;
});
