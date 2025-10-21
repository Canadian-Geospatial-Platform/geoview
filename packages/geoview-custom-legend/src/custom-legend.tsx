import { TypeWindow } from 'geoview-core/core/types/global-types';
import { getSxClasses } from './custom-legend-style';

interface CustomLegendPanelProps {
  config: TypeLegendProps;
  onUpdateLegend?: (legendList: LegendListItems) => void;
}

interface LegendItem {
  legendTitle: string;
  symbolUrl: string;
  description?: string;
}

type LegendListItems = LegendItem[];

export type TypeLegendProps = {
  isOpen: boolean;
  legendList: LegendListItems;
  version: string;
};

// Icon components
type IconProps = {
  className?: string;
  fontSize?: 'inherit' | 'small' | 'medium' | 'large';
};

const EditIcon = ({ className = '', fontSize = 'medium' }: IconProps): JSX.Element => (
  <i className={`material-icons ${className}`} style={{ fontSize }}>
    Edit
  </i>
);

const DeleteIcon = ({ className = '', fontSize = 'medium' }: IconProps): JSX.Element => (
  <i className={`material-icons ${className}`} style={{ fontSize }}>
    delete
  </i>
);

const SaveIcon = ({ className = '', fontSize = 'medium' }: IconProps): JSX.Element => (
  <i className={`material-icons ${className}`} style={{ fontSize }}>
    save
  </i>
);

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { config, onUpdateLegend } = props;
  const { legendList } = config;
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editedItem, setEditedItem] = React.useState<LegendItem | null>(null);
  const [hasLoadedData, setHasLoadedData] = React.useState(false);

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Card, Box, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [jsonContent, setJsonContent] = React.useState<string>('');
  const [isEditingJson, setIsEditingJson] = React.useState<boolean>(false);
  const [editedJson, setEditedJson] = React.useState<string>('');
  const [loadedFileName, setLoadedFileName] = React.useState<string>('');

  const handleEditJson = (): void => {
    setEditedJson(jsonContent);
    setIsEditingJson(true);
  };

  const handleSaveJson = (): void => {
    try {
      const parsedJson = JSON.parse(editedJson);

      // Validate/normalize JSON: support array of items and object with symbologyStack
      let validItems: LegendItem[] | null = null;

      // Case 1: Array of items with legendTitle and symbolUrl/iconUrl
      if (Array.isArray(parsedJson)) {
        const isArrayValid = parsedJson.every(
          (item) =>
            typeof item === 'object' &&
            'legendTitle' in item &&
            (('symbolUrl' in item && typeof item.symbolUrl === 'string') || ('iconUrl' in item && typeof item.iconUrl === 'string')) &&
            typeof item.legendTitle === 'string' &&
            (!('description' in item) || typeof item.description === 'string')
        );
        if (isArrayValid) {
          validItems = parsedJson.map((item) => ({
            legendTitle: item.legendTitle,
            symbolUrl: (item.symbolUrl || item.iconUrl) as string,
            description: (item.description as string) || '',
          }));
        }
      }

      // Case 2: Object with symbologyStack [{ image, text }]
      if (!validItems && parsedJson && typeof parsedJson === 'object' && Array.isArray(parsedJson.symbologyStack)) {
        const stack = parsedJson.symbologyStack;
        const isStackValid = stack.every((s) => typeof s === 'object' && typeof s.image === 'string' && typeof s.text === 'string');
        if (isStackValid) {
          validItems = stack.map((s) => ({
            legendTitle: s.text,
            symbolUrl: s.image,
            description: '',
          }));
        }
      }

      if (validItems) {
        if (onUpdateLegend) {
          onUpdateLegend(validItems);
          setJsonContent(JSON.stringify(parsedJson, null, 2));
          setIsEditingJson(false);
        }
      } else {
        logger.logError(
          'Invalid JSON structure. Provide an array of items with legendTitle and symbolUrl/iconUrl, or an object with symbologyStack.'
        );
      }
    } catch (error) {
      logger.logError(error instanceof Error ? error.message : error);
    }
  };

  const handleCancelEdit = (): void => {
    setIsEditingJson(false);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setEditedJson(e.target.value);
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e): void => {
      try {
        const fileContent = e.target?.result as string;
        const jsonData = JSON.parse(fileContent);

        // Store the formatted JSON content
        setJsonContent(JSON.stringify(jsonData, null, 2));

        let validItems: LegendItem[] | null = null;

        // Case 1: Array of items with legendTitle and symbolUrl/iconUrl
        if (Array.isArray(jsonData)) {
          const isArrayValid = jsonData.every(
            (item) =>
              typeof item === 'object' &&
              'legendTitle' in item &&
              (('symbolUrl' in item && typeof item.symbolUrl === 'string') || ('iconUrl' in item && typeof item.iconUrl === 'string')) &&
              typeof item.legendTitle === 'string' &&
              (!('description' in item) || typeof item.description === 'string')
          );
          if (isArrayValid) {
            validItems = jsonData.map((item) => ({
              legendTitle: item.legendTitle,
              symbolUrl: (item.symbolUrl || item.iconUrl) as string,
              description: (item.description as string) || '',
            }));
          }
        }

        // Case 2: Object with symbologyStack [{ image, text }]
        if (!validItems && jsonData && typeof jsonData === 'object' && Array.isArray(jsonData.symbologyStack)) {
          const stack = jsonData.symbologyStack;
          const isStackValid = stack.every((s) => typeof s === 'object' && typeof s.image === 'string' && typeof s.text === 'string');
          if (isStackValid) {
            validItems = stack.map((s) => ({
              legendTitle: s.text,
              symbolUrl: s.image,
              description: '',
            }));
          }
        }

        if (validItems) {
          if (onUpdateLegend) {
            onUpdateLegend(validItems);
            setHasLoadedData(true);
            setLoadedFileName(file.name);
            // Clear the file input to allow re-uploading the same file
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        } else {
          logger.logError('Invalid legend data format');
        }
      } catch (error) {
        logger.logError('Error parsing legend file:', error);
        // Optionally show an error message to the user
      }
    };
    reader.onerror = (): void => {
      logger.logError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleEditClick = (index: number): void => {
    setEditingIndex(index);
    setEditedItem({ ...legendList[index] });
  };

  const handleDeleteClick = (index: number): void => {
    const newList = legendList.filter((_, i) => i !== index);
    if (onUpdateLegend) {
      onUpdateLegend(newList);
    }
  };

  const handleInputChange = (field: keyof LegendItem, value: string): void => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        [field]: value,
      });
    }
  };

  const handleSaveEdit = (): void => {
    if (editingIndex !== null && editedItem) {
      const newList = [...legendList];
      if (editingIndex >= 0 && editingIndex < newList.length) {
        newList[editingIndex] = editedItem;
      } else {
        newList.push(editedItem);
      }
      if (onUpdateLegend) {
        onUpdateLegend(newList);
      }
      setEditingIndex(null);
      setEditedItem(null);
    }
  };

  return (
    <Box sx={sxClasses.legendCard}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button variant="contained" component="label" onClick={() => fileInputRef.current?.click()}>
            Load Legend
            <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
          </Button>
        </Box>
        {hasLoadedData && legendList.length > 0 && (
          <Box sx={{ alignSelf: 'center', color: 'text.secondary' }}>
            {legendList.length} item{legendList.length !== 1 ? 's' : ''} loaded
          </Box>
        )}
      </Box>

      {legendList.length > 0 ? (
        <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
          {legendList.map((legendItem: LegendItem, index: number) => (
            <Card
              key={`legend-item-${legendItem.legendTitle}-${legendItem.symbolUrl}`}
              sx={{
                mb: 2,
                position: 'relative',
                '&:hover .legend-actions': {
                  opacity: 1,
                  visibility: 'visible',
                },
              }}
            >
              <Box className="legend-item-container" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {legendItem.symbolUrl && (
                    <Box
                      component="img"
                      src={legendItem.symbolUrl}
                      alt=""
                      sx={{
                        width: 40,
                        height: 40,
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: 1,
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>{legendItem.legendTitle}</Box>
                    {legendItem.description && <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{legendItem.description}</Box>}
                  </Box>
                  <Box
                    className="legend-actions"
                    sx={{
                      display: 'flex',
                      gap: 1,
                      opacity: 0,
                      visibility: 'hidden',
                      transition: 'opacity 0.2s, visibility 0.2s',
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(index);
                      }}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(index);
                      }}
                      color="error"
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          {loadedFileName ? `Loaded: ${loadedFileName}` : 'No legend items. Load a legend file or add a new item.'}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editingIndex !== null && editedItem !== null}
        onClose={() => {
          setEditingIndex(null);
          setEditedItem(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingIndex !== null && editingIndex >= 0 ? 'Edit Legend Item' : 'Add New Legend Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Legend Title"
              value={editedItem?.legendTitle || ''}
              onChange={(e) => handleInputChange('legendTitle', e.target.value)}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Symbol URL"
              value={editedItem?.symbolUrl || ''}
              onChange={(e) => handleInputChange('symbolUrl', e.target.value)}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Description"
              value={editedItem?.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
              margin="dense"
            />
            {editedItem?.symbolUrl && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Box sx={{ fontWeight: 'medium', mb: 1 }}>Preview:</Box>
                <Box
                  component="img"
                  src={editedItem.symbolUrl}
                  alt="Symbol Preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 100,
                    border: '1px solid #ddd',
                    p: 1,
                    borderRadius: 1,
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditingIndex(null);
              setEditedItem(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {jsonContent && (
        <Box sx={{ mt: 3, p: 2, borderTop: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">JSON Content</Typography>
            {!isEditingJson ? (
              <Button variant="outlined" size="small" startIcon={<EditIcon fontSize="small" />} onClick={handleEditJson}></Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<SaveIcon fontSize="small" />}
                  onClick={handleSaveJson}
                ></Button>
                <Button variant="outlined" size="small" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
          {isEditingJson ? (
            <TextField
              fullWidth
              multiline
              minRows={8}
              maxRows={12}
              value={editedJson}
              onChange={handleJsonChange}
              variant="outlined"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                '& .MuiInputBase-root': {
                  p: 1,
                  bgcolor: 'background.paper',
                },
              }}
            />
          ) : (
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                maxHeight: '200px',
                overflow: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                fontSize: '0.75rem',
                lineHeight: 1.5,
              }}
            >
              {jsonContent}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
