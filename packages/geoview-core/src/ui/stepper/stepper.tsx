import { useMemo } from 'react';
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
 * Create a customized Material UI Stepper component.
 * This component provides a step-by-step interface with configurable
 * labels and content for each step.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Stepper
 *   activeStep={1}
 *   steps={[
 *     {
 *       stepLabel: { label: 'Step 1' },
 *       stepContent: { children: 'Content for step 1' }
 *     },
 *     {
 *       stepLabel: { label: 'Step 2' },
 *       stepContent: { children: 'Content for step 2' }
 *     }
 *   ]}
 * />
 *
 * // With custom styling and optional step
 * <Stepper
 *   activeStep={0}
 *   orientation="vertical"
 *   steps={[
 *     {
 *       id: "step1",
 *       stepLabel: {
 *         label: 'First Step',
 *         optional: <Typography variant="caption">Optional</Typography>
 *       },
 *       stepContent: { children: 'Step content' },
 *       props: { sx: { my: 1 } }
 *     },
 *     null,  // Skip this step
 *     {
 *       stepLabel: { label: 'Final Step' },
 *       stepContent: { children: 'Final content' }
 *     }
 *   ]}
 * />
 * ```
 *
 * @param {StepperPropsExtend} props - The properties passed to the Stepper element
 * @returns {JSX.Element} The Stepper component
 *
 * @see {@link https://mui.com/material-ui/react-stepper/}
 */
function StepperUI(props: StepperPropsExtend): JSX.Element {
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
}

export const Stepper = StepperUI;
