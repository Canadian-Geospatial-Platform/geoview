import {
  Stepper as MaterialStepper,
  Step,
  StepContent,
  StepLabel,
  StepperProps,
  StepLabelProps,
  StepContentProps,
  StepProps,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './stepper-style';

/**
 * Custom MUI Stepper Props
 */
interface TypeStepperProps extends StepperProps {
  // eslint-disable-next-line react/require-default-props
  mapId?: string;
  steps: (TypeStep | null)[];
}

/**
 * Object that holds a step of a stepper component
 */
interface TypeStep {
  id?: string | null;
  stepLabel?: StepLabelProps;
  stepContent?: StepContentProps;
  props?: StepProps;
}

/**
 * Create a Material UI Stepper component
 *
 * @param {TypeStepperProps} props custom stepper properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Stepper(props: TypeStepperProps): JSX.Element {
  const { steps, ...stepperProps } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <MaterialStepper sx={sxClasses.stepper} {...stepperProps}>
      {steps &&
        steps.map((step: TypeStep | null, index) => {
          if (step) {
            const { props: stepProps, stepLabel, stepContent } = step;

            return (
              // eslint-disable-next-line react/no-array-index-key
              <Step key={index} {...stepProps}>
                <StepLabel {...stepLabel} />
                <StepContent {...stepContent} />
              </Step>
            );
          }
          return null;
        })}
    </MaterialStepper>
  );
}
