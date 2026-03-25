import { AbstractMapViewerAdaptor } from '@/core/adaptors/base/abstract-map-viewer-adaptor';
import { setStoreDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { DomainLanguageChangedEvent, UIDomain } from '@/core/domains/ui-domain';

export class UIStateAdaptor extends AbstractMapViewerAdaptor {
  /** The UI Domain on which the adaptor operates */
  #uiDomain: UIDomain;

  /**
   *
   * @param uiDomain
   * @param mapId
   */
  constructor(uiDomain: UIDomain, mapId: string) {
    super(mapId);

    // Keep a reference on the UI domain
    this.#uiDomain = uiDomain;

    // Listens when the language is changed in the UI domain and updates the store accordingly
    this.#uiDomain.onLanguageChanged(this.#handleDisplayLanguageChanged.bind(this));
  }

  // #region DOMAIN HANDLERS

  #handleDisplayLanguageChanged(sender: UIDomain, event: DomainLanguageChangedEvent): void {
    setStoreDisplayLanguage(this.getMapId(), event.language);
  }

  // #endregion DOMAIN HANDLERS
}
