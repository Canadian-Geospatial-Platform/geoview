import type { i18n } from 'i18next';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { DisplayDateMode, TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import { type TimeIANA } from '@/core/utils/date-mgt';
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
     * @param displayTheme - The initial display theme for the UI domain.
     * @param displayDateTimezone - The initial display date timezone for the UI domain.
     */
    constructor(i18nInstance: i18n, displayLanguage: TypeDisplayLanguage, displayTheme: TypeDisplayTheme, displayDateMode: DisplayDateMode, displayDateTimezone: TimeIANA);
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
     * Gets the current display theme.
     *
     * @returns The display theme
     */
    getDisplayTheme(): TypeDisplayTheme;
    /**
     * Sets the display theme and emits a theme changed event.
     *
     * @param theme - The display theme to set
     */
    setDisplayTheme(theme: TypeDisplayTheme): void;
    /**
     * Gets the current display date mode.
     *
     * @returns The display date mode
     */
    getDisplayDateMode(): DisplayDateMode;
    /**
     * Sets the display date mode and emits a display date mode changed event.
     *
     * @param displayDateMode - The display date mode to set
     */
    setDisplayDateMode(displayDateMode: DisplayDateMode): void;
    /**
     * Gets the current display date timezone.
     *
     * @returns The display date timezone
     */
    getDisplayDateTimezone(): TimeIANA;
    /**
     * Sets the display date timezone and emits a display date timezone changed event.
     *
     * @param displayDateTimezone - The display date timezone to set
     * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
     */
    setDisplayDateTimezone(displayDateTimezone: TimeIANA): void;
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
    /**
     * Registers a theme changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onThemeChanged(callback: DomainThemeChangedDelegate): DomainThemeChangedDelegate;
    /**
     * Unregisters a theme changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offThemeChanged(callback: DomainThemeChangedDelegate): void;
    /**
     * Registers a display date mode changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onDisplayDateModeChanged(callback: DomainDisplayDateModeChangedDelegate): DomainDisplayDateModeChangedDelegate;
    /**
     * Unregisters a display date mode changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offDisplayDateModeChanged(callback: DomainDisplayDateModeChangedDelegate): void;
    /**
     * Registers a display date timezone changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onDisplayDateTimezoneChanged(callback: DomainDisplayDateTimezoneChangedDelegate): DomainDisplayDateTimezoneChangedDelegate;
    /**
     * Unregisters a display date timezone changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offDisplayDateTimezoneChanged(callback: DomainDisplayDateTimezoneChangedDelegate): void;
}
/** Event payload emitted when the display language changes */
export interface DomainLanguageChangedEvent {
    /** The new display language */
    language: TypeDisplayLanguage;
}
/** Delegate type for language changed event handlers */
export type DomainLanguageChangedDelegate = EventDelegateBase<UIDomain, DomainLanguageChangedEvent, void>;
/** Event payload emitted when the display theme changes */
export interface DomainThemeChangedEvent {
    /** The new display theme */
    theme: TypeDisplayTheme;
}
/** Delegate type for theme changed event handlers */
export type DomainThemeChangedDelegate = EventDelegateBase<UIDomain, DomainThemeChangedEvent, void>;
/** Event payload emitted when the display date mode changes */
export interface DomainDisplayDateModeChangedEvent {
    /** The new display date mode */
    displayDateMode: DisplayDateMode;
}
/** Delegate type for display date mode changed event handlers */
export type DomainDisplayDateModeChangedDelegate = EventDelegateBase<UIDomain, DomainDisplayDateModeChangedEvent, void>;
/** Event payload emitted when the display date timezone changes */
export interface DomainDisplayDateTimezoneChangedEvent {
    /** The new display date timezone */
    displayDateTimezone: TimeIANA;
}
/** Delegate type for display date timezone changed event handlers */
export type DomainDisplayDateTimezoneChangedDelegate = EventDelegateBase<UIDomain, DomainDisplayDateTimezoneChangedEvent, void>;
//# sourceMappingURL=ui-domain.d.ts.map