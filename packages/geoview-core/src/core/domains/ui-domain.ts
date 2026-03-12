import type { i18n } from 'i18next';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';

export class UIDomain {
  /** The i18n instance */
  #i18nInstance: i18n;

  /** The display language for the UI */
  #displayLanguage: TypeDisplayLanguage = 'en';

  /** Keep all callback delegate references */
  #onLanguageChangedHandlers: LanguageChangedDelegate[] = [];

  /**
   * Constructor for the UIDomain class.
   * @param i18nInstance - The i18n instance for the UI domain.
   * @param displayLanguage - The initial display language for the UI domain.
   */
  constructor(i18nInstance: i18n, displayLanguage: TypeDisplayLanguage) {
    this.#i18nInstance = i18nInstance;
    this.#displayLanguage = displayLanguage;
  }

  geti18n(): i18n {
    return this.#i18nInstance;
  }

  getLanguage(): TypeDisplayLanguage {
    return this.#displayLanguage;
  }

  async setLanguage(lang: TypeDisplayLanguage): Promise<void> {
    if (lang === this.#displayLanguage) return;
    this.#displayLanguage = lang;
    await this.#i18nInstance.changeLanguage(lang);
    this.#emitLanguageChanged({ language: lang });
  }

  /**
   * Adds a localization ressource bundle for a supported language (fr, en). Then the new key added can be
   * access from the utilies function getLocalizesMessage to reuse in ui from outside the core viewer.
   *
   * @param {TypeDisplayLanguage} language - The language to add the ressoruce for (en, fr)
   * @param {Record<string, unknown>} translations - The translation object to add
   */
  addLocalizeRessourceBundle(language: TypeDisplayLanguage, translations: Record<string, unknown>): void {
    this.#i18nInstance.addResourceBundle(language, 'translation', translations, true, false);
  }

  /**
   * Emits language changed event.
   *
   * @param event - The event to emit
   */
  #emitLanguageChanged(event: LanguageChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLanguageChangedHandlers, event);
  }

  /**
   * Registers a language changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLanguageChanged(callback: LanguageChangedDelegate): LanguageChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLanguageChangedHandlers, callback);
  }

  /**
   * Unregisters a language changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLanguageChanged(callback: LanguageChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLanguageChangedHandlers, callback);
  }
}

/**
 * Define an event for the delegate
 */
export type LanguageChangedEvent = {
  // The language
  language: TypeDisplayLanguage;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LanguageChangedDelegate = EventDelegateBase<UIDomain, LanguageChangedEvent, void>;
