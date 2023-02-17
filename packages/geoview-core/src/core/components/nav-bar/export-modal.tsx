import { MouseEventHandler, useContext } from 'react';

import { Button, Dialog, DialogActions, DialogTitle } from '@mui/material';

import { MapContext } from '../../app-start';
import { exportPNG } from '../../utils/utilities';

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

  return (
    // eslint-disable-next-line react/jsx-no-bind
    <Dialog open={isShown} onClose={closeModal} className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          exportPNG(mapId);
        }}
      >
        <DialogTitle>Export Map as PNG</DialogTitle>
        <DialogActions>
          <Button onClick={closeModal} size="small" autoFocus>
            Cancel
          </Button>
          <Button type="submit" onClick={closeModal} size="small">
            Export
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

ExportModal.defaultProps = defaultProps;
