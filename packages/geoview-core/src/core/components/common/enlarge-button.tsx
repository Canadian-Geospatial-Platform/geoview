import { Dispatch } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { ArrowBackIcon, ArrowForwardIcon, Button } from '@/ui';
import { getSxClasses } from './enlarge-button-style';

interface EnlargeButtonProps {
  isEnlarged: boolean;
  onSetIsEnlarged: Dispatch<boolean>;
}

/**
 * Create enlarge button
 * @param {boolean} isEnlarged
 * @param {function} setIsEnlarged
 * @returns JSX.element
 */
export function EnlargeButton({ isEnlarged, onSetIsEnlarged }: EnlargeButtonProps) {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Button
      type="text"
      size="small"
      sx={sxClasses.enlargeBtn}
      onClick={() => onSetIsEnlarged(!isEnlarged)}
      tooltip={isEnlarged ? t('dataTable.reduceBtn')! : t('dataTable.enlargeBtn')!}
      tooltipPlacement="top"
    >
      {isEnlarged ? <ArrowForwardIcon sx={sxClasses.enlargeBtnIcon} /> : <ArrowBackIcon sx={sxClasses.enlargeBtnIcon} />}
      {isEnlarged ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
    </Button>
  );
}
