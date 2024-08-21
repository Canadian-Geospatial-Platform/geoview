import { CGPVProvider } from '../providers/cgpvContextProvider/CGPVContextProvider';
import App from '../components/App';


function DefaultPage() {

  return (
    <CGPVProvider>
      <App />
    </CGPVProvider>
  );
}

export default DefaultPage;
