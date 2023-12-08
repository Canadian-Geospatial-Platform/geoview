import { useTheme } from '@mui/material/styles';

import { IconButton, MoveDownRoundedIcon } from '@/ui';
import { getSxClasses } from '../nav-bar-style';
import { useGeoViewMapId } from '@/app';

/**
 * Create a focus button to the footer
 *
 * @returns {JSX.Element} return the created zoom in button
 */
export default function Focus(): JSX.Element {
  const mapId = useGeoViewMapId();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const handleFocus = () => {
    const focusButtonId = document.getElementById(`focuseToMap${mapId}`);
    if (focusButtonId) {
      const yOffset = -30;
      const targetY = focusButtonId.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    }
  };

  return (
    <IconButton id={`focuseToMap${mapId}`} tooltip="Focus to footer" tooltipPlacement="left" onClick={handleFocus} sx={sxClasses.navButton}>
      <MoveDownRoundedIcon />
    </IconButton>
  );
}
