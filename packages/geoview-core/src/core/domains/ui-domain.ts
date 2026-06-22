import type { i18n } from 'i18next';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { DisplayDateMode, TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import { DateMgt, type TimeIANA } from '@/core/utils/date-mgt';

/**
 * Domain responsible for managing the UI language and i18n resources.
 */
export class UIDomain {
  /** The i18n instance */
  #i18nInstance: i18n;

  /** The display language for the UI */
  #displayLanguage: TypeDisplayLanguage = 'en';

  /** The display theme for the UI */
  #displayTheme: TypeDisplayTheme = 'geo.ca';

  /** The display date mode for the UI */
  #displayDateMode: DisplayDateMode = 'long';

  /** The display date timezone for the UI */
  #displayDateTimezone: TimeIANA = 'local';

  /** Callback delegates for the language changed event */
  #onLanguageChangedHandlers: DomainLanguageChangedDelegate[] = [];

  /** Callback delegates for the theme changed event */
  #onThemeChangedHandlers: DomainThemeChangedDelegate[] = [];

  /** Callback delegates for the display date mode changed event */
  #onDisplayDateModeChangedHandlers: DomainDisplayDateModeChangedDelegate[] = [];

  /** Callback delegates for the display date timezone changed event */
  #onDisplayDateTimezoneChangedHandlers: DomainDisplayDateTimezoneChangedDelegate[] = [];

  /**
   * Constructor for the UIDomain class.
   *
   * @param i18nInstance - The i18n instance for the UI domain.
   * @param displayLanguage - The initial display language for the UI domain.
   * @param displayTheme - The initial display theme for the UI domain.
   * @param displayDateTimezone - The initial display date timezone for the UI domain.
   */
  constructor(
    i18nInstance: i18n,
    displayLanguage: TypeDisplayLanguage,
    displayTheme: TypeDisplayTheme,
    displayDateMode: DisplayDateMode,
    displayDateTimezone: TimeIANA
  ) {
    this.#i18nInstance = i18nInstance;
    this.#displayLanguage = displayLanguage;
    this.#displayTheme = displayTheme;
    this.#displayDateMode = displayDateMode;
    this.#displayDateTimezone = displayDateTimezone;
  }

  // #region PUBLIC METHODS

  /**
   * Gets the i18n instance.
   *
   * @returns The i18n instance
   */
  geti18n(): i18n {
    return this.#i18nInstance;
  }

  /**
   * Gets the current display language.
   *
   * @returns The display language
   */
  getLanguage(): TypeDisplayLanguage {
    return this.#displayLanguage;
  }

  /**
   * Sets the display language and updates the i18n instance.
   *
   * @param lang - The display language to set
   * @returns A promise that resolves when the language has been changed
   */
  async setLanguage(lang: TypeDisplayLanguage): Promise<void> {
    if (lang === this.#displayLanguage) return;
    this.#displayLanguage = lang;
    await this.#i18nInstance.changeLanguage(lang);
    this.#emitLanguageChanged({ language: lang });
  }

  /**
   * Adds a localization resource bundle for a supported language (fr, en).
   *
   * The new keys can be accessed from the utilities function getLocalizedMessage
   * to reuse in UI from outside the core viewer.
   *
   * @param language - The language to add the resource for (en, fr)
   * @param translations - The translation object to add
   */
  addLocalizeResourceBundle(language: TypeDisplayLanguage, translations: Record<string, unknown>): void {
    this.#i18nInstance.addResourceBundle(language, 'translation', translations, true, false);
  }

  /**
   * Gets the current display theme.
   *
   * @returns The display theme
   */
  getDisplayTheme(): TypeDisplayTheme {
    return this.#displayTheme;
  }

  /**
   * Sets the display theme and emits a theme changed event.
   *
   * @param theme - The display theme to set
   */
  setDisplayTheme(theme: TypeDisplayTheme): void {
    if (theme === this.#displayTheme) return;
    this.#displayTheme = theme;
    this.#emitThemeChanged({ theme });
  }

  /**
   * Gets the current display date mode.
   *
   * @returns The display date mode
   */
  getDisplayDateMode(): DisplayDateMode {
    return this.#displayDateMode;
  }

  /**
   * Sets the display date mode and emits a display date mode changed event.
   *
   * @param displayDateMode - The display date mode to set
   */
  setDisplayDateMode(displayDateMode: DisplayDateMode): void {
    if (displayDateMode === this.#displayDateMode) return;
    this.#displayDateMode = displayDateMode;
    this.#emitDisplayDateModeChanged({ displayDateMode });
  }

  /**
   * Gets the current display date timezone.
   *
   * @returns The display date timezone
   */
  getDisplayDateTimezone(): TimeIANA {
    return this.#displayDateTimezone;
  }

  /**
   * Sets the display date timezone and emits a display date timezone changed event.
   *
   * @param displayDateTimezone - The display date timezone to set
   * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
   */
  setDisplayDateTimezone(displayDateTimezone: TimeIANA): void {
    // Validate the timezone
    DateMgt.validateTimezone(displayDateTimezone);

    if (displayDateTimezone === this.#displayDateTimezone) return;
    this.#displayDateTimezone = displayDateTimezone;
    this.#emitDisplayDateTimezoneChanged({ displayDateTimezone });
  }

  // #endregion PUBLIC METHODS

  // #region EVENTS

  /**
   * Emits a language changed event.
   *
   * @param event - The event to emit
   */
  #emitLanguageChanged(event: DomainLanguageChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLanguageChangedHandlers, event);
  }

  /**
   * Registers a language changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLanguageChanged(callback: DomainLanguageChangedDelegate): DomainLanguageChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLanguageChangedHandlers, callback);
  }

  /**
   * Unregisters a language changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLanguageChanged(callback: DomainLanguageChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLanguageChangedHandlers, callback);
  }

  /**
   * Emits a theme changed event.
   *
   * @param event - The event to emit
   */
  #emitThemeChanged(event: DomainThemeChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onThemeChangedHandlers, event);
  }

  /**
   * Registers a theme changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onThemeChanged(callback: DomainThemeChangedDelegate): DomainThemeChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onThemeChangedHandlers, callback);
  }

  /**
   * Unregisters a theme changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offThemeChanged(callback: DomainThemeChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onThemeChangedHandlers, callback);
  }

  /**
   * Emits a display date mode changed event.
   *
   * @param event - The event to emit
   */
  #emitDisplayDateModeChanged(event: DomainDisplayDateModeChangedEvent): void {
    EventHelper.emitEvent(this, this.#onDisplayDateModeChangedHandlers, event);
  }

  /**
   * Registers a display date mode changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onDisplayDateModeChanged(callback: DomainDisplayDateModeChangedDelegate): DomainDisplayDateModeChangedDelegate {
    return EventHelper.onEvent(this.#onDisplayDateModeChangedHandlers, callback);
  }

  /**
   * Unregisters a display date mode changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offDisplayDateModeChanged(callback: DomainDisplayDateModeChangedDelegate): void {
    EventHelper.offEvent(this.#onDisplayDateModeChangedHandlers, callback);
  }

  /**
   * Emits a display date timezone changed event.
   *
   * @param event - The event to emit
   */
  #emitDisplayDateTimezoneChanged(event: DomainDisplayDateTimezoneChangedEvent): void {
    EventHelper.emitEvent(this, this.#onDisplayDateTimezoneChangedHandlers, event);
  }

  /**
   * Registers a display date timezone changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onDisplayDateTimezoneChanged(callback: DomainDisplayDateTimezoneChangedDelegate): DomainDisplayDateTimezoneChangedDelegate {
    return EventHelper.onEvent(this.#onDisplayDateTimezoneChangedHandlers, callback);
  }

  /**
   * Unregisters a display date timezone changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offDisplayDateTimezoneChanged(callback: DomainDisplayDateTimezoneChangedDelegate): void {
    EventHelper.offEvent(this.#onDisplayDateTimezoneChangedHandlers, callback);
  }

  // #endregion EVENTS
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
