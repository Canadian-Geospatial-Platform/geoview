# Modal

A component that can be used to create, show, hide and delete a modal.

## To access the customizable Modal:

- Import Modal from UI folder

  ```
  geoview/packages/geoview-core/src/ui/modal
  ```

- It takes all of the MUI Dialog props. The following props are modified for customizability. Those props are:

  - _id_: the id of the modal component
  - _className_: if any custom classes are to be applied to the component
  - _style_: custom styles that are not to be a part of classes
  - _mapId_: the id of the map, of which, the modal is going to be a part of
  - _title_: the title of the modal that appears on top
  - _titleId_: the id given to the said title
  - _content_: the body copy (description) container of the modal
  - _contentClassName_: the custom class that can be assigned to content only
  - _contentStyle_: the custom styles that are not part of classes and can be assigned to content only
  - _contentTextId_: the id of body copy (description) of the modal
  - _contentTextClassName_: the custom class that can be assigned to the content
  - _contentTextStyle_: the custom styles that are not part of classes and that can be assigned to the content
  - _actions_: action elements, for exxample, buttons

## Props

The custom Modal takes all of the props defined under MaterialDialogProps by MUI. Plus a few props to make it more customizable. Some of the commonly used props are defined below:

- ### `id`:

  Each modal component can have a unique id. If an id is provided, it will be assigned to the modal. If its not provided, it will be generated automatically. This prop is optional.

- ### `mapId`

  Each map can have a unique modal. To attach a modal to a map, mapId must be provided. This prop is required.

- ### `title` & `titleId`:

  The `<h2>` heading of the modal. And the id associated to it, for accessibility purposes. If no title is provided, that text is left blank and there is only a Close button in the heading. This prop is optional.

- ### `content`:

  The content/description of the modal. It takes JSX, HTML or string as a value. This value will be embedded inside a `<div>` container. This prop is required.

- ### `actions`:

  The action buttons that can be provided to this modal. Both the header and footer can have action buttons. The header will have a Close button by default. Any new HTML provided as the value, will be added to the title. The footer has not action button by default. If any value is provided, the footer will get generated under the content. This prop is optional.

## More information

Refer to Material UI Dialog (aka Modal) component and Dialog API for more information on props and how the HTML gets rendered from TextField component. https://mui.com/components/dialogs/ and https://mui.com/api/dialogs/
