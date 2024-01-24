import { logger } from '@/core/utils/logger';
import { LayersPanel } from './layers-panel';

export function Layers(): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/layers');

  return <LayersPanel />;
}
