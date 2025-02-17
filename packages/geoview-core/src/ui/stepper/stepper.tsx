import { memo, useMemo } from 'react';
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

import { getSxClasses } from '@/ui/stepper/stepper-style';
import { logger } from '@/core/utils/logger';

/**
 * Custom MUI Stepper Props
 */
interface TypeStepperProps extends StepperProps {
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
export const Stepper = memo(function Stepper(props: TypeStepperProps): JSX.Element {
  logger.logTraceRender('ui/stepper/stepper', props);

  // Get constant from props
  const { steps, ...stepperProps } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

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
});
