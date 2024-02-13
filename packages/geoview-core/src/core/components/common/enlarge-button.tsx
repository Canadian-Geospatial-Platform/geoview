import { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowBackIcon, ArrowForwardIcon, Button } from '@/ui';

interface EnlargeButtonProps {
  isEnlargeDataTable: boolean;
  // TODO: Refactor this props something like 'onEnlarge'? (getting rid of legacy 'data table' stuff and align with callback namings conv?)
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

  return (
    <Button
      type="text"
      size="small"
      color="primary"
      variant="contained"
      startIcon={isEnlargeDataTable ? <ArrowForwardIcon /> : <ArrowBackIcon />}
      sx={{height: '40px', borderRadius: '1.5rem'}}
      onClick={() => setIsEnlargeDataTable(!isEnlargeDataTable)}
      tooltip={isEnlargeDataTable ? t('dataTable.reduceBtn')! : t('dataTable.enlargeBtn')!}
      tooltipPlacement="top"
    >
      {isEnlargeDataTable ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
    </Button>
  );
}
