import { useContext, useEffect, useRef } from "react";
import { CGPVContext } from "../providers/cgpvContextProvider/CGPVContextProvider";


export function ConfigTextEditor() {

  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { configJson } = cgpvContext;

  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const jsonObj = configJson || {};


  const formattedJson = JSON.stringify(jsonObj, null, 4);
  const numberOfLines = formattedJson.split(/\r\n|\r|\n/).length;

  function generateArray(n: number) {
    return Array.from({ length: n }, (_, index) => index);
  }

  return (
    <div className="config-editor">
      <div className="line-numbers">
        {generateArray(numberOfLines).map((lineNumber) => (
          <span key={lineNumber}></span>
        ))}
      </div>
      <textarea id="configGeoview" name="configuration" value={formattedJson} rows={30} cols={150} ref={textEditorRef}>
      </textarea>
    </div>
  );
}