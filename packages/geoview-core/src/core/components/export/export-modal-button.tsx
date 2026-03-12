import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { useUIController } from '@/core/controllers/ui-controller';
import { IconButton } from '@/ui/icon-button/icon-button';
import { DownloadIcon } from '@/ui/icons/index';
import { useLayerAreLayersLoading } from '@/core/stores/store-interface-and-intial-values/layer-state';

/**
 * Interface used for export button properties
 */
interface ExportProps {
  id: string;
  className?: string;
  sxDetails?: object;
}

/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */

export default function ExportButton({ id, className = '', sxDetails }: ExportProps): JSX.Element {
  // Hooks
  const theme = useTheme();
  const { t } = useTranslation<string>();

  // get store function
  const uiController = useUIController();
  const layersAreLoading = useLayerAreLayersLoading();

  return (
    <IconButton
      id={id}
      aria-label={t('appbar.export')}
      aria-haspopup="dialog"
      onClick={() => uiController.enableFocusTrap({ activeElementId: 'export', callbackElementId: id })}
      sx={{ [theme.breakpoints.down('md')]: { display: 'none' }, ...sxDetails }}
      className={className}
      disabled={layersAreLoading}
    >
      <DownloadIcon />
    </IconButton>
  );
}
