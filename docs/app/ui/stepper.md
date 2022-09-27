# Stepper

A component that can be used to create steps for the required process.

## To access the customizable Stepper:

- Import Stepper from UI folder

  ```
  geoview/packages/geoview-core/src/ui/stepper
  ```

- It takes the following props:
  - _id_: the id for the whole stepper component
  - _className_: if any custom classes are to be applied to the component
  - _style_: custom styles that are not to be a part of classes
  - _orientation_: the orientation in which the steps appear. The orientation could be either horizontal or vertical
  - _alternativeLabel_: alternative labels for the steps. For horinzontal steppers, alternative labels appear right next to steps icons
  - _nonLinear_: allows the user to skip to any step. This means that the previous steps do not need to be completed prior to moving on to the next one
  - _buttonedLabels_: to be able to switch to another step by clicking on the step's button label
  - _steps_: the steps that will be involved in the component
  - _backButtonText_: text for the back (previous) button that takes the user to the previous step
  - _nextButtonText_: text for the next button that takes the user to the next step
  - _resetButtonText_: text for the reset button that resets the step count

## Props

The custom props are defined as below:

- ### `id`:

  Each stepper container can have a unique id. When rendering this component, this prop is required.

- ### `orientation`:

  The orientation of the Stepper component. By default its value is `horizontal` but can be changed by providing a value of `vertical`. The horizontal stepper shows steps side by side from left to right. While the vertical stepper stacks the steps from top to bottom.

- ### `alternativeLabel`:

  By default, the horizontal steppers get the labels right at the bottom. If the labels are required to be moved next to icons, `alternativeLabel` must be provided with a value of `true`

- ### `nonLinear`:

  By default, the step process is linear meaning, to move on to the next step, the current step must be completed or marked as completed. If a user is to be allowed to move to any step without completing a step, `nonLinear` must be passed with a value of `true`. Please note that, to move to the next step, the 'Next' button must be clicked.

- ### `buttonedLabels`

  If the step process is `nonLinear`, the user must still click the 'Next' or 'Previous' buttons to move between steps. `buttonedLabels` allows the user to skip to any step by clicking on its label.

- ### `steps`

  The prop that defines the steps that are involved in the process. It must be passed as an array of objects. These objects will have the following keys:

  - `label`: The label of the step. Its a short text label for each step e.g. "Step 1". This key is optional.
  - `description`: The body of the step. Contains the description which is the HTML that is received from the parent component. The body is created as a `<div>` element and contains all the HTML that is passed as a value. Tbis prop is mandatory and takes string, JSX or HTML.
  - `disableStepMovement`: allows the locking of a step and has a boolean value. This prop is optional and by default, its set as `false`.

  Example:

  ```js
  steps={[
    { label: "1st Step",
      description: "<p>Body copy of the first step. <button>Click here</button> for more.</p>"
    },
    {
      label: "2nd Step",
      description: "Container for Second Step",
      disableStepMovement: true
    },
    {
      label: "3rd Step",
      description: (
        <div>
          <p>
            <span>Body copy of Step 2</span>
          </p>
        </div>
      ),
    },
  ]}
  ```

- ### `backButtonText`

  The text string that is displayed in the button that lets the user move to next step. By default it will be "Next"

- ### `nextButtonText`

  The text string that is displayed in the button that lets the user move to previous step. By default it will be "Back"

- ### `resetButtonText`

  The text string that is displayed in the button that lets the user reset the step progress. By default it will be "Reset"

## More information

Refer to Material UI Stepper component and Stepper API for more information on props and how the HTML gets rendered from Stepper component. https://mui.com/components/steppers/ and https://mui.com/api/stepper/
