=1!loadingStatus=

# Map Interaction & Loading Status

<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

These visual cues and navigation behaviors help ensure a smooth and intuitive map experience.

### First Load

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

When the map viewer is first initialized, a loading spinner will appear over the map area. This indicates that the minimum required components are being loaded. Once these components are successfully initialized, the spinner will disappear, revealing the map.

While the map layers are loading for the first time, a progress bar will be displayed at the bottom of the map. During this initial loading phase, some map functionalities —such as exporting the map— may not behave as expected until all layers have fully loaded. We recommend avoiding intensive actions until the loading is complete.

In the **Legend** or **Layers** panel, each layer displays a spinner icon on the left (in place of the standard layer icon) while it is loading. Once a layer is fully processed and rendered for the first time, the spinner will be replaced with the layer’s corresponding icon.

### Layers reloading

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Any time the map is **panned** or **zoomed**, certain layers may re-enter a loading state. When this occurs:

- In the **Layers** tab, each loading layer's box in the layer list (left section) will turn green with a progress bar at the bottom.
- In the **Legend** tab, a progress bar will appear below the layer's group name and controls.
- An additional progress bar will also be shown at the bottom of the map area, just above the Map Information Bar, as long as at least one layer is still loading.

### User Notifications and Map Status Feedback

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

At any time, the viewer provides feedback about ongoing activity by:

Displaying a message at the bottom of the map, and/or

Adding a notification accessible through the Notification panel in the sidebar. When a new notification is added, a red counter appears and increments to indicate an update.

### Switching Focus

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

You can switch focus between the map and footer sections:

- **To focus the map**: Click the Side Bar or the Map Information Bar.
- **To focus the footer**: If your map includes a Footer Bar, click on it to display its content.

=1!navigationControls=

# Navigation Controls

<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

Navigation controls provide adjustments to the viewing extent, projection, rotation, or basemap of the map.

Depending on the viewer configuration, the map's bottom right corner contains the following navigation controls:

| Symbol                                                                                                      | Name              | Description                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![An icon representing the "Fullscreen" function]({{assetsURL}}/img/guide/navigation/fullscreen.svg)        | Fullscreen        | Full screen presents map content using the entire page. Full screen toggles between the entire page and the initial size of the map.                                                                                                      |
| ![An icon representing the "Zoom in" function]({{assetsURL}}/img/guide/navigation/plus.svg)                 | Zoom in           | Zoom in one level on the map to see more detailed content - bound to Plus key (+).                                                                                                                                                        |
| ![An icon representing the "Zoom out" function]({{assetsURL}}/img/guide/navigation/minus.svg)               | Zoom out          | Zoom out one level on the map to see less detailed content - bound to Minus key (-).                                                                                                                                                      |
| ![An icon representing the "Map Rotation" function]({{assetsURL}}/img/guide/navigation/360.svg)             | Map Rotation      | Control map rotation with a slider from -180° to +180°. The panel includes a **Fix North** toggle (available for LCC projection) to keep the map oriented with north at the top, and a reset button to return to the initial orientation. |
| ![An icon representing the "Geolocation" function]({{assetsURL}}/img/guide/navigation/geolocation.svg)      | Geolocation       | Zoom and pan to your current geographical location.                                                                                                                                                                                       |
| ![An icon representing the "Initial extent" function]({{assetsURL}}/img/guide/navigation/home.svg)          | Initial extent    | Zoom and pan map such that initial extent is visible.                                                                                                                                                                                     |
| ![An icon representing the "Change Basemap" function]({{assetsURL}}/img/guide/navigation/basemapSelect.svg) | Change Basemap    | Change the basemap.                                                                                                                                                                                                                       |
| ![An icon representing the "Change Projection" function]({{assetsURL}}/img/guide/navigation/projection.svg) | Change Projection | Change the map projection between Web Mercator and LCC.                                                                                                                                                                                   |

You can also pan the map by using your left, right, up and down arrow keys, or by click-holding on the map and dragging. Using the mouse scroll wheel while hovering over the map will zoom the map in/out.

Press the **Shift** key while click-holding and dragging the mouse to define a map extent region. When the mouse button is released, the view will zoom to the chosen area.

Press **Shift** and **Alt** keys while click-holding and dragging the mouse to rotate the map.

_Note: The map must be focused for key binding to work._

