import { logger } from '@/core/utils/logger';

/** Document-scoped calibration, shared by every map without sharing theme objects. */
const documentCalibrations = new WeakMap<Document, number>();

/**
 * Measures the host root and browser default once per document without changing host styles.
 *
 * Logs a warning and leaves calibration uncached when measurements are unavailable so later theme creation can retry.
 *
 * @param hostDocument - Optional document whose GeoView themes are being constructed
 * @returns Calibrated MUI htmlFontSize, or the uncalibrated 16px default when measurements are invalid
 */
export const getCalibratedHtmlFontSize = (hostDocument?: Document): number => {
  const resolvedDocument = hostDocument ?? globalThis.document;
  if (!resolvedDocument) {
    logger.logWarning('Typography calibration requires a document. Using uncalibrated 16px; will retry.');
    return 16;
  }

  const cached = documentCalibrations.get(resolvedDocument);
  if (cached !== undefined) return cached;

  const hostWindow = resolvedDocument.defaultView;
  if (!hostWindow) {
    logger.logWarning('Typography calibration requires a document with a window. Using uncalibrated 16px; will retry.');
    return 16;
  }

  const hostRoot = Number.parseFloat(hostWindow.getComputedStyle(resolvedDocument.documentElement).fontSize);
  const probe = resolvedDocument.createElement('span');
  probe.style.cssText =
    'position: absolute; visibility: hidden; width: 0; height: 0; overflow: hidden; left: 0; top: 0; pointer-events: none;';
  probe.style.setProperty('font', 'medium sans-serif', 'important');
  resolvedDocument.documentElement.appendChild(probe);
  let userDefault: number;
  try {
    userDefault = Number.parseFloat(hostWindow.getComputedStyle(probe).fontSize);
  } finally {
    probe.remove();
  }
  if (!Number.isFinite(hostRoot) || hostRoot <= 0 || !Number.isFinite(userDefault) || userDefault <= 0) {
    logger.logWarning(
      `Invalid typography calibration: host root ${hostRoot}, browser default ${userDefault}. Using uncalibrated 16px; will retry.`
    );
    return 16;
  }

  const htmlFontSize = (hostRoot * 16) / userDefault;
  documentCalibrations.set(resolvedDocument, htmlFontSize);
  return htmlFontSize;
};
