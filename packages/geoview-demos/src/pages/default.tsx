import { CGPVProvider } from '../providers/cgpvContextProvider/CGPVContextProvider';
import GeoViewMap from '../components/GeoViewMap';
import { DEFAULT_CONFIG } from '../constants';

function DefaultPage() {
  return (
    <CGPVProvider>
      <GeoViewMap config={DEFAULT_CONFIG}/>
    </CGPVProvider>
  );
}

export default DefaultPage;
