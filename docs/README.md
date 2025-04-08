# DOC OVERVIEW

The idea for this folder is collect dev-friendly documentation for the moment.

This folder would contain things that answer these types of questions:

- How do I use X?
- What can X do?
- How is X expected to behave?
- What is recommended approach for doing X?

Once the project matures, these docs can be the basis of official public docs, help documentation, etc.

## How we do things

- [Programming Best Practices](./programming/best-practices.md)
- [Programming with TypeScript](./programming/using-type.md)
- [Programming with store](./programming/using-store.md)
- [Programming with logs](./programming/logging.md)

## How the application works

- [GoeView layer documentation](./app/geoview-layer/README.md)
- [Theme](./app/ui/theming.md)
- [Events documentation](./app/event/README.md)
- [Accessing types](./app/accessing-types.md)
- [Accessibility](./app/accessibility.md)
- [Components vs Core Packages vs External Packages](./app/components-packages.md)
- [Packages](./app/packages.md)
- [Load maps](./app/loading-maps.md)

## API ACCESS TO MAP DEPRECATED ##

The api.maps array is now private and only accessible from the api. The ```cgpv.api.maps``` is not available anymore. To access and interact with the maps, new functions have been added.

- How to get a list of maps available
>  /**
>   * Gets the list of all map IDs currently in the collection.
>   *
>   * @returns {string[]} Array of map IDs
>   */
>  getMapViewerIds(): string[]

- How to access a map by id
>  /**
>   * Gets a map viewer instance by its ID.
>   *
>   * @param {string} mapId - The unique identifier of the map to retrieve
>   * @returns {MapViewer} The map viewer instance if found
>   * @throws {Error} If the map with the specified ID is not found
>   */
>  getMapViewer(mapId: string): MapViewer

- How to delete a map instance
>  /**
>   * Delete a map viewer instance by its ID.
>   *
>   * @param {string} mapId - The unique identifier of the map to delete
>   * @param {boolean} deleteContainer - True if we want to delete div from the page
>   * @returns {Promise<HTMLElement>} The Promise containing the HTML element
>   */
>  deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<HTMLElement | void> {

```
if (cgpv.api.hasMapViewer(map)) {
            cgpv.api.deleteMapViewer(map, false).then(() => {
              resolve();
            });
          } else {
            resolve();
          }
```

- How to know if a map exist
>  /**
>   * Return true if a map id is already registered.
>   *
>   * @param {string} mapId - The unique identifier of the map to retrieve
>   * @returns {boolean} True if map exist
>   */
>  hasMapViewer(mapId: string): boolean

A call witht he old version would look like ```cgpv.api.maps['Map1'].layer.addGeoviewLayerByGeoCoreUUID(layer)``` will now look like this ```cgpv.api.getMapViewer('Map1').layer.addGeoviewLayerByGeoCoreUUID(layer)```