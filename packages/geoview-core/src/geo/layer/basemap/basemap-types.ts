/** ******************************************************************************************************************************
 *  Definition of the basemap options type.
 */
export type TypeBasemapOptions = {
  /** Id of the basemap to use. */
  id: 'transport' | 'osm' | 'simple' | 'nogeom';
  /** Enable or disable shaded basemap (if basemap id is set to shaded then this should be false). */
  shaded: boolean;
  /** Enable or disable basemap labels. */
  labeled: boolean;
};
