=1!navigationControls=

# Navigation Controls

Navigation controls are used for changing the viewing extent of the map.

The following navigation controls can be found in the bottom right corner of the map:

| Symbol                                                       | Name           | Description                                                                                                                          |
| ------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| <img src="{{assetsURL}}/img/guide/navigation/fullscreen.svg" width="30"/>  | Fullscreen     | Full screen presents map content using the entire page. Full screen toggles between the entire page and the initial size of the map. |
| <img src="{{assetsURL}}/img/guide/navigation/plus.svg" width="30"/>        | Zoom in        | Zoom in one level on the map to see more detailed content - bound to Plus key (+)                                                    |
| <img src="{{assetsURL}}/img/guide/navigation/minus.svg" width="30"/>       | Zoom out       | Zoom out one level on the map to see less detailed content - bound to Minus key (-)                                                  |
| <img src="{{assetsURL}}/img/guide/navigation/geolocation.svg" width="30"/> | Geolocation    | Zoom and pan to your current geographical location                                                                                   |
| <img src="{{assetsURL}}/img/guide/navigation/home.svg" width="30"/>        | Initial extent | Zoom and pan map such that initial extent is visible                                                                                 |

You can also pan the map by using your left, right, up and down arrow keys, or by click-holding on the map and dragging. Using the mouse scroll wheel while hovering over the map will zoom the map in/out.

Press the **Shift** key while click-holding and dragging the mouse to define a map extent region. When the mouse button is released, the view will zoom to the chosen area.

Press **Shift** and **Alt** keys while click-holding and dragging the mouse to rotate the map.
To reset the map orientation, click the reset rotation arrow located at the right side of the Map Information Bar at the bottom of the map.

_Note: The map must be focused for key binding to work._

<br>
=2!overviewMap=

### Overview Map

Some maps display an overview map, a generalised view of the main map at a smaller scale. It can be found in the top right corner of the map.

![]({{assetsURL}}/img/guide/navigation/overview.png)

Click-hold on the box in the overview map and drag it to change the extent of the main map. Clicking on the toggle icon ![]({{assetsURL}}/img/guide/navigation/chevron_overview.png) in the top right corner of the overview map will expand or contract it.

<br>
=2!keyboardNavigation=

### Keyboard Navigation

Keyboard functionality is provided as an alternative for users who are unable to use a mouse. Use the **Tab** key to navigate forward to links and controls on the page. Press **Shift** and **Tab** keys to go back one step. Use the **Enter** or **Spacebar** keys to activate links and controls.

Using the **Tab** key to navigate to the map and the **Keyboard Navigation** prompt will appears. Select Enable and press Enter to use keyboard navigation.

When the map gains focus, a crosshair is displayed in the center of the map:

![]({{assetsURL}}/img/guide/navigation/crosshair.svg)

Use the **arrow** keys to move the map and **+** / **-** keys to zoom in and out. Press **Enter** to select a feature under the crosshairs and display associated data in the Details panel.

Information will be shown for supported features when the crosshair is positioned over them.

Press **CTRL** and **Q** to exit keyboard navigation.

_Note: The map must be focused for key binding to work. The map has focus when the crosshairs marker is present._

**Accessibility**

This map is not fully WCAG 2.0 AA compliant.

=1!mapInformationBar=

# Map Information Bar

Click the up chevron icon ![]({{assetsURL}}/img/guide/navigation/chevron_up.svg) on the left to expand/collapse the bar.

![]({{assetsURL}}/img/guide/navigation/map_info.png)

The following navigation information can be found in the Map Information Bar (may need to expand the bar to view all options):

| Symbol                                                     | Name                    | Description                                                                                                                                                              |
| ---------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <img src="{{assetsURL}}/img/guide/navigation/attribute.svg" width="30"/> | Attributes              | Copyright and other map attributes.                                                                                                                                      |
|                                                            | Positioning coordinates | Click on the positioning coordinates to toggle between degrees minutes seconds (DMS), decimal degrees or projected coordinates.                                          |
|                                                            | Map scale               | Click on the map scale to toggle between scale and resolution.                                                                                                           |
| <img src="{{assetsURL}}/img/guide/navigation/up_arrow.svg" width="30"/>  | Reset rotation          | Click on the arrow to return map to the initial orientation. _Note: Fix North must be Off._                                                                           |
| <img src="{{assetsURL}}/img/guide/navigation/fix_north.png" width="30"/> | Fix North               | On or Off. Set to On to keep map oriented with North to the top. Only available with some projections (eg. LCC). _Note: Reset rotation will not work when Fix North is On._ |

