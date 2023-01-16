import { useContext } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { IconButton } from '../../../ui';

const useStyles = makeStyles((theme) => {
  return {
    exportIcon: {
      fontSize: `14px !important`,
      color: `${theme.palette.primary.light}`,
    },
  };
});

/**
 * Footerbar Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export function FooterBarExportPngButton(): JSX.Element {
  const classes = useStyles();

  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  /**
   * Export the map as a PNG
   */
  function exportPNG(): void {
    document.body.style.cursor = 'progress';
    const { map } = api.map(mapId);

    map.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas');
      const size = map.getSize();
      // eslint-disable-next-line prefer-destructuring
      mapCanvas.width = size![0];
      // eslint-disable-next-line prefer-destructuring
      mapCanvas.height = size![1];
      const mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'), (canvas) => {
        if (canvas.width > 0) {
          const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
          mapContext!.globalAlpha = opacity === '' ? 1 : Number(opacity);
          let matrix;
          const { transform } = canvas.style;

          if (transform) {
            // Get the transform parameters from the style's transform matrix
            matrix = transform
              .match(/^matrix\(([^(]*)\)$/)[1]
              .split(',')
              .map(Number);
          } else {
            matrix = [parseFloat(canvas.style.width) / canvas.width, 0, 0, parseFloat(canvas.style.height) / canvas.height, 0, 0];
          }

          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
          const { backgroundColor } = canvas.parentNode.style;
          if (backgroundColor) {
            mapContext!.fillStyle = backgroundColor;
            mapContext!.fillRect(0, 0, canvas.width, canvas.height);
          }

          mapContext!.drawImage(canvas, 0, 0);
        }
      });

      mapContext!.globalAlpha = 1;
      mapContext!.setTransform(1, 0, 0, 1, 0, 0);

      try {
        const image = mapCanvas.toDataURL('image/png');
        const element = document.createElement('a');
        const filename = `${mapId}.png`;
        element.setAttribute('href', image);
        element.setAttribute('download', filename);
        element.click();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Error: ${err}`);
      }
    });
    document.body.style.cursor = 'auto';
    map.renderSync();
  }

  return (
    <IconButton id="export-button" tooltip="appbar.export" tooltipPlacement="bottom" type="button" onClick={() => exportPNG()} className="">
      <div className={classes.exportIcon}>
        <small>Export PNG</small>
      </div>
    </IconButton>
  );
}
