import React, { useContext, useEffect } from 'react';
import { AppBar, Box, Button, CssBaseline, Drawer, Grid, IconButton, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ConfigurationDrawer from './ConfigurationsDrawer/ConfigurationsDrawer';
import { ConfigTextEditor } from './ConfigTextEditor';
import { CGPVContext } from '../providers/cgpvContextProvider/CGPVContextProvider';
import { MapRenderer } from './MapRenderer';
import { DEFAULT_CONFIG } from '../constants';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { CodeSnippet } from './CodeSnippet';

interface GeoViewMapProps {
  showConfigsList?: boolean;
  showConfigEditor?: boolean;
  config: string | object;
  configIsFilePath?: boolean;
  codeSnippet?: string;
  children?: React.ReactNode;
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  
}

function GeoViewMap(props: GeoViewMapProps) {
  const cgpvContext = useContext(CGPVContext);
  const navigate = useNavigate();

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { initializeMap, isInitialized } = cgpvContext;
  const {
    showConfigsList,
    showConfigEditor = true,
    config = DEFAULT_CONFIG,
    configIsFilePath,
    codeSnippet,
    children
  } = props;

  const drawerWidth = 440;

  //when component is mounted, initialize the map
  useEffect(() => {
    if (!isInitialized) {
      initializeMap('sandboxMap3', config, configIsFilePath);
    }
  }, []);

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState('map');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const renderBodyContent = () => {
    return (
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange} aria-label="handling tabs change">
            <Tab label="Map" value="map" />
            {showConfigEditor && <Tab label="Config Editor" value="config-editor" />}
            {codeSnippet && <Tab label="Code Snippet" value="code-snippet" />}
          </Tabs>
        </Box>
        <Box sx={{ display: selectedTab === 'map' ? 'unset' : 'none' }}>
          <MapRenderer />
        </Box>

        {showConfigEditor && <Box sx={{ marginTop: '20px', display: selectedTab === 'config-editor' ? 'unset' : 'none' }}>
          <ConfigTextEditor />
        </Box>
        }
        {codeSnippet && <Box sx={{ marginTop: '20px', display: selectedTab === 'code-snippet' ? 'unset' : 'none' }}>
          <CodeSnippet code={codeSnippet} />
        </Box>
        }
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleBackToHome}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Canadian Geospatial Platform (CGP) - GeoView Project
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="settings panel">
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            bgcolor: '#f4f4f4',
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <ConfigurationDrawer showConfigsList={showConfigsList} />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            bgcolor: '#f4f4f4',
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          <ConfigurationDrawer showConfigsList={showConfigsList}  />
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, pt: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {props.top}
        {children}
        {renderBodyContent()}
        {props.bottom}
      </Box>
    </Box>
  );
}

export default GeoViewMap;
