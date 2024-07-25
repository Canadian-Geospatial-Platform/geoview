import { ReactElement } from 'react';
import { FocusTrap } from '@/ui';
import { logger } from '@/core/utils/logger';

interface FocusTrapContainerType {
  children: ReactElement;
  open: boolean;
}

/**
 * Focus trap container which will trap the focus when navigating through keyboard tab.
 * @param {ReactElement} children dom elements wrapped in Focus trap.
 * @param {boolean} open enable and disabling of focus trap.
 * @returns {JSX.Element}
 */
export function FocusTrapContainer({ children, open }: FocusTrapContainerType): JSX.Element {
  // Log
  logger.logTraceRender('component/common/FocusTrapContainer');

  return <FocusTrap open={open}>{children}</FocusTrap>;
}
