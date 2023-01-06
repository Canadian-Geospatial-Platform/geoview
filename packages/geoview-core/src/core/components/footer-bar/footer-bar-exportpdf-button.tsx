import { useContext } from 'react';

import { jsPDF as JsPdf } from 'jspdf';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { IconButton } from '../../../ui';

const useStyles = makeStyles((theme) => {
  return {
    exportIcon: {
      fontSize: `${theme.typography.fontSize}px !important`,
      color: `${theme.palette.primary.light}`,
    },
  };
});

/**
 * Footerbar Export PDF Button component
 *
 * @returns {JSX.Element} the export button
 */
export function FooterBarExportPdfButton(): JSX.Element {
  const classes = useStyles();

  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  /**
   * Export the map as a PDF
   */
  function exportPDF(): void {
    document.body.style.cursor = 'progress';
    const { map } = api.map(mapId);
    const viewResolution = map.getView().getResolution();
    const size = map.getSize();
    // dpi of exported map
    const dpi = 200;
    // Width and height in pixels for A4 size at given dpi
    const width = Math.round(dpi * 11.69);
    const height = Math.round(dpi * 8.27);

    map.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = width;
      mapCanvas.height = height;
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
      const pdf = new JsPdf('landscape', undefined, 'A4');
      const filename = `${mapId}.pdf`;

      try {
        pdf.addImage(mapCanvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 297, 210);
        pdf.save(filename);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Error: ${err}`);
      }

      map.setSize(size);
      map.getView().setResolution(viewResolution);
    });
    // Set print size
    const printSize = [width, height];
    map.setSize(printSize);
    const scaling = Math.min(width / size![0], height / size![1]);
    map.getView().setResolution(viewResolution! / scaling);
    document.body.style.cursor = 'auto';
  }

  return (
    <IconButton
      id="exportPDF-button"
      tooltip="appbar.export"
      tooltipPlacement="bottom"
      type="button"
      onClick={() => exportPDF()}
      className=""
    >
      <div className={classes.exportIcon}>
        <small>PDF</small>
      </div>
    </IconButton>
  );
}
