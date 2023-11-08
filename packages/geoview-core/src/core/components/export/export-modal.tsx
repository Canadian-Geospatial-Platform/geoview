import { MouseEventHandler, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Dialog, DialogActions, DialogTitle } from '@/ui';
import { MapContext } from '@/core/app-start';
import { exportPNG } from '@/core/utils/utilities';

/**
 * Interface used for home button properties
 */
interface ExportModalProps {
  className?: string | undefined;
  isShown: boolean;
  closeModal: MouseEventHandler<HTMLElement>;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function ExportModal(props: ExportModalProps): JSX.Element {
  const { className, isShown, closeModal } = props;

  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation();

  // TODO: fix any type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportMap = (event: any): void => {
    exportPNG(mapId);
    closeModal(event);
  };

  return (
    <Dialog open={isShown} onClose={closeModal} className={className}>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" autoFocus>
          {t('exportModal.cancelBtn')}
        </Button>
        <Button type="text" onClick={exportMap} size="small">
          {t('exportModal.exportBtn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ExportModal.defaultProps = defaultProps;
