# Notes - GeoView A11Y Review

June 3, 2026

## Table of Contents

- [000 - Global](#_000-global)
- [001 - Shell](#_001-shell)
- [002 - Map](#_002-map)
- [003 - navBar](#_003-navbar)
- [004 - appBar](#_004-appbar)
- [005 - footerBar](#_005-footerbar)
- [006 - GeoLocator](#_006-geolocator)
- [007 - Legend Panel](#_007-legend-panel)
- [008 - Layers Panel](#_008-layers-panel)
- [009 - Details Panel](#_009-details-panel)
- [010 - Guide Panel](#_010-guide-panel)
- [011 - Notifications Panel](#_011-notifications-panel)
- [012 - Export Panel](#_012-export-panel)
- [013 - Time Slider Panel](#_013-time-slider-panel)
- [014 - GeoChart Panel](#_014-geochart-panel)
- [015 - Data Table Panel](#_015-data-table-panel)
- [016 - About Panel](#_016-about-panel)
- [017 - AOI Panel](#_017-aoi-panel)
- [018 - Custom Legend Panel](#_018-custom-legend-panel)

# 000 - Global

## Fail Explanation(s)

### 1.4.10 - Reflow

- This fails on many components
- Test by setting browser width to 1280px width and zooming to 400%

### 1.4.13 - **Content on Hover or Focus**

- Tooltips can't always be dismissed using esc key because esc key triggers other things (panel close, for example).

### 2.1.4 - Character Key Shortcuts

- Need to review: Especially drawer and WCAG mode alert

## Pass Explanation(s)

### 1.1.1 - Non-text Content

Documented in accessibility.md

- Providing programmatically determinable alt text is not always possible for all image types within GeoView.
- alt=”” is being used in such cases

### 1.3.1 - Info and Relationships

**Select Components**

- Documented in accessibility.md
- Validator warnings can be treated as false positives

### 1.3.4 - Orientation

Orientation is not programmatically locked and the application passes 1.3.4. Any layout limitations when using small viewports and/or when layouts are magnified are captured under 1.4.10 Reflow.

### 1.3.5 - Identify Input Purpose

- Not applicable.
- The App does not feature input fields collecting information about the user.

### 1.4.2 - Audio Control

- Not applicable.
- The app does not feature audio

### 1.4.4 Resize Text

In some cases button text is truncated using CSS (for example see Layers button text.) In such cases, this success criteria passes due to:

- Focusing on a button displays a tooltip with the full text (using mouse and keyboard)
- On touch devices, a long press displays the tooltip
- Screen readers have access to the full text
- Also, when pressing the button, the full un-truncated text is fully visible from the associated panel

### 1.4.11 - Non-text Contrast

In many cases (for example footer bar tabs and Guide controls buttons):

- The focus indicator (#000000) has a sufficient contrast ratio (3.38:1) with the selected tab background colour (#515BA5).
- The requirement is a contrast ratio of at least 3:1 against adjacent colour(s)

This barely passes (low contrast). WCAG 2.2 is stricter about this and implementing higher contrast would be a good future enhancement.

### 2.4.1 - Bypass Blocks

- “Skip to main content - map” link is the first interactive
- Panels are focus-trapped and can be closed using the “esc” key making navigation quicker for keyboard users
- Panels are wrapped in landmarks (labelled DOM elements) to improve the user experience for screen-reader users

Any further keyboard navigation improvements beyond these UX enhancements and would be assessed under other success criteria (e.g. 2.1.1 Keyboard) on a case-by-case basis. They do not constitute a failure of 2.4.1.

### 3.1.2 - Language of Parts

Documented in accessibility.md. Covered by:

- Third-party content
- Technical data without a defined language

### 3.2.3 - Consistent Navigation

- Map toolbars and navigation controls are presented consistently in the default implementation of the application, satisfying this criterion.
- However, it’s up to consuming sites to ensure that customization respects this success criterion.

---

# 001 - Shell

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 2.1.1 - Keyboard

**Snackbar behaviour:**
The snackbar’s autoHideDuration is set to **5000ms**. Messages disappears after that amount of time. Whether or not this is enough time for a user to read messages depends on user, and app context.

- Given that snackbar **messages are informational** and **do not require any action** on behalf of the user, the snackbar’s auto-hide duration is considered acceptable.
- As an alternative, the **Notifications panel** provides a persistent, accessible alternative to the Snackbar’s announcements.

### 2.2.1 - Timing Adjustable

**Snackbar:** See Explanation for 2.1.1. above that describes snackbar behaviour. With regards to “Timing Adjustable”:

- Although this timing is not adjustable, as an alternative, the **Notifications panel** provides a persistent, accessible alternative to the Snackbar’s announcements.

### 2.2.2 - Pause, Stop, Hide

**Snackbar:** See Explanation for 2.1.1. above that describes snackbar behaviour. With regards to “Pause, Stop, Hide":

- The messages within the snackbar can’t be paused or stopped. However, the **Notifications panel** provides a persistent, accessible alternative to the Snackbar.

---

# 002 - Map

- Character Key shortcuts are all evaluated from the map rather than evaluating each sub-component that appears on the map.
- Some sub-components have not been evaluated (for example, drawer tool)

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 1.3.1 - Info and Relationships

**Map Canvas: Canvas-rendered map features** do not expose structural relationships to assistive technology. A configurable **data table** component is available that presents feature data with full semantic structure.

### 1.3.3 - Sensory Characteristics

**Map Canvas:** Layer differentiation on the **map canvas** may rely on visual characteristics. The **data table alternative** provides non-visual access to the same information.

### 1.4.3 - Contrast (Minimum)

**Map Canvas:** Text is rendered over a dynamic basemap whose background colors are not determinable and vary with user interaction and zoom level. Contrast cannot be guaranteed for these elements against all possible basemap states.

### **1.4.11 - Non-text Contrast**

Map labels, markers, and layer graphics are rendered over a dynamic basemap whose background colors are not determinable at author time and vary with user interaction and zoom level. Contrast cannot be guaranteed for these elements against all possible basemap states.

- Perhaps this could be further improved with additional halos, outlines, etc.?

### 4.1.2 - Name, Role, Value

**Map Canvas and Screen readers:** Canvas-rendered map features have no programmatically determinable name, role, or state. No ARIA or semantic markup is available to expose these properties to assistive technology.

---

# 003 - navBar

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 2.4.3 - Focus Order

Tab order follows functional priority:

- Primary tools are the most frequently used controls and appear on the right;
- Secondary tools (such as drawing tools) appear to their left.

Focus reaches the higher-priority group first. Where focusable components appear across multiple columns, this priority-based order ensures that 'focusable components receive focus in an order that preserves meaning and operability' (WCAG 2.4.3).”

---

# 004 - appBar

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

- N/A

---

# 005 - footerBar

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 1.4.4 - Resize text: footer tab text truncation: Text can get truncated at 200%

- Footer tab text truncation: Tab text can get truncated when zooming in (to 200%, for example). However, the partially visible tabs can be scrolled/tabbed to.

### 1.4.11 - Non-text Contrast

- Tabs: The focus indicator (#000000) has a sufficient contrast ratio (3.38:1) with the selected tab background colour (#515BA5).
- The requirement is a contrast ratio of at least 3:1 against adjacent colour(s)

---

# 006 - GeoLocator

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail
- UI needs to be made responsive. Tested by setting Chrome to 1280px wide and zooming to 400%

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 1.3.1 - Info and Relationships

- See Select Components in the “Global → Pass Explanation” section above

---

# 007 - Legend Panel

## Fail Explanation(s)

### 1.3.3 Sensory Characteristics

- ARIA attributes have been added (good for screen readers), However, no **explicit text** says "visibility limited by scale"
- The disabled state relies solely on italic text and a colour change, which may not be perceivable to sighted users with low vision, colour blindness, or cognitive disabilities who cannot distinguish these subtle visual cues. Visual users need a better indicator for out of range items.

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 1.4.1 - Use of Colour

The colour of the left border is not the only indicator that a legend item’s visibility is being toggled:

- Border color changes
- Text changes (italic)
- Map changes

---

# 008 - Layers Panel

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail
- Tooltips appear offscreen (this violates other SC as well)

### 1.4.13 - Content on Hover or Focus

- Global fail

### 2.4.3 - Focus Order

- KB - After pressing delete, focus does not go where expected

## Pass Explanation(s)

### 1.3.1 Info and Relationships

- Remove HR from button group (use css) - **This is not a fail, it’s an enhancement**

### 1.4.1 Use of Color

- Layer List Item: Reload button uses colour (green) as well as a progress bar to display re-loading state
- Layer List Item: Errors use colour, text, and an icon to display error

### 1.4.4 Resize Text

Layer button Text can become truncated.

- Focusing on a button displays a tooltip with the full text (using mouse and keyboard)
- On touch devices, a long press displays the tooltip
- Screen readers have access to the full text
- Also, when pressing the button, the full un-truncated text is fully visible from the associated panel

### 2.4.4 - Link Purpose (in context)

Argument can be made for adjacent cells providing link context. This deals with the following:

- Repeated text link going to different URLs (e.g., ”Real-time Data”)

Most links should not appear as RAW URLs anymore. This deals with the following:

- Raw URLs do not provide purpose and are not screen reader friendly

---

# 009 - Details Panel

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

### 2.5.3 - Label in Name

- Switch uses aria-label because of tooltip.

### 4.1.2 - Name, Role, Value

- Switch does not update checked status on its checkbox

## Pass Explanation(s)

### 1.4.1 - Use of Color

- Layer List Item: Reload button uses colour (green) as well as a progress bar (with aria label) to display re-loading state
- Layer List Item: Errors use colour, text, and an icon to display error

### 2.4.4 - Link Purpose (in context)

Argument can be made for adjacent cells providing link context. This deals with the following:

- Repeated text link going to different URLs (e.g., ”Real-time Data”)

Most links should not appear as RAW URLs anymore. This deals with the following:

- Raw URLs do not provide purpose and are not screen reader friendly

---

# 010 - Guide Panel

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 1.1.1 - Non-text content

**Image Alt text:** Although it could be more descriptive in some cases, the image alt text provided in the guide provides reasonable value to assistive technologies as it describes image elements that appear in the application’s UI.

### 4.1.2 - Name, Role, Value (need to check instance with maps in same lang)

Note: markdown-to-jsx could be configured to not output IDs on headings. This would prevent A11Y tools from flagging this as potential issue

**Potential duplicate and invalid IDs in heading elements:** The guide (or guide sections), can appear multiple times within a map or a page. This would cause many duplicate IDs. However this does not appear to impact functionality:

- For example, no `aria-labelledby` or `aria-describedby` attributes in the guide content reference the duplicated heading IDs. The duplicate IDs do not affect the computed accessible name or description of any interactive control.

---

# 011 - Notifications Panel

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

- N/A

---

# 012 - Export Panel

## Fail Explanation(s)

### 1.4.10 Reflow

- Global fail
- Not usable at 1280px when zoomed to 400%

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 1.3.1 - Info and Relationships

See Select Components in the “Global → Pass Explanation” section above

### **4.1.3 - Status Messages**

Although no status message is provided after the download is triggered, the criterion does not apply as no status message is presented to the user. The modal closes, the download begins, and focus returns to the trigger button. The clearly labelled download button sets explicit user expectations prior to it being triggered, making a confirmation status message unnecessary.

---

# 013 - Time Slider Panel

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail
- The slider labels will cause horizontal scrolling on small viewports
- The header and “Time Filtering” switch overlap on small viewports

## Pass Explanation(s)

### 1.4.4 - Resize text

- Value labels (tooltips) are hidden using CSS on smaller viewports to prevent them displaying truncated
- Note: Long labels could potentially overlap with others, or appear off-screen. This is an exception rather than the rule.

---

# 014 - GeoChart Panel

Certain charts will be less usable on smaller viewports, when zoomed in a lot (labels might overlap, the chart will be too small to be useful, etc.)

The chart is a complex data visualization and is not fully accessible to keyboard or screen reader users. As an alternative, a data download is provided which contains all data represented in the chart. The download control is keyboard accessible and appropriately labelled. The chart's interactive filter controls (x/y axis sliders) meet WCAG 2.1 Level A and AA requirements, including keyboard operability and programmatic labelling.

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

### 1.1.1 Non-text Content

The chart canvas uses `role="img"` with an `aria-label (when available)` providing a text alternative. Ideally the aria-label would be more descriptive. However, AT users have direct access to the underlying data via the download feature. Together these satisfy the intent of SC 1.1.1 — the non-text content is identified and its data is accessible through an equivalent alternative.

### 1.4.1 - Use of Color

- Dataset selector uses only coloured text. Label text colour corresponds to the associated chart line as a visual aid, but the text alone is sufficient to identify and operate each control. Colour is not the sole means of conveying this information.

### 2.1.1 - Keyboard

Mouse users can hover over data points on the chart and view a tooltip. These data point can’t be accessed via keyboards. However,

- The chart data can be downloaded

### **2.4.3 - Focus Order**

When navigating via keyboard: For charts on which a vertical slider is available, the bottom thumb receives focus before the the top thumb does.

- Although this can be slightly confusing visually when expecting top-bottom / left-right navigation, logically it makes sense for the second thumb to receive focus first (the bottom thumb represents the minimum value)

---

# 015 - Data Table Panel

## Fail Explanation(s)

### **1.3.1 Info and Relationships**

- See issue #3450 Table columns without data are generated. Most importantly, each table header should contain text

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

### **2.4.7 - Focus Visible**

- See issue: #3460 - Data table cells don't scroll into view on keyboard focus

## Pass Explanation(s)

### 1.1.1 - Non-text Content

Documented in accessibility.md

- Providing meaningful alt text for the icons in the table is not programmatically feasible. alt=”” is being used.

### 1.3.3 - Sensory Characteristics

- The icons within the table rely on shape/colour in order to create a visual relationship to what’s seen on the map. However, the data table provides sufficient context for users to understand the data, without users needing to interpret the icons.

### SC 1.4.1 - Use of Color

The icons within the table rely on colour in order to create a visual relationship to what's seen on the map. However, the data table provides sufficient context for users to understand the data, without needing to interpret the colour of the icons. Therefore SC 1.4.1 is satisfied.

### SC 2.1.1 - Keyboard

- Keyboard navigation “Column Actions” sub-menus can be opened using the “Enter” key (ARIA Authoring Practices Guide (APG) best practice would be for this to work using right arrow key)

---

# 016 - About Panel

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

- Content is the responsibility of the client

---

# 017 - AOI Panel

## Fail Explanation(s)

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

- N/A

---

# 018 - Custom Legend Panel

## Fail Explanation(s)

### 1.3.3 Sensory Characteristics

Layer names use italic to show out of range status.

- ARIA attributes have been added (good for screen readers)
- Visual users need a better indicator: The disabled state relies solely on italic text and a colour change, which may not be perceivable to sighted users with low vision, colour blindness, or cognitive disabilities who cannot distinguish these subtle visual cues.

### 1.4.10 - Reflow

- Global fail

### 1.4.13 - Content on Hover or Focus

- Global fail

## Pass Explanation(s)

- N/A
