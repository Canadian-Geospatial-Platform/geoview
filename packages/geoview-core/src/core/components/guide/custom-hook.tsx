import { useEffect } from 'react';
import { logger } from '@/core/utils/logger';

export const useFetchAndParseMarkdown = (
  mapId: string,
  filePath: string,
  errorMessage: string,
  setResult: (result: Record<string, string>) => void
): void => {
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch(filePath);
        const content = await response.text();
        const sections = content.split(/=(?=!)(.*?)=/);

        if (!sections[0].trim()) {
          sections.shift();
        }
        // Example for variable sections
        /**
          [
            "!How can I add my own layers?",
            "\n### Introduction about layers\nLorem Ipsum is simply dummy text \n\n",
            "!Learn more about notification?",
            "\n### How notifications work:\nLorem Ipsum is simply dummy text of\n\n",
            "!Learn more about attributions",
            "\n### How attribution works:\nLorem Ipsum is simply dummy text of\n\n",
            "!How map scales work?",
            "\n### Learn about map scale:\nLorem Ipsum is simply dummy text of\n\n",
            "!Footer",
            "\n%legend%\n### Legend help section\n- List 1 in legend\n- List
          ]
         */

        // TODO review this logic if we can make it more simplified
        const resultObject: Record<string, string> = {};
        for (let i = 0; i < sections.length; i += 2) {
          const heading = sections[i].trim();
          const sectionContent = sections[i + 1].trim();
          resultObject[heading] = sectionContent;
        }

        setResult(resultObject);
      } catch (error) {
        logger.logError(mapId, errorMessage);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, setResult]);
};