=1!sidebar=

# Side Bar

The Side Bar to the left of the map shows the available tools.

_The tools shown in the Side Bar vary depending on the map._

_Note: Some tools in the Side Bar are also available as tabs in the Footer Bar, such as Legend, Layers, Data Table or Details. Tools opened from the Side Bar are displayed on the map, in a condensed 'mobile' view (single column). The same tool opened from a tab in the Footer Bar is displayed below the map in a fully expanded view._

| Symbol                                                      | Name          | Description                                                                                        |
| ----------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" width="30"/>  | Geolocator    | Click the geolocator icon and an input field for search keywords will appear on the map            |
| <img src="{{assetsURL}}/img/guide/sidebar/basemap.svg" width="30"/>       | Basemap       | Basemap selector modifies the underlying basemap to provide a variety of geographical contexts     |
| <img src="{{assetsURL}}/img/guide/sidebar/legend.svg" width="30"/>        | Legend        | Legend of map icons (_see Footer Bar section for help_)                                                                                |
| <img src="{{assetsURL}}/img/guide/sidebar/details.svg" width="30"/>       | Details       | Details for selected features (_see Footer Bar section for help_)                                                                      |
| <img src="{{assetsURL}}/img/guide/sidebar/guide.svg" width="30"/>         | Guide         | Help guide                                                                                         |
| <img src="{{assetsURL}}/img/guide/sidebar/export.svg" width="30"/>        | Export        | Download a PNG file of the map                                                                     |
| <img src="{{assetsURL}}/img/guide/sidebar/notifications.svg" width="30"/> | Notifications | Display messages and notifications for the map                                                     |
| <img src="{{assetsURL}}/img/guide/sidebar/about.svg" width="30"/>         | About Geoview | Display information about Geoview viewer                                                           |

<br>
=2!geolocator=

### <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" width="30"/> Geolocator

The geolocator component functions to allow users to search for places in Canada. When the geolocator icon ![]({{assetsURL}}/img/guide/geosearch/geolocator_20.svg) in the Side Bar is clicked, an input field for search keywords will appear on the map:

![]({{assetsURL}}/img/guide/geosearch/searchbar_en.png)

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

When searching for a location, a results panel will appear below the search box. This results panel contains two dropdown boxes that allow you to filter the search results by their **province** and by their **category** (lake, town, river, etc.). To the right of these two boxes is a **Clear Filters** ![]({{assetsURL}}/img/guide/geosearch/clear.svg) button, which when clicked clears the selected filter options.

<br>
=2!basemapSelector=

### ![]({{assetsURL}}/img/guide/sidebar/basemap_30.svg) Basemap Selector

The basemap selector modifies the underlying basemap to provide a variety of geographical contexts. Click on the basemap selector icon and you will be presented with one or more basemaps to choose from.

<br>
=2!export=

### ![]({{assetsURL}}/img/guide/sidebar/export_30.svg) Export

You can export an image of the map and its visible layers along with a legend, title, north arrow, scalebar, and a timestamp.

Once **Export** button is clicked, a dialog will appear with an image of the map, and an option to enter a map title if desired.

Click on the Export button at the bottom to get the final generated map image.

=1!footerPanel=

# Footer Bar

The _Footer Bar_ appears below the map. The _Footer Bar_ can be expanded or collapsed by clicking on a tab in the _Footer Bar_ menu bar. To collapse the panel, simply click again on the active tab.

The _Footer Bar_ menu bar has the following tabs:

- Legend
- Layers
- Details
- Data Table
- Time Slider
- Chart
- Guide

_Depending on viewer configuration some tabs may not be available_

_Note: Some tabs in the Footer Bar are also available as tools in the Side Bar, such as Legend, Layers, Data Table or Details. A tool opened from the Side Bar is displayed on the map, in a condensed 'mobile' view (single column). The same tab opened in the Footer Bar is displayed below the map in a fully expanded view._

<br>
=2!legend=

### ![]({{assetsURL}}/img/guide/sidebar/legend_25.svg) Legend

The _Legend_ tab displays the symbology associated with the layers displayed on the map.

Each layer has some symbology associated with it. For simple feature layers a single icon ![]({{assetsURL}}/img/guide/footer/icon_single.png) will be present next to the layer name.

For complex feature layers (i.e. those with multiple symbols used per layer) the icon will show as a stack ![]({{assetsURL}}/img/guide/footer/icon_multiple.png) (hover to reveal more than one icon).

