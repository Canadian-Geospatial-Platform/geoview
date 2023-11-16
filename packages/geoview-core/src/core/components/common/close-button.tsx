import { SetStateAction, Dispatch } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui';
import { getSxClasses } from './enlarge-button-style';

interface CloseButtonProps {
  isLayersPanelVisible: boolean;
  setIsLayersPanelVisible: Dispatch<SetStateAction<boolean>>;
}

/**
 * Create close button
 * @param {boolean} isLayersPanelVisible show/hide the list in left panel
 * @param {function} setIsLayersPanelVisible dispatch function to update isLayersPanelVisible
 * @returns JSX.element
 */
export function CloseButton({ isLayersPanelVisible, setIsLayersPanelVisible }: CloseButtonProps) {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Button
      type="text"
      size="small"
      sx={{
        ...sxClasses.enlargeBtn,
        marginLeft: '1rem',
        [theme.breakpoints.up('md')]: { display: 'none' },
        [theme.breakpoints.between('sm', 'md')]: { display: !isLayersPanelVisible ? 'block' : 'none' },
        [theme.breakpoints.down('md')]: { display: !isLayersPanelVisible ? 'block' : 'none' },
      }}
      onClick={() => setIsLayersPanelVisible(true)}
      tooltip={t('dataTable.close') ?? ''}
      tooltipPlacement="top"
    >
      {t('dataTable.close')}
    </Button>
  );
}
