export interface AboutPanelProps {
  config: TypeAboutPanelProps;
}

export type TypeAboutPanelConfig = {
  isOpen: boolean;
  aboutTitle: string;
  iconPath: string;
  mdPath: string;
  mdContent: string[];
  title: string;
  logoPath: string;
  description: string;
  link: string;
};

export interface TypeAboutPanelProps {
  /** Whether the panel is initially open */
  isOpen?: boolean;
  /** The Title for the About Panel */
  aboutTitle?: string;
  /** Path to custom icon for the about button */
  iconPath?: string;
  /** Path to markdown document */
  mdPath?: string;
  /** Array of markdown content strings */
  mdContent?: string[];
  /** Title for the about page */
  title?: string;
  /** Path to logo image */
  logoPath?: string;
  /** Description text */
  description?: string;
  /** Link URL */
  link?: string;
  /** Schema version */
  version?: string;
}

export type TypeMarkdownFromPathProps = {
  mdPath: string;
};

export type TypeMarkdownFromContentProps = {
  mdContent: string[];
};

export type TypeDefaultContentProps = {
  title?: string;
  logoPath?: string;
  description?: string;
  link?: string;
};
