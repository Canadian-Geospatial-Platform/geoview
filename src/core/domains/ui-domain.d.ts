import type { i18n } from 'i18next';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
/**
 * Domain responsible for managing the UI language and i18n resources.
 */
export declare class UIDomain {
    #private;
    /**
     * Constructor for the UIDomain class.
     *
     * @param i18nInstance - The i18n instance for the UI domain.
     * @param displayLanguage - The initial display language for the UI domain.
     */
    constructor(i18nInstance: i18n, displayLanguage: TypeDisplayLanguage);
    /**
     * Gets the i18n instance.
     *
     * @returns The i18n instance
     */
    geti18n(): i18n;
    /**
     * Gets the current display language.
     *
     * @returns The display language
     */
    getLanguage(): TypeDisplayLanguage;
    /**
     * Sets the display language and updates the i18n instance.
     *
     * @param lang - The display language to set
     * @returns A promise that resolves when the language has been changed
     */
    setLanguage(lang: TypeDisplayLanguage): Promise<void>;
    /**
     * Adds a localization resource bundle for a supported language (fr, en).
     *
     * The new keys can be accessed from the utilities function getLocalizedMessage
     * to reuse in UI from outside the core viewer.
     *
     * @param language - The language to add the resource for (en, fr)
     * @param translations - The translation object to add
     */
    addLocalizeResourceBundle(language: TypeDisplayLanguage, translations: Record<string, unknown>): void;
    /**
     * Registers a language changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLanguageChanged(callback: DomainLanguageChangedDelegate): DomainLanguageChangedDelegate;
    /**
     * Unregisters a language changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLanguageChanged(callback: DomainLanguageChangedDelegate): void;
}
/** Event payload emitted when the display language changes */
export type DomainLanguageChangedEvent = {
    /** The new display language */
    language: TypeDisplayLanguage;
};
/** Delegate type for language changed event handlers */
export type DomainLanguageChangedDelegate = EventDelegateBase<UIDomain, DomainLanguageChangedEvent, void>;
//# sourceMappingURL=ui-domain.d.ts.map