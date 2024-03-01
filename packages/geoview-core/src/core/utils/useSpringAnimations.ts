import { useSpring, SpringConfig } from '@react-spring/web';

// Common easing function
const commonConfig: SpringConfig = { duration: 500, easing: (t) => t };

// Fade In animation
export const useFadeIn = (config?: SpringConfig) => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { opacity: 0 },
    to: { opacity: 1 },
  });
};

// Slide In animation
export const useSlideIn = (config?: SpringConfig) => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0%)' },
  });
};

// Scale In animation
export const useScaleIn = (config?: SpringConfig) => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { transform: 'scale(0)' },
    to: { transform: 'scale(1)' },
  });
};

// Rotate animation
export const useRotate = (config?: SpringConfig) => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  });
};

// Color Change animation
export const useColorChange = (config?: SpringConfig) => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { backgroundColor: 'red' },
    to: { backgroundColor: 'blue' },
  });
};
