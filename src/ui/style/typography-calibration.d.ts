/**
 * Measures the host root and browser default once per document without changing host styles.
 *
 * Logs a warning and leaves calibration uncached when measurements are unavailable so later theme creation can retry.
 *
 * @param hostDocument - Optional document whose GeoView themes are being constructed
 * @returns Calibrated MUI htmlFontSize, or the uncalibrated 16px default when measurements are invalid
 */
export declare const getCalibratedHtmlFontSize: (hostDocument?: Document) => number;
//# sourceMappingURL=typography-calibration.d.ts.map