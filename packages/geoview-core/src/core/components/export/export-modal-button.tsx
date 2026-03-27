import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { IconButton } from '@/ui/icon-button/icon-button';
import { DownloadIcon } from '@/ui/icons/index';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useLayerAreLayersLoading } from '@/core/stores/store-interface-and-intial-values/layer-state';

/** Props for the ExportButton component. */
interface ExportProps {
  /** The button element id. */
  id: string;
  /** Optional CSS class name. */
  className?: string;
  /** Optional additional sx styles. */
  sxDetails?: object;
}

/**
 * Creates the export PNG button component.
 *
 * @param props - Properties defined in ExportProps interface
 * @returns The export button
 */

export default function ExportButton({ id, className = '', sxDetails }: ExportProps): JSX.Element {
  // Hooks
  const theme = useTheme();
  const { t } = useTranslation<string>();

  // get store function
  const { enableFocusTrap } = useUIStoreActions();
  const layersAreLoading = useLayerAreLayersLoading();

  return (
    <IconButton
      id={id}
      aria-label={t('appbar.export')}
      aria-haspopup="dialog"
      onClick={() => enableFocusTrap({ activeElementId: 'export', callbackElementId: id })}
      sx={{ [theme.breakpoints.down('md')]: { display: 'none' }, ...sxDetails }}
      className={className}
      disabled={layersAreLoading}
    >
      <DownloadIcon />
    </IconButton>
  );
}
