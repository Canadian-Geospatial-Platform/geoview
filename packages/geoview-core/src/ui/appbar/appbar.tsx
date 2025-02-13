import { memo, useMemo } from 'react';
import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

/**
 * Create a AppBar component
 *
 * @param {AppBarProps} props AppBar properties
 * @returns {JSX.Element} returns AppBar component
 */
export const AppBarUI = memo(function AppBarUI(props: AppBarProps): JSX.Element {
  logger.logTraceRender('ui/appbar/appbar');

  // Named AppBarUI because there's a conflicting (with core component) name via export * from '@/ui'; in external-types.ts
  const fadeInAnimation = useFadeIn();
  const AnimatedAppBar = useMemo(() => animated(MaterialAppBar), []);

  return <AnimatedAppBar style={fadeInAnimation} {...props} />;
});
