/**
 * 0x1 Animation Utilities
 * Lightweight animation helpers for smooth transitions
 */

// Animation timing functions
export const easings = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};

// Animation options
export interface AnimationOptions {
  duration?: number; // in milliseconds
  easing?: (t: number) => number;
  delay?: number;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

/**
 * Animates a value from start to end
 */
export function animate(
  start: number,
  end: number,
  options: AnimationOptions = {}
): { stop: () => void } {
  const {
    duration = 300,
    easing = easings.easeOutQuad,
    delay = 0,
    onUpdate,
    onComplete
  } = options;
  
  let startTime: number | null = null;
  let rafId: number | null = null;
  let isStopped = false;
  
  function step(timestamp: number) {
    if (isStopped) return;
    if (startTime === null) {
      startTime = timestamp;
    }
    
    const elapsed = timestamp - startTime;
    
    if (elapsed < delay) {
      rafId = requestAnimationFrame(step);
      return;
    }
    
    const adjustedElapsed = elapsed - delay;
    
    if (adjustedElapsed >= duration) {
      onUpdate?.(end);
      onComplete?.();
      return;
    }
    
    const progress = easing(Math.min(adjustedElapsed / duration, 1));
    const currentValue = start + (end - start) * progress;
    
    onUpdate?.(currentValue);
    rafId = requestAnimationFrame(step);
  }
  
  // Start animation on next frame
  rafId = requestAnimationFrame(step);
  
  // Return a stop function
  return {
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      isStopped = true;
    }
  };
}

/**
 * Fade in animation
 */
export function fadeIn(element: HTMLElement, options: AnimationOptions = {}): { stop: () => void } {
  element.style.opacity = '0';
  element.style.display = '';
  
  return animate(0, 1, {
    duration: options.duration ?? 200,
    easing: options.easing ?? easings.easeOutQuad,
    delay: options.delay,
    onUpdate: (value) => {
      element.style.opacity = String(value);
    },
    onComplete: options.onComplete
  });
}

/**
 * Fade out animation
 */
export function fadeOut(element: HTMLElement, options: AnimationOptions = {}): { stop: () => void } {
  element.style.opacity = '1';
  
  return animate(1, 0, {
    duration: options.duration ?? 200,
    easing: options.easing ?? easings.easeOutQuad,
    delay: options.delay,
    onUpdate: (value) => {
      element.style.opacity = String(value);
    },
    onComplete: () => {
      element.style.display = 'none';
      options.onComplete?.();
    }
  });
}

/**
 * Slide down animation
 */
export function slideDown(element: HTMLElement, options: AnimationOptions = {}): { stop: () => void } {
  // Store original height
  element.style.display = '';
  const height = element.scrollHeight;
  element.style.overflow = 'hidden';
  element.style.height = '0px';
  element.style.opacity = '0';
  
  return animate(0, height, {
    duration: options.duration ?? 300,
    easing: options.easing ?? easings.easeOutCubic,
    delay: options.delay,
    onUpdate: (value) => {
      element.style.height = `${value}px`;
      element.style.opacity = String(Math.min(value / height, 1));
    },
    onComplete: () => {
      element.style.height = '';
      element.style.overflow = '';
      options.onComplete?.();
    }
  });
}

/**
 * Slide up animation
 */
export function slideUp(element: HTMLElement, options: AnimationOptions = {}): { stop: () => void } {
  const height = element.scrollHeight;
  element.style.overflow = 'hidden';
  element.style.height = `${height}px`;
  
  return animate(height, 0, {
    duration: options.duration ?? 300,
    easing: options.easing ?? easings.easeOutCubic,
    delay: options.delay,
    onUpdate: (value) => {
      element.style.height = `${value}px`;
      element.style.opacity = String(Math.max(value / height, 0));
    },
    onComplete: () => {
      element.style.display = 'none';
      element.style.height = '';
      element.style.overflow = '';
      options.onComplete?.();
    }
  });
}

/**
 * Animate multiple properties simultaneously
 */
export function animateProperties(
  element: HTMLElement,
  properties: Record<string, { from: number; to: number; unit?: string }>,
  options: AnimationOptions = {}
): { stop: () => void } {
  // Setup initial values
  Object.entries(properties).forEach(([prop, { from, unit = 'px' }]) => {
    (element.style as any)[prop] = `${from}${unit}`;
  });
  
  const { duration = 300, easing = easings.easeOutQuad, delay = 0, onComplete } = options;
  
  let startTime: number | null = null;
  let rafId: number | null = null;
  let isStopped = false;
  
  function step(timestamp: number) {
    if (isStopped) return;
    if (startTime === null) {
      startTime = timestamp;
    }
    
    const elapsed = timestamp - startTime;
    
    if (elapsed < delay) {
      rafId = requestAnimationFrame(step);
      return;
    }
    
    const adjustedElapsed = elapsed - delay;
    
    if (adjustedElapsed >= duration) {
      // Set final values
      Object.entries(properties).forEach(([prop, { to, unit = 'px' }]) => {
        (element.style as any)[prop] = `${to}${unit}`;
      });
      
      onComplete?.();
      return;
    }
    
    const progress = easing(Math.min(adjustedElapsed / duration, 1));
    
    // Update all properties
    Object.entries(properties).forEach(([prop, { from, to, unit = 'px' }]) => {
      const current = from + (to - from) * progress;
      (element.style as any)[prop] = `${current}${unit}`;
    });
    
    rafId = requestAnimationFrame(step);
  }
  
  // Start animation on next frame
  rafId = requestAnimationFrame(step);
  
  // Return a stop function
  return {
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      isStopped = true;
    }
  };
}

/**
 * Spring animation for more natural motion
 */
export function spring(
  element: HTMLElement,
  property: keyof CSSStyleDeclaration,
  target: number,
  options: {
    stiffness?: number;
    damping?: number;
    precision?: number;
    unit?: string;
    onComplete?: () => void;
  } = {}
): { stop: () => void } {
  const {
    stiffness = 0.1,
    damping = 0.8,
    precision = 0.01,
    unit = 'px',
    onComplete
  } = options;
  
  // Get current value
  let current = parseFloat((element.style as any)[property] || '0');
  let velocity = 0;
  let rafId: number | null = null;
  let isStopped = false;
  
  function step() {
    if (isStopped) return;
    
    // Calculate spring physics
    const diff = target - current;
    const acceleration = diff * stiffness;
    velocity = velocity * damping + acceleration;
    current += velocity;
    
    // Update element
    (element.style as any)[property] = `${current}${unit}`;
    
    // Check if we're done (close enough to target)
    if (Math.abs(diff) < precision && Math.abs(velocity) < precision) {
      (element.style as any)[property] = `${target}${unit}`;
      onComplete?.();
      return;
    }
    
    rafId = requestAnimationFrame(step);
  }
  
  // Start animation
  rafId = requestAnimationFrame(step);
  
  // Return stop function
  return {
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      isStopped = true;
    }
  };
}
