import { useEffect } from 'react';
import { addNotificationError } from '@/core/utils/utilities';

export const useFetchAndParseMarkdown = (
  mapId: string,
  filePath: string,
  errorMessage: string,
  setResult: (result: Record<string, string>) => void
) => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(filePath);
        const content = await response.text();
        const sections = content.split(/=([^=]+)=/);

        if (sections[0].trim() === '') {
          sections.shift();
        }

        const resultObject: Record<string, string> = {};
        for (let i = 0; i < sections.length; i += 2) {
          const heading = sections[i].trim();
          const sectionContent = sections[i + 1].trim();
          resultObject[heading] = sectionContent;
        }

        setResult(resultObject);
      } catch (error) {
        addNotificationError(mapId, errorMessage);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, setResult]);
};
