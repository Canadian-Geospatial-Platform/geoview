import OLAttribution, { Options } from 'ol/control/Attribution';

/**
 * Custom Attribution control that extends Openlayers Attribution control.
 * Class adds title to attribution text to show a tooltip when mouse is over it.
 *
 * @class CustomAttribution
 */
export class CustomAttribution extends OLAttribution {
  attributions: string[] = [];

  mapId: string;

  /**
   * Constructor that enables attribution text tooltip.
   *
   * @param {Options} optOptions control options
   */
  constructor(optOptions: Options, mapId: string) {
    const options = optOptions || {};

    super(options);

    this.mapId = mapId;
  }

  /**
   * Format the attribution element by removing duplicate
   */
  formatAttribution() {
    // find ul element in attribution control
    const ulElement = this.element.getElementsByTagName('UL')[0];
    const compAttribution: string[] = [];

    if (ulElement) {
      // find li elements in ul element
      const liElements = ulElement.getElementsByTagName('LI');

      if (liElements && liElements.length > 0) {
        // add title attribute to li elements
        for (let liElementIndex = 0; liElementIndex < liElements.length; liElementIndex++) {
          const liElement = liElements[liElementIndex] as HTMLElement;
          const attributionText = liElement.innerText;

          // if elemetn doat not exist, add. Otherwise remove
          if (!compAttribution.includes(attributionText.toLowerCase().replaceAll(' ', ''))) {
            this.attributions.push(attributionText);
            compAttribution.push(attributionText.toLowerCase().replaceAll(' ', ''));
          } else {
            liElement.remove();
          }
        }
      }
    }
  }
}