/**
 * Union type for all possible legend item types.
 */
export type TypeLegendItem = TypeLegendLayer | TypeHeaderLayer | TypeGroupLayer;

/**
 * A reference to an existing layer from geoview-core.
 */
export interface TypeLegendLayer {
  type: 'legend';
  layerPath: string;
  visible?: boolean;
}

export type TypeLegendText = string | TypeLegendTextLanguages;

export interface TypeLegendTextLanguages {
  en: string;
  fr: string;
}

/**
 * A header text item for organizing legend sections.
 */
export interface TypeHeaderLayer {
  itemId?: string;
  type: 'header';
  text: TypeLegendText;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
}

/**
 * A collapsible group containing other legend items.
 */
export interface TypeGroupLayer {
  itemId?: string;
  type: 'group';
  text: TypeLegendText;
  collapsed?: boolean;
  children: TypeLegendItem[];
}

/**
 * Main configuration for custom legend.
 */
export interface TypeCustomLegendConfig {
  isOpen: boolean;
  title: TypeLegendText;
  legendList: TypeLegendItem[];
  version?: string;
}

/**
 * Type guards for discriminating union types.
 */
export const isLegendLayer = (item: TypeLegendItem): item is TypeLegendLayer => {
  return item.type === 'legend';
};

export const isHeaderLayer = (item: TypeLegendItem): item is TypeHeaderLayer => {
  return item.type === 'header';
};

export const isGroupLayer = (item: TypeLegendItem): item is TypeGroupLayer => {
  return item.type === 'group';
};

/**
 * Extract text in the current language from TypeLegendText.
 * @param {TypeLegendText} text - The text object or string
 * @param {string} language - Current language ('en' or 'fr')
 * @returns {string} The extracted text
 */
export function getLocalizedText(text: TypeLegendText, language: 'en' | 'fr'): string {
  if (typeof text === 'string') {
    return text;
  }
  return text[language] || '';
}

/**
 * Generate a unique ID for a legend item based on its content and position.
 * @param {TypeLegendItem} item - The legend item
 * @param {number} index - The item's position in the list
 * @param {string} parentPath - Optional parent path for nested items
 * @param {string} language - The language of the current text
 * @returns {string} A unique identifier
 */
export function generateLegendItemId(item: TypeLegendItem, index: number, language: 'en' | 'fr', parentPath: string = ''): string {
  const basePath = parentPath ? `${parentPath}/` : '';

  if (isLegendLayer(item)) {
    // Use the layerPath as the unique ID
    return `${basePath}${item.layerPath}`;
  }

  if (isHeaderLayer(item)) {
    // Use itemId if provided, otherwise generate from text + index
    const text = getLocalizedText(item.text, language);
    return item.itemId || `${basePath}header-${text.toLowerCase().replace(/\s+/g, '-')}-${index}`;
  }

  if (isGroupLayer(item)) {
    // Use itemId if provided, otherwise generate from title + index
    const text = getLocalizedText(item.text, language);
    return item.itemId || `${basePath}group-${text.toLowerCase().replace(/\s+/g, '-')}-${index}`;
  }

  // Fallback
  return `${basePath}item-${index}`;
}
