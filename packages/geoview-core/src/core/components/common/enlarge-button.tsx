import { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowBackIcon, ArrowForwardIcon, Button } from '@/ui';

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

  return (
    <Button
      type="text"
      size="small"
      color="primary"
      variant="contained"
      startIcon={isEnlarged ? <ArrowForwardIcon /> : <ArrowBackIcon />}
      sx={{ height: '40px', borderRadius: '1.5rem' }}
      onClick={() => onSetIsEnlarged(!isEnlarged)}
      tooltip={isEnlarged ? t('dataTable.reduceBtn')! : t('dataTable.enlargeBtn')!}
      tooltipPlacement="top"
    >
      {isEnlarged ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
    </Button>
  );
}
