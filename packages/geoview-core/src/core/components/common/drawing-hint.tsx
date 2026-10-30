import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui/layout';
import type { SxStyles } from '@/ui/style/types';
import { useStoreAppDrawingHint, useStoreAppIsCrosshairsActive } from '@/core/stores/states/app-state';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './drawing-hint-style';

/**
 * Displays visible, translated instructions for the active drawing or editing interaction.
 *
 * @returns The map drawing hint, or null when no supported drawing is active
 */
export function DrawingHint(): JSX.Element | null {
  logger.logTraceRender('components/common/drawing-hint');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const drawingHint = useStoreAppDrawingHint();
  const isCrosshairsActive = useStoreAppIsCrosshairsActive();

  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('DRAWING-HINT - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  if (!drawingHint) return null;

  let hint: string;
  if (drawingHint.tool === 'editing') {
    hint = isCrosshairsActive ? t('drawingHint.keyboard.editing') : t('drawingHint.mouse.editing');
  } else if (drawingHint.geometry === 'point') {
    hint = isCrosshairsActive ? t('drawingHint.keyboard.point') : t('drawingHint.mouse.point');
  } else if (drawingHint.geometry === 'text') {
    hint = isCrosshairsActive ? t('drawingHint.keyboard.text') : t('drawingHint.mouse.text');
  } else if (drawingHint.geometry === 'circle' || drawingHint.geometry === 'star') {
    if (drawingHint.started) {
      hint = isCrosshairsActive ? t('drawingHint.keyboard.radius') : t('drawingHint.mouse.radius');
    } else {
      hint = isCrosshairsActive ? t('drawingHint.keyboard.center') : t('drawingHint.mouse.center');
    }
  } else if (drawingHint.geometry === 'rectangle') {
    if (drawingHint.started) {
      hint = isCrosshairsActive ? t('drawingHint.keyboard.oppositeCorner') : t('drawingHint.mouse.oppositeCorner');
    } else {
      hint = isCrosshairsActive ? t('drawingHint.keyboard.firstCorner') : t('drawingHint.mouse.firstCorner');
    }
  } else if (!drawingHint.started) {
    if (drawingHint.tool === 'drawing') {
      hint = isCrosshairsActive ? t('drawingHint.startKeyboard') : t('drawingHint.startMouse');
    } else {
      hint = isCrosshairsActive ? t('measurement.startKeyboard') : t('measurement.startMouse');
    }
  } else if (drawingHint.geometry === 'line') {
    hint = isCrosshairsActive ? t('drawingHint.keyboard.line') : t('drawingHint.mouse.line');
  } else {
    hint = isCrosshairsActive ? t('drawingHint.keyboard.polygon') : t('drawingHint.mouse.polygon');
  }

  return (
    <Box aria-hidden="true" sx={memoSxClasses.drawingHint}>
      {hint}
    </Box>
  );
}
