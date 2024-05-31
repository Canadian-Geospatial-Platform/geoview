import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button, ButtonProps } from '@mui/material';
import { Tooltip } from '@/ui';
import { logger } from '@/core/utils/logger';

export type ResponsiveButtonProps = {
  tooltipKey: string;
} & ButtonProps;

export function ResponsiveButton(props: ResponsiveButtonProps): JSX.Element {
  const { tooltipKey, children, variant, startIcon, type = 'text', onClick, ...rest } = props;
  const { t } = useTranslation<string>();
  const breakpoint = 510;

  // state
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('RESPONSIVE - BUTTON - mount');

    const handleResize = (): void => {
      // Log
      logger.logTraceCore('RESPONSIVE - BUTTON - window resize event');

      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (screenWidth < breakpoint) {
    return (
      <Tooltip title={t(tooltipKey)} placement="top" enterDelay={1000}>
        <Button variant={variant} startIcon={startIcon} onClick={onClick} className="OutlinedButton" {...rest} />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={t(tooltipKey)} placement="top" enterDelay={1000}>
      <Button color="primary" variant={variant} startIcon={startIcon} onClick={onClick} className="OutlinedButton" {...rest}>
        {children}
      </Button>
    </Tooltip>
  );
}
