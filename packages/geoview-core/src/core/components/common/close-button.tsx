import { SetStateAction, Dispatch } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui';
import { getSxClasses } from './enlarge-button-style';

interface CloseButtonProps {
  isRightPanelVisible: boolean;
  onSetIsRightPanelVisible: Dispatch<SetStateAction<boolean>>;
  fullWidth?: boolean;
}

/**
 * Create close button
 * @param {boolean} isRightPanelVisible show/hide the list in left panel
 * @param {function} setisRightPanelVisible dispatch function to update isRightPanelVisible
 * @param {boolean} fullWidth show close button when full width is true
 * @returns {JSX.Element}
 */
export function CloseButton({ isRightPanelVisible, onSetIsRightPanelVisible, fullWidth }: CloseButtonProps): JSX.Element {
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
        ...(fullWidth ? sxClasses.appBarEnlargeButton : sxClasses.footerBarEnlargeButton),
        ...(fullWidth && { display: !isRightPanelVisible ? 'none' : 'block' }),
        ...(!fullWidth && {
          [theme.breakpoints.up('md')]: { display: 'none' },
          [theme.breakpoints.between('sm', 'md')]: { display: !isRightPanelVisible ? 'none' : 'block' },
          [theme.breakpoints.down('md')]: { display: !isRightPanelVisible ? 'none' : 'block' },
        }),
      }}
      onClick={() => onSetIsRightPanelVisible(false)}
      tooltip={t('dataTable.close') ?? ''}
      tooltipPlacement="top"
    >
      {t('dataTable.close')}
    </Button>
  );
}

CloseButton.defaultProps = {
  fullWidth: false,
};
