import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui/layout';
import type { SxStyles } from '@/ui/style/types';
import { useStoreAppDrawingHint, useStoreAppIsCrosshairsActive } from '@/core/stores/states/app-state';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './drawing-hint-style';

/**
 * Displays visible, translated instructions for the active drawing or editing interaction.
 * The hint is a polite live region, so screen readers hear the same text when the step changes.
 *
 * @returns The map drawing hint, or null when no supported drawing is active
 */
export function DrawingHint(): JSX.Element | null {
  logger.logTraceRender('components/common/drawing-hint');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const drawingHint = useStoreAppDrawingHint();
  const isCrosshairsActive = useStoreAppIsCrosshairsActive();
  const isKeyboardNavigationActive = useStoreUIActiveTrapGeoView();

  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('DRAWING-HINT - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  if (!drawingHint) return null;

  // Keyboard wording whenever the keyboard is in use: keyboard navigation mode or the crosshair (Ctrl+M)
  const isKeyboardHint = isCrosshairsActive || isKeyboardNavigationActive;

  let hint: string;
  if (drawingHint.tool === 'editing') {
    hint = isKeyboardHint ? t('drawingHint.keyboard.editing') : t('drawingHint.mouse.editing');
  } else if (drawingHint.geometry === 'Point') {
    hint = isKeyboardHint ? t('drawingHint.keyboard.point') : t('drawingHint.mouse.point');
  } else if (drawingHint.geometry === 'Text') {
    hint = isKeyboardHint ? t('drawingHint.keyboard.text') : t('drawingHint.mouse.text');
  } else if (drawingHint.geometry === 'Circle' || drawingHint.geometry === 'Star') {
    if (drawingHint.started) {
      hint = isKeyboardHint ? t('drawingHint.keyboard.radius') : t('drawingHint.mouse.radius');
    } else {
      hint = isKeyboardHint ? t('drawingHint.keyboard.center') : t('drawingHint.mouse.center');
    }
  } else if (drawingHint.geometry === 'Rectangle') {
    if (drawingHint.started) {
      hint = isKeyboardHint ? t('drawingHint.keyboard.oppositeCorner') : t('drawingHint.mouse.oppositeCorner');
    } else {
      hint = isKeyboardHint ? t('drawingHint.keyboard.firstCorner') : t('drawingHint.mouse.firstCorner');
    }
  } else if (!drawingHint.started) {
    if (drawingHint.tool === 'drawing') {
      hint = isKeyboardHint ? t('drawingHint.startKeyboard') : t('drawingHint.startMouse');
    } else {
      hint = isKeyboardHint ? t('measurement.startKeyboard') : t('measurement.startMouse');
    }
  } else if (drawingHint.geometry === 'LineString') {
    hint = isKeyboardHint ? t('drawingHint.keyboard.line') : t('drawingHint.mouse.line');
  } else {
    hint = isKeyboardHint ? t('drawingHint.keyboard.polygon') : t('drawingHint.mouse.polygon');
  }

  // Until the map is focused (Ctrl+M) the crosshair keys have no effect, so keyboard navigation users are told first.
  const needsFocusMapStep = isKeyboardNavigationActive && !isCrosshairsActive;

  return (
    <Box role="status" sx={memoSxClasses.drawingHint}>
      {needsFocusMapStep ? `${t('drawingHint.focusMap')} ${hint}` : hint}
    </Box>
  );
}
