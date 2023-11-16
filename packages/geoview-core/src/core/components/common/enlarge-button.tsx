import { Dispatch } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { ArrowBackIcon, ArrowForwardIcon, Button } from '@/ui';
import { getSxClasses } from './enlarge-button-style';

interface EnlargeButtonProps {
  isEnlargeDataTable: boolean;
  setIsEnlargeDataTable: Dispatch<boolean>;
}

/**
 * Create enlarge button
 * @param {boolean} isEnlargeDataTable
 * @param {function} setIsEnlargeDataTable
 * @returns JSX.element
 */
export function EnlargeButton({ isEnlargeDataTable, setIsEnlargeDataTable }: EnlargeButtonProps) {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Button
      type="text"
      size="small"
      sx={sxClasses.enlargeBtn}
      onClick={() => setIsEnlargeDataTable(!isEnlargeDataTable)}
      tooltip={isEnlargeDataTable ? t('dataTable.reduceBtn')! : t('dataTable.enlargeBtn')!}
      tooltipPlacement="top"
    >
      {isEnlargeDataTable ? <ArrowForwardIcon sx={sxClasses.enlargeBtnIcon} /> : <ArrowBackIcon sx={sxClasses.enlargeBtnIcon} />}
      {isEnlargeDataTable ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
    </Button>
  );
}