=2!overviewMap=

### Overview Map

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Depending on the viewer configuration, the map may provide an overview map, a generic representation of the main map at a reduced size. It is located in the upper-right corner of the map.

<img src="{{assetsURL}}/img/guide/navigation/overview.png" alt="Overview map displayed in the upper-right corner of the main map" style="max-width: 500px;"/>

Click-hold on the box in the overview map and drag it to change the extent of the main map. Clicking on the toggle icon in the top right corner of the overview map will expand or contract it.

=2!keyboardNavigation=

### Keyboard Navigation

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Keyboard functionality is provided as an alternative for users who are unable to use a mouse. Use the **Tab** key to navigate forward to links and controls on the page. Press **Shift** and **Tab** keys to go back one step. Use the **Enter** or **Spacebar** keys to activate links and controls.

Using the **Tab** key to navigate to the map and the **Keyboard Navigation** prompt will appears. Select Enable and press Enter to use keyboard navigation.

When the map gains focus, a crosshair is displayed in the center of the map:

<img src="{{assetsURL}}/img/guide/navigation/crosshair.svg" alt="Crosshair marker displayed in the center of the map for keyboard navigation" style="width: 90%; height: 100px;"/>

Use the **arrow** keys to move the map and **+** / **-** keys to zoom in and out. Press **Enter** to select a feature under the crosshairs and display associated data in the Details panel.

Information will be shown for supported features when the crosshair is positioned over them.

Press **CTRL** and **Q** to exit keyboard navigation.

_Note: The map must be focused for key binding to work. The map has focus when the crosshairs marker is present._

**Accessibility**

This map is not fully compliant with Web Content Accessibility Guidelines (WCAG) 2.0 Level AA.

=1!mapInformationBar=

# Map Information Bar

<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

Click the up chevron icon ![]({{assetsURL}}/img/guide/navigation/chevron_up.svg) on the left to expand/collapse the bar.

The following navigation details and functionalities are accessible in the Map Information Bar (expansion of the bar is required to view all options):

| Symbol                                                                                                        | Name                    | Description                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![An icon representing the "Attributes" function]({{assetsURL}}/img/guide/navigation/attribute.svg)           | Attributes              | Copyright and other map attributes.                                                                                                                                                                                                                                      |
|                                                                                                               | Positioning coordinates | Click on the positioning coordinates to toggle between degrees minutes seconds (DMS), decimal degrees or projected coordinates.                                                                                                                                          |
|                                                                                                               | Map scale               | Click on the map scale to toggle between scale and resolution.                                                                                                                                                                                                           |
| ![An icon representing the "Rotation indicator" function]({{assetsURL}}/img/guide/navigation/north_arrow.svg) | Rotation indicator      | Displays current map rotation angle. Hover over the north arrow icon to see a tooltip showing the map rotation and projection-based rotation component. This is an informational display; use the **Map Rotation** button in the navigation controls to adjust rotation. |

=1!sidebar=

# Side Bar

<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

The Side Bar, located on the left side of the map, provides access to the available tools and features.

_The tools displayed may vary depending on how the map is configured._

_Note: Some tools in the Side Bar are also available as tabs in the Footer Bar, such as **Legend**, **Layers**, **Data Table** or **Details**. **Legend** and **Details** opened from the Side Bar are displayed on the map, in a condensed 'mobile' view (single column). The same tool opened from a tab in the Footer Bar is displayed below the map in a fully expanded view._

