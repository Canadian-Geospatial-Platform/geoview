import { AppBar, Box, Container, Grid, Toolbar, Typography } from "@mui/material";

import Logo from '../assets/logo.png';
import { Link } from "react-router-dom";

function ListOfDemosPage() {

  return (
    <Container maxWidth="lg" sx={{ borderRightWidth: '1px', borderLeftWidth: '1px', borderColor: '#ccc' }}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <img src={Logo} alt="GeoView" style={{ height: 40, marginRight: 16 }} />{/* Adjust height and margin as needed */}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Canadian Geospatial Platform (CGP)
            </Typography>
          </Toolbar>
        </AppBar>

        <Grid container spacing={2} p={3}>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <h3>Sandbox</h3>
            <Link to="/general">Sandbox</Link>
            <Link to="/general">Config Sandbox</Link>

            <h3>General</h3>
            <Link to="/general">Default</Link>
            <Link to="/package-swiper">Package Swiper</Link>

            <h3>Basic Loading</h3>
            <Link to="/general">Default Configuration</Link>
            <Link to="/general">API loads</Link>
            <Link to="/general">Type Of Layers</Link>

            <h3>Custom Behavior</h3>
            <Link to="/general">Add Layers</Link>
            <Link to="/general">pygeoapi process</Link>
            <Link to="/general">UI Components</Link>
            <Link to="/general">Custom Config</Link>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <h3>API & Events</h3>
            <Link to="/general">API Functions Test</Link>
            <Link to="/general">Events</Link>
            <Link to="/general">Add Panels</Link>
            <Link to="/general">Geometry</Link>
            <Link to="/general">Footer bar (vanilla JS)</Link>


            <h3>API & Events</h3>
            <Link to="/general">Interactions (all-in)</Link>
            <Link to="/general">Select</Link>
            <Link to="/general">Draw</Link>
            <Link to="/general">Modify</Link>
            <Link to="/general">Translate</Link>
            <Link to="/general">Snap</Link>
            <Link to="/general">Extent</Link>

          </Grid>
        </Grid>

      </Box>
    </Container>
  )
}

export default ListOfDemosPage;