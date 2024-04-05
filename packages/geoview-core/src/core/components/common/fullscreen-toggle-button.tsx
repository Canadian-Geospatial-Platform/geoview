import React, { useState, useCallback, useEffect, Dispatch } from 'react';
import { Box, FullscreenExitIcon, FullscreenIcon, IconButton } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useTranslation } from 'react-i18next';


interface FullScreenToggleProps {
  isFullScreen: boolean;
  onSetIsFullScreen: Dispatch<boolean>;
}

/**
 * Create fullscreen toggle button
 * @param {boolean} isFullScreen
 * @param {function} onSetIsFullScreen
 * @returns JSX.element
 */
const FullScreenToggleButton = ({ isFullScreen, onSetIsFullScreen } : FullScreenToggleProps) => {
  const { t } = useTranslation();

  const toggleFullScreen = () => {
    logger.logTraceUseCallback('LAYOUT - toggleFullScreen');
    onSetIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onSetIsFullScreen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  return (
    <IconButton
      size="small"
      onClick={toggleFullScreen}
      tooltip={isFullScreen ? t('general.closeFullscreen')! : t('general.openFullscreen')!}
      className="style2"
      color="primary"
    >
      {!isFullScreen ? <FullscreenIcon /> : <FullscreenExitIcon />}
    </IconButton>
  );
};

export default FullScreenToggleButton;