| Symbol                                                                                                  | Name                             | Description                                                                              |
| ------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| ![An icon representing the "Geolocator" function]({{assetsURL}}/img/guide/geosearch/geolocator.svg)     | [Geolocator](#geolocatorSection) | Click the geolocator icon and an input field for search keywords will appear on the map. |
| ![An icon representing the "Legend" function]({{assetsURL}}/img/guide/sidebar/legend.svg)               | Legend                           | Legend of map icons (_see Footer Bar section for help_).                                 |
| ![An icon representing the "Layers" function]({{assetsURL}}/img/guide/footer/layers_30.svg)             | Layers                           | Tools to interact with layers (_see Footer Bar section for help_).                       |
| ![An icon representing the "Details" function]({{assetsURL}}/img/guide/sidebar/details.svg)             | Details                          | Details for selected features (_see Footer Bar section for help_).                       |
| ![An icon representing the "Data" function]({{assetsURL}}/img/guide/footer/data_table.svg)              | Data                             | Table of all features (_see Footer Bar section for help_).                               |
| ![An icon representing the "Guide" function]({{assetsURL}}/img/guide/sidebar/guide.svg)                 | Guide                            | Help guide.                                                                              |
| ![An icon representing the "Download" function]({{assetsURL}}/img/guide/sidebar/export.svg)             | [Download](#exportSection)       | Download the map as PNG, JPEG, or PDF. Disabled while layers are loading.                |
| ![An icon representing the "Notifications" function]({{assetsURL}}/img/guide/sidebar/notifications.svg) | Notifications                    | Display messages and notifications for the map.                                          |
| ![An icon representing the "About Geoview" function]({{assetsURL}}/img/guide/sidebar/about.svg)         | About Geoview                    | Display information about Geoview viewer.                                                |

=2!geolocator=

<a id="geolocatorSection">

### <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" alt="Geolocator icon" width="30"/> Geolocator

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

The geolocator component functions to allow users to search for places in Canada. When the geolocator icon ![]({{assetsURL}}/img/guide/geosearch/geolocator.svg) in the Side Bar is clicked, an input field for search keywords will appear on the map:

<img src="{{assetsURL}}/img/guide/geosearch/searchbar_en.png" alt="Geolocator search bar with input field for searching locations" style="max-width: 500px;"/>

=3!supportedSearchTypes=

#### Supported Search Types

**Keyword search**: Type any keyword into geolocator search bar to display a list of results that contains the keyword (minimum 3 characters).

- each search result consists of: location name (with keyword highlighted), location province, and location category (lake, city, town, etc.)
- click on any individual result to mark its coordinates and zoom the map to center around this location

**FSA search**: A **forward sortation area (FSA)** is a way to designate a geographical area based on the first three characters in a Canadian postal code. All postal codes that start with the same three characters are considered an **FSA**.

- click to zoom and center the map on the FSA
- example: type in **M3H**

**Latitude/Longitude search**: Search using lat/long coordinates to display a list of results in the vicinity of that map point.

- similarly to FSA search, the first result will be a location of those coordinates entered, click this to zoom and center the map on the map point
- lat/long search recognizes spaces, commas, semicolons, or vertical bars (|) to separate the co-ordinates
- example: type in **54.3733,-91.7417**

**NTS search**: **National Topographic System (NTS)** is a system used for providing general topographic maps of the country, producing details on landforms, lakes/rivers, forests, roads and railways, etc.

- the NTS is split into three major zones: "Southern zone" - latitudes between 40°N and 68°N, "Arctic zone" - latitudes between 68°N and 80°N, and the "High Arctic zone" - latitudes between 80°N and 88°N
- an NTS map number consists of a string containing a number identifying a map sheet, a letter identifying a map area, and a number identifying the scale map sheet
- likewise, the first result will be a location of the NTS map number, click to center map on this area
- example: type in **030M13**

**Street address**: Search using direct street addresses should return results

=3!geosearchFiltering=

#### Geosearch Filtering

When searching for a location, a results panel will appear below the search box. This results panel contains two dropdown boxes that allow you to filter the search results by their **province** and by their **category** (lake, town, river, etc.). To the right of these two boxes is a ![]({{assetsURL}}/img/guide/geosearch/clear.svg) button, which when clicked clears the selected filter options.

=2!export=

<a id="exportSection">
### <img src="{{assetsURL}}/img/guide/sidebar/export.svg" alt="Download icon" width="30"/> Download

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

You can download an image of the map and its visible layers along with a legend, title, north arrow, scalebar, and a timestamp.

**Note:** The Download button is disabled while layers are loading. It becomes enabled once all layers have fully loaded.

Once the **Download** button is clicked, a dialog will appear with the following options:

**Dialog Options:**

| Option           | Location           | Description                                                                                                   |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Map Title        | Upper center       | Enter an optional title to display at the top of your map image.                                              |
| Image Format     | Lower right corner | Choose from three formats: **PNG**, **JPEG**, or **PDF**.                                                     |
| Resolution (DPI) | Lower right corner | Select the image resolution. Higher resolution produces larger, more detailed images.                         |
| Quality (JPEG)   | Lower right corner | When JPEG is selected, adjust the image quality. Higher quality produces better images but larger file sizes. |

Click the **Download** button at the bottom of the dialog to generate and download the final map image.

=1!footerPanel=

# Footer Bar

<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>
<a id="footerSection"></a>
The _Footer Bar_ appears below the map. The _Footer Bar_ can be expanded or collapsed by clicking on a tab in the _Footer Bar_ menu bar. To collapse the panel, simply click again on the active tab.

**To switch between the map and the footer section, click on the Map Information Bar to bring the map into view, or click on the Footer Bar to display its content.**

_The tabs displayed may vary depending on how the map is configured._

The _Footer Bar_ menu bar has the following tabs:

- [Legend](#legendSection)
- [Layers](#layersSection)
- [Details](#detailsSection)
- [Data Table](#dataTableSection)
- [Time Slider](#timeSliderSection)
- [Chart](#chartSection)
- Guide

_Note: Some tabs in the Footer Bar are also available as tools in the Side Bar, such as **Legend**, **Layers**, **Data Table** or **Details**. **Legend** and **Details** opened from the Side Bar is displayed on the map, in a condensed 'mobile' view. The same tab opened in the Footer Bar is displayed below the map in a fully expanded view._

=2!legend=

<a id="legendSection"></a>

<h3><img src="{{assetsURL}}/img/guide/sidebar/legend.svg" alt="Legend icon" width="30"> Legend <a href="#footerSection">Top</a></h3>
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

The **Legend** tab displays the symbology associated with the layers displayed on the map.

Each layer has some symbology associated with it. For simple feature layers a single icon ![]({{assetsURL}}/img/guide/footer/icon_single.png) will be present next to the layer name.

For complex feature layers (i.e. those with multiple symbols used per layer) the icon will show as a stack ![]({{assetsURL}}/img/guide/footer/icon_multiple.png) (hover to reveal more than one icon).

The symbology for the layer can be toggled open and closed which is expanded beneath the layer name. Some layers may optionally have a graphical legend defined, if one is present it will be displayed in the same drop down manner.

When a layer has multiple symbols, you can toggle visibility for individual items by clicking on the item's label or the gray bar to the left of it. A dark grey bar indicates the item is visible, while a light grey bar indicates it is not visible.

| Symbol                                                                                                        | Name                   | Description                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| ![An icon representing the "Link to layer" function]({{assetsURL}}/img/guide/footer/layers_30.svg)            | Show in Layers panel   | Navigate to the corresponding layer in the Layers panel.                                                                                      |
| ![An icon representing the "Zoom to visible scale" function]({{assetsURL}}/img/guide/layers/scaleVisible.svg) | Zoom to visibile scale | Zoom to the visible scale of the layer, moving the map may be necessary to locate features. _Note: Only available when layer is out of zoom_. |
| ![An icon representing the "Toggle visibility" function]({{assetsURL}}/img/guide/footer/view_25.svg)          | Toggle visibiity       | Toggle the layer visibility.                                                                                                                  |
| ![An icon representing the "Highlight" function]({{assetsURL}}/img/guide/layers/highlight_60.svg)             | Highlight              | Brings layer to the top, decreases opacity of other layers and displays layer boundary.                                                       |
| ![An icon representing the "Zoom to layer boundary" function]({{assetsURL}}/img/guide/layers/zoom_60.svg)     | Zoom to layer boundary | Pans and zooms the map so that the layer boundary is in view.                                                                                 |

_Note: When the layer is hidden, functions affecting the layer on the map will be disabled, and the layer text will be grey and in italics._

=2!layers=

<a id="layersSection"></a>

### ![]({{assetsURL}}/img/guide/footer/layers_30.svg) Layers [Top](#footerSection)

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

The **Layers** tab has the following submenu options:

- View
- Add
- Sort
- Remove

=3!view=

#### ![]({{assetsURL}}/img/guide/footer/view_25.svg) View

_**Note: Click on a layer to display its Layer information in the right section.**_

**Important Information**  
If a layer's visibility (eye) icon is disabled (greyed out) ![]({{assetsURL}}/img/guide/footer/eye_disabled.svg) and the Zoom to Visible Scale icon <img src="{{assetsURL}}/img/guide/layers/scaleVisible.svg" alt="Zoom to visible scale icon" /> is visible, this means the layer is not visible at the current map zoom level.

- Clicking the Zoom to Visible Scale button will adjust the map to the appropriate zoom level, making the layer visible.
- However, after zooming, you may not immediately see any features if there is no data within the current view extent.
- In this case, you may need to pan the map to locate the features.

The _View_ submenu option under the _Layers_ tab consists of two sections. The left section lists all the layers displayed on the map. Click on a layer and the right section lists will show the layer settings (available options for that layer).

**Layer Icons**

Each layer has some symbology associated with it. For simple feature layers a single icon ![]({{assetsURL}}/img/guide/footer/icon_single.png) will be present next to the layer name. For complex feature layers (i.e. those with multiple symbols used per layer) the icon will show as a stack (hover to reveal more than one icon ![]({{assetsURL}}/img/guide/footer/icon_multiple.png)).

**Group Layers**

The group layer icon ![]({{assetsURL}}/img/guide/layers/group.svg) denotes a group of layers. Click on the group layer to expand the list of sublayers. Sublayers may also be group layers.

**Layer Visibility**

Select the eye icon, next to each layer, to toggle visibililty on ![]({{assetsURL}}/img/guide/footer/eye.svg) or off ![]({{assetsURL}}/img/guide/footer/eye_not_visible.svg).

Layers that are not currently displayed on the map will be greyed out and their text will be in italics.

For layers that are always displayed, or for layers whose parent layer is hidden, the visibility (eye) icon is disabled (greyed out) ![]({{assetsURL}}/img/guide/footer/eye_disabled.svg).

**Supported Layer Types**

Layers can either be in raster format or vector format. The following layer types are supported.

| Raster Layers      | Vector Layers         |
| ------------------ | --------------------- |
| ESRI Dynamic       | ESRI Feature          |
| ESRI Image         | GeoJSON               |
| XYZ Tile           | OGC Feature API Layer |
| WMS                | CSV                   |
| Static Image       | WFS                   |
| Vector tiles layer |

_Note: If a layer fails to load correctly it will be identified by an error notice in the notifications tool on the Side Bar. Instead of the standard layer actions you can select to either reload the layer (this is particularly helpful if there is a temporary network connectivity issue) or remove the layer. If a layer is removed it will be taken out of the layer selector completely._

=3!layerSettings=

#### Layer Settings

Click a layer in the left section of the layers view tab, and the layer settings are displayed in right section.

_Note: Some settings may not be available depending on various factors such as layer type or configuration._

| Symbol                                                                                                  | Name                      | Description                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![An icon representing the "Table details" function]({{assetsURL}}/img/guide/layers/table_view_60.svg)  | Table details             | Opens a basic table view with simplified functionality. For the full-featured advanced table, if available, access the Data Table panel directly or open it from within the basic table. |
| ![An icon representing the "Time Slider" function]({{assetsURL}}/img/guide/layers/time_slider_30.svg)   | Show in Time Slider panel | Opens the Time Slider panel for this layer, allowing you to visualize temporal data.                                                                                                     |
| ![An icon representing the "Reset layer" function]({{assetsURL}}/img/guide/layers/refresh_60.svg)       | Reset layer               | Reset the layer to its initial state.                                                                                                                                                    |
| ![An icon representing the "Highlight layer" function]({{assetsURL}}/img/guide/layers/highlight_60.svg) | Highlight layer           | Brings layer to the top, decreases opacity of other layers and displays layer boundary.                                                                                                  |
| ![An icon representing the "Zoom to layer" function]({{assetsURL}}/img/guide/layers/zoom_60.svg)        | Zoom to layer             | Pans and zooms the map so that the layer boundary is in view.                                                                                                                            |
| Slider                                                                                                  | Opacity                   | Slider to increase/decrease layer opacity.                                                                                                                                               |

_Note: When the layer is hidden, functions affecting the layer on the map will be disabled._

**Layer Classes**

Classes for the layer are listed in the layer settings if available. Checked the checkbox next to the class to toggle visibiity for this particular class.

The number of classes visible is displayed under the layer name.

**More Information**

Additional technical details about the layer are displayed in this section, which may include:

- **Type**: The layer type (e.g., ESRI Dynamic Service, GeoJSON, WMS)
- **Service projection**: The coordinate reference system used by the service (e.g., EPSG:3978, EPSG:3857)
- **Temporal dimension**: If the layer has time-based data, this shows the field name and the minimum/maximum date range
- **Resource**: The URL or path to the data source

**Attribution**

If attribution information is available for the layer, it will be displayed in this section. Attribution typically includes copyright notices, data sources, and acknowledgments required by the data provider.

=3!add=

#### ![]({{assetsURL}}/img/guide/layers/add_25.svg) Add

Additional layers can be added to the map viewer through the _Add_ submenu in the **Layers** tab.

Usage:

- If you wish to add a file, you can do so by dragging the file over the import wizard, by clicking on the 'Choose a File' button and selecting the file, or by providing the URL to the file.
- Accepted file types are GeoJSON files (.json or .geojson), GeoPackages (.gpkg), comma separated value files (.csv) with coordinate values, shapefiles (.shp), or ZIP files (.zip) containing a shapefile.
- If you wish to add a service, you can do so by entering the service URL into the text box.
- Click the 'Continue' button to proceed.
- Ensure the the correct file or service type is selected from the dropdown menu. If the wrong type is selected, an error will be displayed prompting you to try a different type.
- Click the 'Continue' button to proceed. The file type (eg. CSV) may be displayed.
- Depending on the type of dataset being loaded, various parameters can be set in this final phase.
- Click the 'Continue' button to insert the layer into the map.

The viewer will automatically switch to the view function.

=3!sort=

#### ![]({{assetsURL}}/img/guide/layers/sort_25.svg) Sort

To sort the layers you can simply click the up or down arrows on each layer panel.

=3!remove=

#### ![]({{assetsURL}}/img/guide/layers/remove_25.svg) Remove

To remove a layer, click on the delete icon ![]({{assetsURL}}/img/guide/layers/remove_25.svg) to the right of the layer after selecting the 'Remove' submenu.

=2!details=

<a id="detailsSection"></a>

### ![]({{assetsURL}}/img/guide/sidebar/details_30.svg) Details [Top](#footerSection)

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**Note: A feature on the map must be selected to enable the layer in the list. Otherwise layers are disabled (greyed out).**_

The **Details** tab has two sections: a layer list on the left and feature details on the right.

**How to Use:**

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

1. **Click on the map** to query features at that location
2. Layers with features at the clicked location will be enabled in the left section, showing the number of features found
3. Layers without features remain disabled (greyed out)
4. **Click on a layer** in the left section to view its feature details in the right section
5. If the feature has proper geometry, it will be highlighted on the map
6. When making a new query, the previously selected layer will remain selected if features are found

**Clear All Highlights**

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

 The clear all higlights button ![An icon representing the "Clear highlights" function]({{assetsURL}}/img/guide/layers/clear_highlight_30.svg) is located in the upper right corner above the layer list. Click this button to remove all feature highlights from the map.

**Feature Details Section (Right)**

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

The feature details section displays information for the selected feature and provides the following tools:

| Symbol                                                                                                  | Name                     | Description                                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| Arrows (← →)                                                                                            | Feature navigation       | Browse through multiple features for the selected layer.                               |
| ![An icon representing the "Show in Chart panel" function]({{assetsURL}}/img/guide/footer/chart_30.svg) | Show in Chart panel      | Opens the Chart panel for this feature (only available if chart data is configured).   |
| ![An icon representing the "Highlight" function]({{assetsURL}}/img/guide/layers/highlight_30.svg)       | Keep feature highlighted | Keep the feature highlighted on the map. When selected, the icon is filled with color. |
| ![An icon representing the "Zoom" function]({{assetsURL}}/img/guide/datatable/zoom.svg)                 | Zoom to feature          | Zoom the map to the extent of the selected feature.                                    |

The number of features for the selected layer is shown in the upper left of the details section.

**Show Coordinate Info**

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

When the **Show Coordinate Info** option is enabled, clicking on the map will display location information including:

- Click location coordinates in various formats
- NTS (National Topographic System) sheet references at 50k and 250k scales
- Elevation data for the clicked location
- UTM (Universal Transverse Mercator) coordinates

When coordinate info is enabled, it will appear as the first element in the layer list, providing quick access to geographic reference information for any location on the map.

**Note:** When the Details panel is closed, all selected highlights are automatically removed from the map.

=2!dataTable=

<a id="dataTableSection"></a>

### ![]({{assetsURL}}/img/guide/footer/data_table.svg) Data Table [Top](#footerSection)

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**Note: Click on a layer to display its Data Table information in the right section.**_

**Important Navigation Information**

- You can request data from one table at a time. While data is being fetched, all _layers_ buttons will be disabled.
- The selected layer will be highlighted in green, and a progress message will appear at the bottom of the map section.
- Once the data fetching is complete, all _layers_ buttons will be re-enabled.
- If you switch to another tab during the process, you will need to reselect the layer when returning to the tab _Data Table_ to view the results.

The **Data Table** tab has two sections. The layers are listed on the left and the layer data on the right. Click on a layer to show the layer data in the table on the right.

**Data Table Controls**

The **Data Table** controls are shown in the upper right section of the layer data panel.

_Note: Some options may not be available or are preselected depending on various factors._

| Symbol                                                                                                      | Name            | Description                                                                                                          |
| ----------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| ![An icon representing the "Clear Filters" function]({{assetsURL}}/img/guide/datatable/filters_clear.svg)   | Clear Filters   | Clear all data table filters.                                                                                        |
| ![An icon representing the "Display Filters" function]({{assetsURL}}/img/guide/datatable/filter_toggle.svg) | Display Filters | Toggle to show or hide filters.                                                                                      |
| ![An icon representing the "Filter switch" function]({{assetsURL}}/img/guide/datatable/filter.png)          | Filter switch   | Apply filters to the map.                                                                                            |
| ![An icon representing the "Display Columns" function]({{assetsURL}}/img/guide/datatable/column_show.svg)   | Display Columns | Allows you to choose which columns you want visible and to pin columns to the left or right of the table.            |
| ![An icon representing the "Density" function]({{assetsURL}}/img/guide/datatable/density.svg)               | Density         | Toggle the height of the rows in the data table.                                                                     |
| ![An icon representing the "Download" function]({{assetsURL}}/img/guide/datatable/export.svg)               | Download        | Download data table as CSV or GeoJSON. May not work as intended on mobile due to limitations with downloading files. |

The first three columns of the data table are Icon, Zoom and Details. The remaining columns vary depending on the layer selected.

In addition to scrolling data, it is possible to:

- Sort the data by clicking the header of a column with the sort icon ![]({{assetsURL}}/img/guide/footer/swap_vert_FILL0_wght400_GRAD0_opsz24.svg).
- Position the map view to the location of the feature corresponding to a given row by selecting the zoom icon ![]({{assetsURL}}/img/guide/datatable/zoom.svg)

Click the action icon ![]({{assetsURL}}/img/guide/datatable/column_action.svg) beside the column header to show the column action dropdown:

- Pin columns to the left ![]({{assetsURL}}/img/guide/datatable/pin_left_25.svg) or right ![]({{assetsURL}}/img/guide/datatable/pin_right_25.svg) of the table
- Filter the columns by numerical range, text or date (if the configuration allows it). Changes in the table can also be made to reflect on the map by applying or clearing filters from the map (_apply_: ![]({{assetsURL}}/img/guide/datatable/filter_toggle_25.svg), _clear_: ![]({{assetsURL}}/img/guide/datatable/filter_clear_25.svg))
- Show and/or hide columns by clicking on the _Hide Columns_ icon ![]({{assetsURL}}/img/guide/datatable/column_hide_25.svg)
- Navigate the table using a keyboard

Click on a layer and the number of available features is displayed below the layer title.

=3!sortingAndReordering=

#### Sorting and Reordering

For each column in the data table, there may be a set of arrows associated with that column which represents how it can be sorted and reordered.

**Column Sort**: Click on the column title to sort the columns.

- an upward arrow ![]({{assetsURL}}/img/guide/navigation/up_arrow_20.svg) next to the column title indicates that the column data is being sorted in ascending order or alphabetical order
- a downward arrow ![]({{assetsURL}}/img/guide/navigation/down_arrow_20.svg) next to the column title indicates that the column data is being sorted in descending order or reverse alphabetical order
- no arrow next to the column title means that there is no sort applied to current column

Columns can be sorted in ascending/descending order (for numerical data) and alphabetical order (for text data).

=3!filterData=

#### Filter Data

Data can be filtered by column. To show filters, click on the open filters icon ![]({{assetsURL}}/img/guide/datatable/filter_toggle_25.svg). A column is filterable if there is an input field under the title of the header:

There are 3 types of filters:

- **Text**: Character input field.
- **Number**: Input fields that accept only numbers
  - If a minimum and a maximum are defined the filter will search for a range
  - If, for example, only a minimum is defined, it will perform the operation _greater than_
- **Date**: Similar to the numeric field but uses dates

Additional filters (varying by column data type) may be found by clicking the action icon ![]({{assetsURL}}/img/guide/datatable/column_action.svg) beside the column heading, and clicking on **Filter by ...**

=3!keyboardNavigation=

#### Keyboard Navigation

Use **Tab** to go through each of the table controls, and to navigate between the three major table groups:

- Column Headers
- Column Filters
- Table Body

Once any major group is focused on, you can use the arrow keys to navigate through the table cells for that component. Doing this will highlight the currently focused table cell.

To access the buttons and/or input fields within a cell, make sure the cell is highlighted (by using arrow keys as above) and use **Tab** to navigate between its children.

=2!timeSlider=

<a id="timeSliderSection"></a>

### ![]({{assetsURL}}/img/guide/footer/time_slider_30.svg) Time Slider [Top](#footerSection)

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**Note: Click on a layer to display its Time Slider information in the right section.**_

The **Time Slider** tab on the Footer Bar has two sections. Layers with a time dimension are listed in the left section.

The Time Slider section displays a slider bar with one or two draggable handles. A point in time layer will show one handle. A time period layer will show two handles, to adjust the start and end time of the period.

This checkbox ![]({{assetsURL}}/img/guide/layers/check.png) controls whether the time slider filters the data.

- When checked, only the data matching the selected time is shown.
- When unchecked, all data from all dates is displayed, regardless of the slider's position.

Click hold and drag the handle on the slider bar to set the desired filter values or select a point in time. For a time period layer, click the lock icon ![]({{assetsURL}}/img/guide/footer/lock_30.svg) to lock the start time handle in place.

Click the play icon ![]({{assetsURL}}/img/guide/footer/play_arrow_30.svg) to animate the filter results through time. Click the change direction icon ![]({{assetsURL}}/img/guide/footer/direction_arrow_30.svg) to toggle forward or backward in time.

Click the back icon![]({{assetsURL}}/img/guide/footer/back_arrow_30.svg) or forward icon ![]({{assetsURL}}/img/guide/footer/forward_arrow_30.svg) to progress one step back or forward in time.

Click the time delay dropdown to choose the slider animation time delay. Some layers may require a longer delay time to properly display on the map.

The field being filtered on is displayed in the lower left of the Time Slider section. Custom descriptions may also be displayed in this area.

=2!chart=

<a id="chartSection"></a>

### ![]({{assetsURL}}/img/guide/footer/chart_30.svg) Chart [Top](#footerSection)

<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**Note: A feature on the map must be selected to enable the layer in the list. Otherwise layers are disabled (greyed out).**_

The **Chart** tab on the Footer Bar has two sections. Layers with a chart are listed in the left section. Select a feature on the map to display its chart in the right section.

The Feature dropdown (upper left of the chart section), can be used to select a feature. This is useful when features are close together on the map, making it difficult to click on the desired one.

The visibility of data displayed on the chart can be toggled by clicking the checkbox ![]({{assetsURL}}/img/guide/layers/check.png) next to the data name shown above the chart (only for layers with multiple data items):

<img src="{{assetsURL}}/img/guide/footer/checkbox.png" alt="Checkbox controls for toggling data visibility on the chart" style="width: 90%;"/>

Select from the Download dropdown (upper right of chart section) to download chart data in JSON format. Select Download All for all data and Download Visible for only data currently visible on the chart.

=3!chartTypes=

#### Available Chart Types:

- Line Chart
- Bar Charts
- Pie Charts

Points on line charts can be changed to steps, by selecting from the Steps dropdown in the upper left of the chart section.

Click hold and drag the handles on the the line chart slider bars to change the X or Y axis values displayed for the chart.

=1!issues=

# Load Times / Unanticipated Behaviour

<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

Load times may vary based on:

- network location
- bandwidth availability
- number of layers being loaded
- layer types and their sizes

Unanticipated behaviour may occur if any map interactions occur before data is fully loaded. Please allow the map to load completely before triggering any map functions.
