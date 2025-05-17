/**
 * 0x1 Hooks System
 * Provides React-like hooks for state management and effects
 */

// Current component context for hooks
let currentComponent: any = null;
let currentIndex = 0;

// Store for component states
const componentStates = new Map<any, any[]>();
const componentEffects = new Map<any, EffectState[]>();
const componentCleanups = new Map<any, (() => void)[]>();

interface EffectState {
  deps: any[] | undefined;
  cleanup: (() => void) | undefined;
}

/**
 * Set the current component context for hooks
 */
export function setCurrentComponent(component: any): void {
  currentComponent = component;
  currentIndex = 0;
}

/**
 * Reset the hook context after rendering
 */
export function resetHookContext(): void {
  currentComponent = null;
  currentIndex = 0;
}

/**
 * The useState hook for managing component state
 */
export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prevState: T) => T)) => void] {
  if (!currentComponent) {
    throw new Error('useState must be called within a component');
  }

  // Get or initialize state for this component
  if (!componentStates.has(currentComponent)) {
    componentStates.set(currentComponent, []);
  }

  const states = componentStates.get(currentComponent)!;
  const stateIndex = currentIndex++;

  // Initialize state if needed
  if (states.length <= stateIndex) {
    // Handle function initializer
    states[stateIndex] = typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }

  const state = states[stateIndex];

  // Create setter function
  const setState = (newValue: T | ((prevState: T) => T)) => {
    const states = componentStates.get(currentComponent)!;
    const prevState = states[stateIndex];
    
    // Handle function updater
    const nextState = typeof newValue === 'function'
      ? (newValue as ((prevState: T) => T))(prevState)
      : newValue;

    // Only update and trigger render if state changed
    if (prevState !== nextState) {
      states[stateIndex] = nextState;
      
      // Trigger re-render
      if (currentComponent.update) {
        currentComponent.update();
      }
    }
  };

  return [state, setState];
}

/**
 * The useEffect hook for side effects
 */
export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  if (!currentComponent) {
    throw new Error('useEffect must be called within a component');
  }
  
  // Get or initialize effects for this component
  if (!componentEffects.has(currentComponent)) {
    componentEffects.set(currentComponent, []);
    componentCleanups.set(currentComponent, []);
  }

  const effects = componentEffects.get(currentComponent)!;
  const cleanups = componentCleanups.get(currentComponent)!;
  const effectIndex = currentIndex++;

  // Initialize effect if needed
  if (effects.length <= effectIndex) {
    effects.push({ deps: undefined, cleanup: undefined });
  }

  const currentEffect = effects[effectIndex];
  
  // Check if dependencies changed
  const depsChanged = !deps || !currentEffect.deps || 
    deps.length !== currentEffect.deps.length ||
    deps.some((dep, i) => dep !== currentEffect.deps![i]);

  // Store new dependencies
  currentEffect.deps = deps;

  // Schedule effect to run after render if deps changed
  if (depsChanged) {
    // We'll run the effect after the render is complete
    queueMicrotask(() => {
      // Clean up previous effect
      if (currentEffect.cleanup) {
        currentEffect.cleanup();
      }

      // Run new effect
      const cleanup = effect();
      currentEffect.cleanup = typeof cleanup === 'function' ? cleanup : undefined;

      // Store cleanup for component unmount
      if (currentEffect.cleanup) {
        cleanups[effectIndex] = currentEffect.cleanup;
      }
    });
  }
}

/**
 * The useMemo hook for memoizing computed values
 */
export function useMemo<T>(factory: () => T, deps: any[]): T {
  if (!currentComponent) {
    throw new Error('useMemo must be called within a component');
  }

  // Get or initialize memo state for this component
  if (!componentStates.has(currentComponent)) {
    componentStates.set(currentComponent, []);
  }

  const states = componentStates.get(currentComponent)!;
  const memoIndex = currentIndex++;

  // Initialize memo state if needed
  if (states.length <= memoIndex) {
    states[memoIndex] = { value: factory(), deps };
  } else {
    const memo = states[memoIndex];
    
    // Check if dependencies changed
    const depsChanged = !deps || !memo.deps || 
      deps.length !== memo.deps.length ||
      deps.some((dep, i) => dep !== memo.deps[i]);

    // Recompute if deps changed
    if (depsChanged) {
      memo.value = factory();
      memo.deps = deps;
    }
  }

  return states[memoIndex].value;
}

/**
 * The useCallback hook for memoizing functions
 */
export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  return useMemo(() => callback, deps);
}

/**
 * The useRef hook for persisting values between renders
 */
export function useRef<T>(initialValue: T): { current: T } {
  if (!currentComponent) {
    throw new Error('useRef must be called within a component');
  }

  // Get or initialize ref state for this component
  if (!componentStates.has(currentComponent)) {
    componentStates.set(currentComponent, []);
  }

  const states = componentStates.get(currentComponent)!;
  const refIndex = currentIndex++;

  // Initialize ref if needed
  if (states.length <= refIndex) {
    states[refIndex] = { current: initialValue };
  }

  return states[refIndex];
}

/**
 * Runs when a component is unmounted
 */
export function unmountComponent(component: any): void {
  // Run all cleanup functions
  if (componentCleanups.has(component)) {
    const cleanups = componentCleanups.get(component)!;
    for (const cleanup of cleanups) {
      if (cleanup) {
        cleanup();
      }
    }
  }
  
  // Clear component state
  componentStates.delete(component);
  componentEffects.delete(component);
  componentCleanups.delete(component);
}

/**
 * Custom hook for managing forms
 */
export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const name = target.name as keyof T;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    setValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBlur = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const name = target.name as keyof T;
    
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues,
    setErrors,
    reset
  };
}

/**
 * Custom hook for fetching data
 */
export function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, JSON.stringify(options)]);
  
  return { data, loading, error };
}

/**
 * Custom hook for local storage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [storedValue, setValue] as [T, (value: T | ((val: T) => T)) => void];
}

/**
 * Custom hook for handling clicks outside an element
 */
export function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T | null>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);
  
  return ref;
}