The symbology for the layer can be toggled open and closed which is expanded beneath the layer name. WMS layers may optionally have a graphical legend defined, if one is present it will be displayed in the same drop down manner.

<br>
=2!layers=

### ![]({{assetsURL}}/img/guide/footer/layers_30.svg) Layers

The _Layers_ tab has the following submenu options:

- View
- Add
- Sort
- Remove

=3!view=

#### ![]({{assetsURL}}/img/guide/footer/view_25.svg) View

The _View_ submenu option under the _Layers_ tab consists of two sections. The left section lists all the layers displayed on the map. Click on a layer and the right section lists will show the layer settings (available options for that layer).

**Layer Icons**

Each layer has some symbology associated with it. For simple feature layers a single icon ![]({{assetsURL}}/img/guide/footer/icon_single.png) will be present next to the layer name. For complex feature layers (i.e. those with multiple symbols used per layer) the icon will show as a stack (hover to reveal more than one icon ![]({{assetsURL}}/img/guide/footer/icon_multiple.png)).

**Group Layers**

The group layer icon ![]({{assetsURL}}/img/guide/layers/group.svg) denotes a group of layers. Click on the group layer to expand the list of sublayers. Sublayers may also be group layers.

**Layer Visibility**

Select the eye icon, next to each layer, to toggle visibililty on ![]({{assetsURL}}/img/guide/footer/eye.png) or off ![]({{assetsURL}}/img/guide/footer/eye_not_visible.png).

For layers that are always displayed, the visibility (eye) icon is disabled (greyed out) ![]({{assetsURL}}/img/guide/footer/eye_disabled.png).

**Supported Layer Types**

Layers can either be in raster format or vector format. The following layer types are supported.

| Raster Layers      | Vector Layers         |
| ------------------ | --------------------- |
| ESRI Dynamic       | ESRI Feature          |
| ESRI Image         | GeoJSON               |
| XYZ Tile           | OGC Feature API Layer |
| WMS                | GeoPackage            |
| Static Image       | CSV                   |
| Vector tiles layer | WFS                   |

_Note: If a layer fails to load correctly it will be identified by an error notice in the notifications tool on the Side Bar. Instead of the standard layer actions you can select to either reload the layer (this is particularly helpful if there is a temporary network connectivity issue) or remove the layer. If a layer is removed it will be taken out of the layer selector completely._

=3!layerSettings=

#### Layer Settings

Click a layer in the left section of the layers view tab, and the layer settings are displayed in right section.

_Note: Some settings may not be available depending on various factors such as layer type or configuration._

|                           Symbol                           | Name                   | Description                                                                             |
| :--------------------------------------------------------: | ---------------------- | --------------------------------------------------------------------------------------- |
| <img src="{{assetsURL}}/img/guide/layers/table_view_60.svg" width="30"/> | Table details          | Opens simplified view of Data Table.                                                    |
|  <img src="{{assetsURL}}/img/guide/layers/refresh_60.svg" width="30"/>   | Refresh                | Reloads the layer                                                                       |
| <img src="{{assetsURL}}/img/guide/layers/highlight_60.svg" width="30"/>  | Highlight              | Brings layer to the top, decreases opacity of other layers and displays layer boundary. |
|    <img src="{{assetsURL}}/img/guide/layers/zoom_60.svg" width="30"/>    | Zoom to layer boundary | Pans and zooms the map so that the layer boundary is in view                            |
|    <img src="{{assetsURL}}/img/guide/layers/opacity.png" width="80"/>    | Opacity                | Slider to increase/decrease layer opacity                                               |

**Layer Classes**

Classes for the layer are listed in the layer settings if available. Select the checkbox ![]({{assetsURL}}/img/guide/layers/check.png) next to the class to toggle visibiity for this particular class.

The number of classes visible is displayed under the layer name.

=3!add=

#### ![]({{assetsURL}}/img/guide/layers/add_25.svg) Add

Additional layers can be added to the map viewer through the _Add_ submenu in the **Layers** tab.

Usage:

- If you wish to add a file, you can do so by dragging the file over the import wizard, by clicking on the 'Choose a File' button and selecting the file, or by providing the URL to the file.
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

<br>
=2!details=

### ![]({{assetsURL}}/img/guide/sidebar/details_30.svg) Details

The **Details** tab has two sections. The available layers for the map are listed in the left section, and the feature details for each layer are displayed in the right section.

