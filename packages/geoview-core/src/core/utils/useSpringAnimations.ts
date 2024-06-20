import { useSpring, SpringConfig } from '@react-spring/web';

// Common easing function
const commonConfig: SpringConfig = { duration: 500, easing: (t) => t };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpringValues = Record<string, any>;

// Fade In animation
export const useFadeIn = (config?: SpringConfig): SpringValues => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { opacity: 0 },
    to: { opacity: 1 },
  });
};

// Fade In Left animation
export const useFadeInLeft = (config?: SpringConfig): SpringValues => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { opacity: 0, transform: 'translateX(-100%)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  });
};

// Fade In Right animation
export const useFadeInRight = (config?: SpringConfig): SpringValues => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { opacity: 0, transform: 'translateX(100%)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  });
};

// Fade In Up animation
export const useFadeInUp = (config?: SpringConfig): SpringValues => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { opacity: 0, transform: 'translateY(100%)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  });
};

// Fade In Down animation
export const useFadeInDown = (config?: SpringConfig): SpringValues => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { opacity: 0, transform: 'translateY(-100%)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  });
};

// Slide In animation
export const useSlideIn = (config?: SpringConfig): SpringValues => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0%)' },
  });
};

// Scale In animation
export const useScaleIn = (config?: SpringConfig): SpringValues => {
  return useSpring({
    config: { ...commonConfig, ...config },
    from: { transform: 'scale(0)' },
    to: { transform: 'scale(1)' },
  });
};

export const useShake = (config?: SpringConfig): SpringValues => {
  return useSpring({
    from: { x: 0, scale: 1 },
    to: async (next) => {
      await next({ x: 2 }); // Move 10px right and scale up 10%
      await next({ x: -2 }); // Move 10px left and scale down 10%
      await next({ x: 0 }); // Reset position and scale
    },
    config: { ...commonConfig, ...config, duration: 50 }, // Adjust duration for faster shake
    loop: true,
  });
};
