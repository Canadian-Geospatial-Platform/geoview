import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { logger } from 'geoview-core/core/utils/logger';

import { getSxClasses } from './about-panel-style';
import Markdown from 'markdown-to-jsx';

import type {
  AboutPanelProps,
  TypeDefaultContentProps,
  TypeMarkdownFromContentProps,
  TypeMarkdownFromPathProps,
} from './about-panel-types';

/**
 * Component to render markdown content from a file path / markdown document.
 *
 * @param props - The component props
 * @returns The created JSX Element from the MD document
 * @throws {Error} When the markdown file cannot be fetched
 */
function MarkdownFromPath(props: TypeMarkdownFromPathProps): JSX.Element {
  logger.logTraceRender('geoview-about-panel/about-panel > MarkdownFromPath');

  const { mdPath } = props;
  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { react } = reactUtilities;
  const { useEffect, useState } = react;
  const { Box, Typography } = ui.elements;

  const displayLanguage = useAppDisplayLanguage();

  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  useEffect(() => {
    logger.logTraceUseEffect('ABOUT-PANEL - fetch markdown', { mdPath });

    const fetchMarkdown = async (): Promise<void> => {
      try {
        const response = await fetch(mdPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch markdown: ${response.statusText}`);
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.logError('Error fetching markdown file:', err);
        setError(errorMessage);
      }
    };

    fetchMarkdown().catch((err) => logger.logError('ABOUT PANEL - Failed to convert markdown file: ', err));
  }, [mdPath]);

  if (error) {
    return (
      <Box sx={sxClasses.errorContainer}>
        <Typography color="error">
          {getLocalizedMessage(displayLanguage, 'AboutPanel.failed')}
          {error}
        </Typography>
      </Box>
    );
  }

  if (!content) {
    return (
      <Box sx={sxClasses.loadingContainer}>
        <Typography>{getLocalizedMessage(displayLanguage, 'AboutPanel.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={sxClasses.markdownContainer}>
      <Markdown>{content}</Markdown>
    </Box>
  );
}

/**
 * Component to render markdown content from an array of strings.
 *
 * @param props - The component props
 * @returns The created JSX Element from the MD content
 */
function MarkdownFromContent(props: TypeMarkdownFromContentProps): JSX.Element {
  logger.logTraceRender('geoview-about-panel/about-panel > MarkdownFromContent');

  const { mdContent } = props;
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Box sx={sxClasses.markdownContainer}>
      {mdContent.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={index} sx={sxClasses.markdownItem}>
          <Markdown>{item}</Markdown>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Component to render default about panel content.
 *
 * @param props - The component props
 * @returns The created JSX Element from the configuration options
 */
function DefaultContent(props: TypeDefaultContentProps): JSX.Element {
  logger.logTraceRender('geoview-about-panel/about-panel > DefaultContent');

  const { title, logoPath, description, link } = props;
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, Typography, Link } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Box sx={sxClasses.defaultContainer}>
      {title && (
        <Typography variant="h4" sx={sxClasses.title}>
          {title}
        </Typography>
      )}

      {logoPath && (
        <Box sx={sxClasses.logoContainer}>
          <img src={logoPath} alt={title || 'Logo'} style={{ maxWidth: '100%', height: 'auto' }} />
        </Box>
      )}

      {description && (
        <Typography variant="body1" sx={sxClasses.description}>
          {description}
        </Typography>
      )}

      {link && (
        <Box sx={sxClasses.linkContainer}>
          <Link href={link} underline="hover">
            {link}
          </Link>
        </Box>
      )}
    </Box>
  );
}

/**
 * Main About Panel component.
 *
 * Renders markdown content from path, array of strings, or default content.
 *
 * @param props - The component props
 * @returns The About Panel element
 */
export function AboutPanel(props: AboutPanelProps): JSX.Element {
  logger.logTraceRender('geoview-about-panel/about-panel');

  const { config } = props;

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  // Priority 1: Markdown file path
  if (config.mdPath) {
    return (
      <Box sx={sxClasses.container}>
        <MarkdownFromPath mdPath={config.mdPath} />
      </Box>
    );
  }

  // Priority 2: Markdown content array
  if (config.mdContent && config.mdContent.length > 0) {
    return (
      <Box sx={sxClasses.container}>
        <MarkdownFromContent mdContent={config.mdContent} />
      </Box>
    );
  }

  // Priority 3: Default content (title, logo, description, link)
  return (
    <Box sx={sxClasses.container}>
      <DefaultContent title={config.title} logoPath={config.logoPath} description={config.description} link={config.link} />
    </Box>
  );
}
