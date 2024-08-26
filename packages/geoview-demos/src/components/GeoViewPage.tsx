import { CGPVProvider } from '../providers/cgpvContextProvider/CGPVContextProvider';

interface GeoViewPageProps {
  children?: React.ReactNode;
}

function GeoViewPage({ children }: GeoViewPageProps) {  
  return (
    <CGPVProvider>
      {children}
    </CGPVProvider>
  );
}

export default GeoViewPage;