_**Note: A feature on the map must be selected to enable the layer in the list. Otherwise layers are disabled (greyed out).**_

Click on a layer to see its feature details.

The number of features for the selected layer is shown in the upper left of the details section.

Use the left and right arrows in the upper right of the details section to browse through the features for the selected layer.

The zoom icon ![]({{assetsURL}}/img/guide/datatable/zoom.svg) will zoom the map to the selected feature.

Check the highlight box ![]({{assetsURL}}/img/guide/layers/check.png) to keep the feature highlighted on the map.

<br>
=2!dataTable=

### ![]({{assetsURL}}/img/guide/footer/data_table.svg) Data Table

The **Data Table** tab has two sections. The layers are listed on the left and the layer data on the right. Click on a layer to show the layer data in the table on the right.

**Data Table Controls**

The **Data Table** controls are shown in the upper right section of the layer data panel.

_Note: Some options may not be available or are preselected depending on various factors._

| Symbol                                                        | Name            | Description                                                                                                                               |
| ------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="{{assetsURL}}/img/guide/datatable/filter_toggle.svg" width="30"/> | Display Filters | Toggle to show or hide filters                                                                                                            |
| <img src="{{assetsURL}}/img/guide/datatable/filter.png" width="30"/>        | Filter switch   | Apply filters to the map                                                                                                                  |
| <img src="{{assetsURL}}/img/guide/datatable/column_show.svg" width="30"/>   | Display Columns | Allows you to choose which columns you want visible and to pin columns to the left or right of the table                                  |
| <img src="{{assetsURL}}/img/guide/datatable/density.svg" width="30"/>       | Density         | Toggle the height of the rows in the data table                                                                                           |
| <img src="{{assetsURL}}/img/guide/datatable/export.svg" width="30"/>        | Export          | Export data table as CSV or GeoJSON. May not work as intended on mobile due to limitations with downloading files                         |

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

<br>
=2!timeSlider=

### ![]({{assetsURL}}/img/guide/footer/time_slider_30.svg) Time Slider

The Time Slider tab on the Footer Bar has two sections. Layers with a time dimension are listed in the left section. Click on a layer to display its Time Slider in the right section:

The Time Slider section displays a slider bar with one or two draggable handles. A point in time layer will show one handle. A time period layer will show two handles, to adjust the start and end time of the period.

Click hold and drag the handle on the slider bar to set the desired filter values or select a point in time. For a time period layer, click the lock icon ![]({{assetsURL}}/img/guide/footer/lock_30.svg) to lock the start time handle in place.

Select the filter checkbox ![]({{assetsURL}}/img/guide/layers/check.png) to toggle the filtering on and off.

Click the play icon ![]({{assetsURL}}/img/guide/footer/play_arrow_30.svg) to animate the filter results through time. Click the change direction icon ![]({{assetsURL}}/img/guide/footer/direction_arrow_30.svg) to toggle forward or backward in time.

Click the back icon![]({{assetsURL}}/img/guide/footer/back_arrow_30.svg) or forward icon ![]({{assetsURL}}/img/guide/footer/forward_arrow_30.svg) to progress one step back or forward in time.

Click the time delay dropdown to choose the slider animation time delay. Some layers may require a longer delay time to properly display on the map.

The field being filtered on is displayed in the lower left of the Time Slider section. Custom descriptions may also be displayed in this area.

<br>
=2!chart=

### ![]({{assetsURL}}/img/guide/footer/chart_30.svg) Chart

The Chart tab on the Footer Bar has two sections. Layers with a chart are listed in the left section. Select a feature on the map to display its chart in the right section.

_**Note: A feature on the map must be selected to enable the layer in the list. Otherwise layers are disabled (greyed out).**_

The Feature dropdown (upper left of the chart section), can be used to select a feature. This is useful when features are close together on the map, making it difficult to click on the desired one.

The visibility of data displayed on the chart can be toggled by clicking the checkbox ![]({{assetsURL}}/img/guide/layers/check.png) next to the data name shown above the chart (only for layers with multiple data items):

![]({{assetsURL}}/img/guide/footer/checkbox.png)

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

Load times may vary based on:

- network location
- bandwidth availability
- number of layers being loaded
- layer types and their sizes

Unanticipated behaviour may occur if any map interactions occur before data is fully loaded. Please allow the map to load completely before triggering any map functions.

_Note: If the loading spinner is visible for a layer, please wait for it to disappear before triggering any function on the map._
