import type { TypeWindow } from 'geoview-core/core/types/global-types';
import Markdown from 'markdown-to-jsx';
import { getSxClasses } from './about-panel-style';
import { logger } from 'geoview-core/core/utils/logger';

import type { AboutPanelProps } from './about-panel-types';

/**
 * Component to render markdown content from a file path
 */
function MarkdownFromPath({ mdPath }: { mdPath: string }): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { react } = reactUtilities;
  const { useEffect, useState } = react;
  const { Box, Typography } = ui.elements;

  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  useEffect(() => {
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
        <Typography color="error">Failed to load content: {error}</Typography>
      </Box>
    );
  }

  if (!content) {
    return (
      <Box sx={sxClasses.loadingContainer}>
        <Typography>Loading...</Typography>
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
 * Component to render markdown content from an array of strings
 */
function MarkdownFromContent({ mdContent }: { mdContent: string[] }): JSX.Element {
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
 * Component to render default about panel content
 */
function DefaultContent({
  title,
  logoPath,
  description,
  link,
}: {
  title?: string;
  logoPath?: string;
  description?: string;
  link?: string;
}): JSX.Element {
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
          <Link href={link} target="_blank" rel="noopener noreferrer" underline="hover">
            {link}
          </Link>
        </Box>
      )}
    </Box>
  );
}

/**
 * Main About Panel component
 * Renders markdown content from path, array of strings, or default content
 */
export function AboutPanel(props: AboutPanelProps): JSX.Element {
  const { config } = props;

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  logger.logDebug('AboutPanel config:', config);

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
