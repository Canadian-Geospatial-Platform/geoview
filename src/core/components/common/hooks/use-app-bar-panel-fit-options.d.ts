import type { GVFitOptions } from '@/core/utils/constant';
/**
 * Custom hook that provides map fit options for zooming to a feature, keeping it out of the open app-bar panel.
 *
 * Details and Data Table can live in the app bar or the footer bar, so the open app-bar panel (if any) is read
 * from the store. The STAC browser only lives in the app bar, so it calls `MapFitPadding.getAppBarPanelPadding` directly.
 *
 * @returns A getter of the fit options to pass when zooming
 */
export declare function useAppBarPanelFitOptions(): () => GVFitOptions;
//# sourceMappingURL=use-app-bar-panel-fit-options.d.ts.map