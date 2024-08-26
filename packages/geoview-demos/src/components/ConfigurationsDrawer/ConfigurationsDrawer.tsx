import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MapInteractive from './MapInteractive/MapInteractive';
import { ConfigBuilderTab } from './ConfigBuilderTab/ConfigBuilderTab';

interface ConfigurationDrawerProps {
  showConfigsList?: boolean;
}

export default function ConfigurationDrawer(props: ConfigurationDrawerProps) {
  const [selectedTab, setSelectedTab] = useState('settings');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1', bgcolor: '#f5f5f5', minHeight: {md: '100vh'} }}>
      <TabContext value={selectedTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label="handling tabs change" variant="scrollable" scrollButtons="auto">
            <Tab icon={<SettingsIcon />} aria-label="settings" value="settings" />
            <Tab icon={<ListAltIcon />} aria-label="Features" value="features" />
          </TabList>
        </Box>
        <TabPanel value="settings" sx={{ padding: 0 }}>
          <MapInteractive showConfigsList={props.showConfigsList} />
        </TabPanel>
        <TabPanel value="features">
          <ConfigBuilderTab />
        </TabPanel>
      </TabContext>
    </Box>
  );
}
