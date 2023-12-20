import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Paper, TextField, UploadFileIcon } from '@/ui';

export function AddNewLayer(): JSX.Element {
  // const acceptedFiles = ["*.json"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDrop = useCallback((acceptedFiles: any) => {
    // Do something with the files
    console.log('acceptedFiles ', acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const dropAreaSx = {
    boxShadow: "inset 0px 3px 6px #00000029",
    width: "100%", 
    background: "#F1F2F5 0% 0% no-repeat padding-box", 
    minHeight: "100px", 
    display: "flex", 
    flexDirection:"column",
    alignItems:"center", 
    padding: "20px", 
    cursor: "pointer", 
    marginBottom: "20px",
    textAlign: "center"
  };

  return (
    <Paper sx={{padding: "20px", display: "flex", flexDirection:"column", gap:"8" }}>
      <Box {...getRootProps()} sx={dropAreaSx}>
        <input {...getInputProps()} />
        <UploadFileIcon sx={{color: "#555555", fontSize: 60}}  />
        {isDragActive ? <p>Drop the files here ...</p> : <p>Drag and drop some files here, or click to select files</p>}
      </Box>
      <TextField id="outlined-basic" label="OR Enter URL or UUID" variant="outlined" fullWidth size="small"/>

      <Button type="text" sx={{marginTop: "20px", width: "150px" }} variant="outlined">Continue</Button>
    </Paper>
  );
}
