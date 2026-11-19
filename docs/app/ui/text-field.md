# TextField

A component that can be used to create an `<input>` element.

## To access the customizable TextField:

- Import TextField from UI folder

  ```
  geoview/packages/geoview-core/src/ui/text-field
  ```

- It takes all of the props defined by MUI under the BaseTextFieldProps. Some of the commonly used props are defined/modified in the custom UI folder. Those props are as follows:
  - _id_: the id for the `<input>` element
  - _className_: if any custom classes are to be applied to the component
  - _style_: custom styles that are not to be a part of classes
  - _helperText_: the helper text that goes right under the text field. It is mostly used to show info/warnings/errors
  - _error_: if there is an error or not
  - _errorHelpertext_: the helper text (as defined above) but only if there is an error
  - _prefix_: the HTML Element (for example, an icon) that is embedded inside the text field (left side)
  - _suffix_: the HTML Element (for example, an icon) that is embedded inside the text field (right side)
  - _changeHandler_: the function that handles change in input
  - _onChange_: event listener for value change in input
  - _value_: default value to be shown in the `<input>` element when it is renderd

## Props

The custom TextField takes all of the props defined under BaseTextFieldProps by MUI. Plus a few props to make it more customizable. Some of the commonly used props are defined below:

- ### `id`:

  Each `<input>` element can have a unique id. When rendering this component, this prop is required.

- ### `helperText`:

  The text that appears to explain the function of the `<input>` or adds to the already provided information. When rendering, this text appears at the bottom of the `<input>` field. This prop is optional.

- ### `errorHelpertext`:

  Does exactly what the `helperText` does but only appears when there is error.

- ### `prefix`:

  A part of `<input>` can be set static and will not be replaced by the data entered by user. Also, it will not replace or hide the data that is entered. `prefix` makes the left part of the `<input>` element static. This prop is optional.

- ### `suffix`

  A part of `<input>` can be set static and will not be replaced by the data entered by user. Also, it will not replace or hide the data that is entered. `suffix` makes the right part of the `<input>` element static. This prop is optional.

- ### `changeHandler`

  A callback function that can be called whenever there is a change in the `<input>` element. It helps to get the value that is entered, right away. This prop is optional

- ### `onChange`

  The event listener that listens to the chage in the `<input>` element. It helps to get the value that is entered, right away. This prop is optional

- ### `value`

  The value that is showed in the `<input>` when there is no data entered. This value is automatically inserted, by default, in the field when the DOM is rendered. This prop is optional.

## More information

Refer to Material UI TextField component and TextField API for more information on props and how the HTML gets rendered from TextField component. https://mui.com/components/text-fields/ and https://mui.com/api/text-field/
