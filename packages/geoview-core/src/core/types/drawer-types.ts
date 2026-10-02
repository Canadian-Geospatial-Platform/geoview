/** Drawing style properties for fill, stroke, icon, and text. */
export type DrawerStyleProperties = {
  /** The fill color (CSS color string). */
  fillColor: string;

  /** The stroke color (CSS color string). */
  strokeColor: string;

  /** The stroke width in pixels. */
  strokeWidth: number;

  /** Optional icon source URL for point drawings. */
  iconSrc?: string;

  /** Optional icon size in pixels. */
  iconSize?: number;

  /** Optional text content for text drawings. */
  text?: string | string[];

  /** Optional text size in pixels. */
  textSize?: number;

  /** Optional text font family name. */
  textFont?: string;

  /** Optional text color (CSS color string). */
  textColor?: string;

  /** Optional text halo color (CSS color string). */
  textHaloColor?: string;

  /** Optional text halo width in pixels. */
  textHaloWidth?: number;

  /** Optional flag for bold text. */
  textBold?: boolean;

  /** Optional flag for italic text. */
  textItalic?: boolean;

  /** Optional text rotation angle in degrees. */
  textRotation?: number;
};
