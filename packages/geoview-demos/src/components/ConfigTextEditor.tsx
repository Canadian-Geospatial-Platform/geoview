import { useContext, useEffect, useRef, useState } from 'react';
import { CGPVContext } from '../providers/cgpvContextProvider/CGPVContextProvider';
import { Box, Button } from '@mui/material';

export function ConfigTextEditor() {
  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { configJson, validateConfigJson, createMapFromConfigText } = cgpvContext;

  const textEditorRef = useRef<HTMLTextAreaElement>(null);

  const [editorText, setEditorText] = useState<string>('');
  const [numberOfLines, setNumberOfLines] = useState<number>(0);
  const [isValidJson, setIsValidJson] = useState<boolean>(false);
  const [isEditorTouched, setIsEditorTouched] = useState<boolean>(false);

  useEffect(() => {
    const jsonObj = configJson || {};
    const jsonTxt = JSON.stringify(jsonObj, null, 4);
    setEditorText(jsonTxt);
    setIsEditorTouched(false);
  }, [configJson]);

  useEffect(() => {
    const numOfLines = editorText.split(/\r\n|\r|\n/).length;
    setNumberOfLines(numOfLines + 5);
  }, [editorText]);

  const onTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorText(event.target.value);
    setIsEditorTouched(true);
    setIsValidJson(false);
  };

  const validateText = () => {
    const results = validateConfigJson(editorText);
    if (results) {
      alert(results);
      setIsValidJson(false);
    } else {
      alert('Valid JSON');
      setIsValidJson(true);
    }
  };

  const createMap = () => {
    createMapFromConfigText(editorText);
  };

  function generateArray(n: number) {
    return Array.from({ length: n }, (_, index) => index);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box className="config-editor">
        <div className="line-numbers">
          {generateArray(numberOfLines).map((lineNumber) => (
            <span key={lineNumber}></span>
          ))}
        </div>
        <textarea
          id="configGeoview"
          name="configuration"
          value={editorText}
          onChange={onTextareaChange}
          rows={30}
          cols={150}
          ref={textEditorRef}
        ></textarea>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
        <Button variant="contained" color="primary" onClick={validateText} disabled={!isEditorTouched}>
          Validate
        </Button>
        <Button variant="contained" color="primary" onClick={createMap} disabled={!isValidJson}>
          Create Map
        </Button>
      </Box>
    </Box>
  );
}
