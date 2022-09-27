# Select

The Select component creates a drop-down list with pre-defined options. In DOM, it renders HTML of `<label>` element with `<select>` that has its options as `<option>`.

## To access the customizable Select:

- Import Select from UI folder

```
geoview/packages/geoview-core/src/ui/select
```

- It takes the following props:

  - Required:
    - id: the id of the Select component
    - label: the label text of this `<select>` element. It is rendered as a `<label>` element. For accessibility, this prop is required
    - selectItems: the `<option>` of this `<select>` element
  - Optional:
    - className: if any custom classes are to be applied to the component
    - style: custom styles that are not to be a part of classes
    - callBack: the callback function that is called when the selection changes
    - helperText: the helper text for the select component that appears under the `<select>` element
    - multiple: if multiple selections can be made or not

## Props

The required props are further described as below

- ### `id`:

  Each `<select>` can have a unique id. When rendering this component, this prop is required.

- ### `label`:

  The label that defines this element. This prop is also required as it helps the accessibility tools to define what the select element is.

- ### `selectItems`:

  The structure of `<select>` element. This prop is rendered as `<option>` inside the `<select>` element. This prop has a custom structure and can be defined as per the requirement.

  - if the provided options are not to be grouped (categorized):
    the `selectItems` will take an array of objects. These objects will have `id`,`value` and `default` as keys. These keys are:

    - `id`: the id of this `<option>` element
    - `value`: the value for this `<option>` element. This text shows up to user
    - `default`: this key is optional and can be either true or false. This key defines if the option is selected by default. If this key is not provided, then its false by default.

    Example:

    ```js
    selectItems={[
      { id: "option-1", value: "Option 1" },
      { id: "option-2", value: "Option 2" },
      { id: "option-3", value: "Option 3", default: true }
    ]}
    ```

  - if the provided options are to be grouped (categorized):
    the `selectItems` will take an array of objects. These objects will have two keys `category` and `items` as keys. These keys are:

    - `category`: the name of group/category of multiple options
    - `items`: the `<option>` element for the above defined category. It takes an array of objects which will have `id`,`value` and `default` as keys. The keys have been defined above.

    Example:

    ```js
    selectItems={[
      {
        category: "Category 1",
        items: [
          { id: "option-1a", value: "Option 1A" },
          { id: "option-1b", value: "Option 1B" },
        ]
      },
      {
        category: "Category 2",
        items: [
          { id: "option-2a", value: "Option 2A", default: true },
          { id: "option-2b", value: "Option 2B" },
          { id: "option-2c", value: "Option 2C" }
        ]
      },
      {
        category: "Category 3",
        items: [
          { id: "option-3a", value: "Option 3A" },
          { id: "option-3b", value: "Option 3B" },
          { id: "option-3c", value: "Option 3C" },
        ]
      },
    ]}
    ```

## More information

Refer to Material UI Select component and Select API for more information on props and how the HTML gets rendered from Select component. https://mui.com/components/selects/ and https://mui.com/api/select/
