import { CGPVContext } from '../providers/cgpvContextProvider/CGPVContextProvider';
import GeoViewMap from '../components/GeoViewMap';
import { DEFAULT_CONFIG } from '../constants';
import { useContext } from 'react';
import GeoViewPage from '../components/GeoViewPage';
import { Button } from '@mui/material';

function PackageSwiperPage() {

  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { mapId } = cgpvContext;

  const codeSnippet = `function addSwiper() {
      cgpv.api.maps['mapWM3'].plugins['swiper'].activateForLayer(document.getElementById('mapWM3Input').value);
    }

    function removeSwiper() {
      cgpv.api.maps['mapWM3'].plugins['swiper'].deActivateForLayer(document.getElementById('mapWM3Input').value);
    }

    function removeSwiperAll() {
      cgpv.api.maps['mapWM3'].plugins['swiper'].deActivateAll();
    }`;

  const renderTop = () => {
    const addSwiper = () => {
    }

    const removeSwiper = () => {
    }

    const removeSwiperAll = () => {
    }
    return (
      <div>
        <input type="text" id="mapWM3Input" placeholder="Layer ID" />
        <Button variant="contained" size="small" sx={{mx: 1}} color='secondary' onClick={addSwiper}>Add Swiper</Button>
        <Button variant="contained" size="small" sx={{mx: 1}} color='secondary' onClick={removeSwiper}>Remove Swiper</Button>
        <Button variant="contained" size="small" sx={{mx: 1}} color='secondary' onClick={removeSwiperAll}>Remove All Swipers</Button>
      </div>
    );
  }

  const renderBottom = () => {
    return (
      <div>
        <p>
          I am the bottom section
        </p>
      </div>
    );
  }

  return (
      <GeoViewMap 
      config={`package-swiper3-config.json`} 
      configIsFilePath={true}
      showConfigsList={false} 
      codeSnippet={codeSnippet} top={renderTop()} bottom={renderBottom()}>
        <p>
          I am the children section
        </p>
      </GeoViewMap>
  );
}

export default PackageSwiperPage;
