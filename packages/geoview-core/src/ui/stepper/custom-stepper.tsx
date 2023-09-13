/* eslint-disable react/require-default-props */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, CSSProperties } from 'react';
import { Box, Stepper as MaterialStepper, Step, StepButton, StepContent, StepLabel, Typography } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

import { Button } from '../button/button';

import { HtmlToReact } from '@/core/containers/html-to-react';

/**
 * Properties for the Custom Stepper
 */
interface TypeCustomStepperProps {
  stepperId: string;
  className?: string;
  style?: CSSProperties;

  // orientaion of the Stepper component. By default, its horizontal
  orientation?: 'horizontal' | 'vertical';

  // alternative label for the steps. Alternative labels appear at the bottom of step icons
  alternativeLabel?: boolean;

  // allows the user to enter a multi-step flow at any point
  // i.e. previous step needs to be completed to move on to the next one
  nonLinear?: boolean;

  // to be able to switch to another step by clicking on the step's button label
  buttonedLabels?: boolean;

  // the steps that will be involved in the component
  steps?: Array<Record<string, TypeStepperSteps>>;

  // text for the back (previous) button that goes to the previous step
  backButtonText?: string;

  // text for the next button that goes to the next step
  nextButtonText?: string;

  // text for the reset button that resets the step count
  resetButtonText?: string;
}

/**
 * Properties for the Steps of Stepper
 */
export interface TypeStepperSteps {
  // the text label for the step
  label?: string;

  // the body of the step
  description: JSX.Element | HTMLElement | string;

  // whether the user is allowed to move to the next step or not
  disableStepMovement?: boolean;
}

const useStyles = makeStyles((theme) => ({
  stepperContainer: {
    padding: 15,
    width: 500,
    minWidth: 150,
    border: '0.5px solid grey',
    flexWrap: 'wrap',
    '& .MuiSvgIcon-root.Mui-active': {
      color: '#90caf9',
    },
    '& .MuiSvgIcon-root.Mui-completed': {
      color: '#666666',
    },
  },
  actionContainer: {
    marginTop: 20,
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    '&>*:first-child': {
      width: '100%',
      marginBottom: 8,
    },
    '& > button': {
      width: '30%',
    },
    '& > button > *': {
      textAlign: 'center',
    },
  },
  disabledButton: {
    color: `${theme.palette.primary.contrastText}!important`,
  },
}));

/**
 * Create a customizable Material UI Stepper
 *
 * @param {TypeCustomStepperProps} props the properties passed to the Stepper element
 * @returns {JSX.Element} the created Stepper element
 */
export function CustomStepper(props: TypeCustomStepperProps): JSX.Element {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<any>({});
  const [isReset, setIsReset] = useState<any>(false);
  const classes = useStyles();
  const {
    className,
    style,
    stepperId,
    orientation,
    alternativeLabel,
    nonLinear,
    buttonedLabels,
    steps,
    backButtonText,
    nextButtonText,
    resetButtonText,
  } = props;

  /**
   * Gets the total number of steps in the stepper
   */
  const totalSteps = () => {
    return steps && steps.length;
  };

  /**
   * Returns an array of the completed steps
   */
  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  /**
   * Checks if it is the last step
   */
  const isLastStep = () => {
    return activeStep === totalSteps()! - 1;
  };

  /**
   * Checks if all the steps are completed
   */
  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  /**
   * Moves the stepper status to next step
   */
  const handleNext = () => {
    if (nonLinear) {
      const newActiveStep =
        isLastStep() && !allStepsCompleted()
          ? // find the first step that has been completed
            steps!.findIndex((step: any, i: any) => !(i in completed))
          : activeStep + 1;

      if (allStepsCompleted() && newActiveStep !== totalSteps()) {
        setIsReset(true);
      }

      if (nonLinear && newActiveStep === steps!.length) {
        setIsReset(true);
      }
      setActiveStep(newActiveStep);
    }

    if (!nonLinear) setActiveStep((prevActiveStep) => prevActiveStep + 1);

    if (!nonLinear && activeStep === steps!.length - 1) {
      setIsReset(true);
    }
  };

  /**
   * Moves the stepper stuts to previous step
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  /**
   * When a step is clicked without following all the steps
   */
  const handleStep = (stepIndex: number) => () => {
    setActiveStep(stepIndex);
  };

  /**
   * When the complete step button is clicked to mark it as complete
   */
  const handleComplete = () => {
    const newCompleted: any = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    handleNext();
  };

  /**
   * Resets the stepper progress
   */
  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
    setIsReset(false);
  };

  const stepsOrientation = orientation !== undefined ? orientation : 'horizontal';

  const disabledStepMovement = steps!.findIndex((step: any) => step.disableStepMovement);

  const stepIsDisabled = activeStep === disabledStepMovement;

  return (
    <Box>
      <MaterialStepper
        className={`${classes.stepperContainer} ${className && className}`}
        style={style || undefined}
        id={stepperId || ''}
        orientation={stepsOrientation}
        activeStep={activeStep}
        // eslint-disable-next-line no-nested-ternary
        alternativeLabel={stepsOrientation === 'horizontal' ? (alternativeLabel !== undefined ? alternativeLabel : true) : false}
        nonLinear={nonLinear || buttonedLabels || false}
      >
        {steps?.map((step: any, index: number) => {
          return (
            <Step key={step.label} completed={nonLinear ? completed[index] : undefined}>
              <>
                {buttonedLabels || (
                  <StepLabel>
                    <Typography variant="caption">{step.label}</Typography>
                  </StepLabel>
                )}
                {orientation === 'vertical' && (
                  <StepContent>
                    {typeof step.description === 'string' ? <HtmlToReact htmlContent={step.description} /> : step.description}
                  </StepContent>
                )}
                {buttonedLabels && <StepButton onClick={handleStep(index)}>{step.label}</StepButton>}
              </>
            </Step>
          );
        })}
        <Box className={classes.actionContainer}>
          <>
            <Typography>{isReset ? 'Steps Completed' : `Step ${activeStep + 1}`}</Typography>
            {!isReset && (
              <>
                <Button type="text" disabled={activeStep < 1} className={activeStep < 1 ? classes.disabledButton : ''} onClick={handleBack}>
                  {backButtonText || 'Back'}
                </Button>

                <Button type="text" onClick={handleNext} disabled={stepIsDisabled} className={stepIsDisabled ? classes.disabledButton : ''}>
                  {nextButtonText || 'Next'}
                </Button>

                {nonLinear &&
                  activeStep !== steps!.length &&
                  (completed[activeStep] ? (
                    <Typography variant="caption" sx={{ display: 'inline-block' }}>
                      Step {activeStep + 1} already completed
                    </Typography>
                  ) : (
                    <Button type="text" onClick={handleComplete}>
                      {completedSteps() === totalSteps()! - 1 ? 'Finish' : 'Complete Step'}
                    </Button>
                  ))}
              </>
            )}
            {isReset && (
              <Button type="text" onClick={handleReset}>
                {resetButtonText || 'Reset'}
              </Button>
            )}
          </>
        </Box>
      </MaterialStepper>
    </Box>
  );
}
