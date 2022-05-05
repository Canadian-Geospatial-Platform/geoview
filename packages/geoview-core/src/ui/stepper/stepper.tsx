import MaterialStepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';

import { TypeStepperProps, TypeStep } from '../../core/types/cgpv-types';

import { generateId } from '../../core/utils/utilities';

/**
 * Create a Material UI Stepper component
 *
 * @param {TypeStepperProps} props custom stepper properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Stepper(props: TypeStepperProps): JSX.Element {
  const { steps, ...stepperProps } = props;

  return (
    <MaterialStepper {...stepperProps}>
      {steps &&
        steps.map((step: TypeStep | null) => {
          if (step) {
            const { id, props: stepProps, stepLabel, stepContent } = step;

            const stepId = generateId(id);

            return (
              <Step key={stepId} {...stepProps}>
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
