import { useMemo } from 'react';
import type { StepperProps, StepLabelProps, StepContentProps, StepProps } from '@mui/material';
import { Stepper as MaterialStepper, Step, StepContent, StepLabel } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from '@/ui/stepper/stepper-style';
import { logger } from '@/core/utils/logger';

/**
 * Custom MUI Stepper Props
 */
interface StepperPropsExtend extends StepperProps {
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
 * Material-UI Stepper component for step-by-step workflows.
 *
 * Wraps Material-UI's Stepper with configurable labels and content for each step.
 * Supports vertical and horizontal orientations with optional step content sections.
 * Steps can be skipped by passing null in the steps array.
 *
 * @param props - Stepper configuration (see StepperPropsExtend interface)
 * @returns Stepper component with step indicators and optional content sections
 *
 * @example
 * ```tsx
 * <Stepper
 *   activeStep={1}
 *   steps={[
 *     { stepLabel: { label: 'Step 1' }, stepContent: { children: 'Content 1' } },
 *     { stepLabel: { label: 'Step 2' }, stepContent: { children: 'Content 2' } }
 *   ]}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-stepper/}
 */
function StepperUI(props: StepperPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/stepper/stepper', props);

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
}

export const Stepper = StepperUI;
