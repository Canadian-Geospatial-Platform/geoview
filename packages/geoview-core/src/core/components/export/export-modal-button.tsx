import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { IconButton } from '@/ui/icon-button/icon-button';
import { DownloadIcon } from '@/ui/icons/index';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useLayerAreLayersLoading } from '@/core/stores/store-interface-and-intial-values/layer-state';

/**
 * Interface used for export button properties
 */
interface ExportProps {
  id: string;
  ariaControls: string;
  className?: string;
  sxDetails?: object;
  ariaExpanded?: boolean;
}

/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */

export default function ExportButton({ id, ariaControls, className = '', sxDetails, ariaExpanded = false }: ExportProps): JSX.Element {
  // Hooks
  const theme = useTheme();
  const { t } = useTranslation<string>();

  // get store function
  const { enableFocusTrap } = useUIStoreActions();
  const layersAreLoading = useLayerAreLayersLoading();

  return (
    <IconButton
      id={id}
      aria-controls={ariaControls}
      aria-label={t('appbar.export')}
      aria-expanded={ariaExpanded}
      tooltipPlacement="right"
      onClick={() => enableFocusTrap({ activeElementId: 'export', callbackElementId: id })}
      sx={{ [theme.breakpoints.down('md')]: { display: 'none' }, ...sxDetails }}
      className={className}
      disabled={layersAreLoading}
    >
      <DownloadIcon />
    </IconButton>
  );
}
