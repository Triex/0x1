/**
 * 0x1 Hooks System
 * React-compatible hooks implementation with optimized state management
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

interface EffectData {
  effect: () => void | (() => void);
  cleanup?: (() => void) | void;
  deps?: any[] | undefined;
}

interface MemoData {
  value: any;
  deps: any[];
}

interface CallbackData {
  callback: any;
  deps: any[];
}

interface RefData {
  current: any;
}

interface ComponentData {
  states: any[];
  effects: EffectData[];
  memos: MemoData[];
  callbacks: CallbackData[];
  refs: RefData[];
  hookIndex: number;
  isMounted: boolean;
}

// Custom RefObject type (instead of React.RefObject)
interface RefObject<T> {
  current: T | null;
}

// ============================================================================
// Global State Management
// ============================================================================

// Component registry - maps component ID to its hook data
const componentRegistry = new Map<string, ComponentData>();

// Update queue for batching state changes
const updateQueue = new Set<() => void>();
let isProcessingUpdates = false;

// Current component context
let currentComponentId: string | null = null;
let currentHookIndex = 0;

// Component update callbacks
const componentUpdateCallbacks = new Map<string, () => void>();

// ============================================================================
// Core Hook System Functions
// ============================================================================

/**
 * Set the current component context for hooks to operate within
 */
export function setComponentContext(componentId: string, updateCallback?: () => void): void {
  currentComponentId = componentId;
  currentHookIndex = 0;
  
  // Initialize component data if it doesn't exist
  if (!componentRegistry.has(componentId)) {
    componentRegistry.set(componentId, {
      states: [],
      effects: [],
      memos: [],
      callbacks: [],
      refs: [],
      hookIndex: 0,
      isMounted: false
    });
  }
  
  // Store update callback for this component
  if (updateCallback) {
    componentUpdateCallbacks.set(componentId, updateCallback);
  }
  
  const componentData = componentRegistry.get(componentId)!;
  componentData.isMounted = true;
  componentData.hookIndex = 0;
}

/**
 * Clear the current component context
 */
export function clearComponentContext(): void {
  currentComponentId = null;
  currentHookIndex = 0;
}

/**
 * Get the current component data or throw if not in component context
 */
function getCurrentComponentData(): ComponentData {
  if (!currentComponentId) {
    throw new Error('[0x1 Hooks] Hook called outside of component context');
  }
  
  const componentData = componentRegistry.get(currentComponentId);
  if (!componentData) {
    throw new Error('[0x1 Hooks] Component data not found');
  }
  
  return componentData;
}

/**
 * Queue a component update
 */
function queueUpdate(componentId: string): void {
  const updateCallback = componentUpdateCallbacks.get(componentId);
  if (!updateCallback) {
    console.warn(`[0x1 Hooks] No update callback found for component: ${componentId}`);
    return;
  }
  
  updateQueue.add(updateCallback);
  
  if (!isProcessingUpdates) {
    isProcessingUpdates = true;
    // Process updates in next microtask to batch them
    queueMicrotask(() => {
      const updates = Array.from(updateQueue);
      updateQueue.clear();
      isProcessingUpdates = false;
      
      // Execute all updates
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.error('[0x1 Hooks] Error during component update:', error);
        }
      });
    });
  }
}

/**
 * Compare two dependency arrays for changes
 */
function depsChanged(oldDeps: any[] | undefined, newDeps: any[] | undefined): boolean {
  if (oldDeps === undefined || newDeps === undefined) {
    return oldDeps !== newDeps;
  }
  
  if (oldDeps.length !== newDeps.length) {
    return true;
  }
  
  return oldDeps.some((dep, index) => !Object.is(dep, newDeps[index]));
}

// ============================================================================
// Hook Implementations
// ============================================================================

/**
 * useState - Manage component state
 */
export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prevValue: T) => T)) => void] {
  const componentData = getCurrentComponentData();
  const hookIndex = currentHookIndex++;
  
  // Initialize state if needed
  if (componentData.states.length <= hookIndex) {
    const value = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
    componentData.states[hookIndex] = value;
  }
  
  const state = componentData.states[hookIndex];
  
  const setState = (newValue: T | ((prevValue: T) => T)) => {
    const currentValue = componentData.states[hookIndex];
    const nextValue = typeof newValue === 'function'
      ? (newValue as (prevValue: T) => T)(currentValue)
      : newValue;
    
    // Only update if value actually changed
    if (!Object.is(currentValue, nextValue)) {
      componentData.states[hookIndex] = nextValue;
      queueUpdate(currentComponentId!);
    }
  };
  
  return [state, setState];
}

/**
 * useEffect - Handle side effects
 */
export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  const componentData = getCurrentComponentData();
  const hookIndex = currentHookIndex++;
  
  // Initialize effect data if needed
  if (componentData.effects.length <= hookIndex) {
    componentData.effects[hookIndex] = {
      effect,
      cleanup: undefined,
      deps: undefined
    };
  }
  
  const effectData = componentData.effects[hookIndex];
  const hasChanged = depsChanged(effectData.deps, deps);
  
  if (hasChanged) {
    // Store new dependencies
    effectData.deps = deps ? [...deps] : undefined;
    effectData.effect = effect;
    
    // Schedule effect to run after render
    queueMicrotask(() => {
      try {
        // Clean up previous effect
        if (effectData.cleanup && typeof effectData.cleanup === 'function') {
          effectData.cleanup();
        }
        
        // Run new effect
        const cleanup = effect();
        effectData.cleanup = cleanup;
      } catch (error) {
        console.error('[0x1 useEffect] Error in effect:', error);
      }
    });
  }
}

/**
 * useMemo - Memoize computed values
 */
export function useMemo<T>(factory: () => T, deps: any[]): T {
  const componentData = getCurrentComponentData();
  const hookIndex = currentHookIndex++;
  
  // Initialize memo data if needed
  if (componentData.memos.length <= hookIndex) {
    componentData.memos[hookIndex] = {
      value: factory(),
      deps: [...deps]
    };
  }
  
  const memoData = componentData.memos[hookIndex];
  
  // Recompute if dependencies changed
  if (depsChanged(memoData.deps, deps)) {
    memoData.value = factory();
    memoData.deps = [...deps];
  }
  
  return memoData.value;
}

/**
 * useCallback - Memoize functions
 */
export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  return useMemo(() => callback, deps);
}

/**
 * useRef - Create a mutable ref object
 */
export function useRef<T = any>(initialValue: T | null = null): RefObject<T> {
  const componentData = getCurrentComponentData();
  const hookIndex = currentHookIndex++;
  
  // Initialize ref if needed
  if (componentData.refs.length <= hookIndex) {
    componentData.refs[hookIndex] = {
      current: initialValue
    };
  }
  
  return componentData.refs[hookIndex] as RefObject<T>;
}

// ============================================================================
// Component Lifecycle Management
// ============================================================================

/**
 * Clean up component when it unmounts
 */
export function unmountComponent(componentId: string): void {
  const componentData = componentRegistry.get(componentId);
  if (!componentData) return;
  
  // Mark as unmounted
  componentData.isMounted = false;
  
  // Clean up all effects
  componentData.effects.forEach(effectData => {
    if (effectData.cleanup && typeof effectData.cleanup === 'function') {
      try {
        effectData.cleanup();
      } catch (error) {
        console.error('[0x1 Hooks] Error cleaning up effect:', error);
      }
    }
  });
  
  // Remove from registry
  componentRegistry.delete(componentId);
  componentUpdateCallbacks.delete(componentId);
}

/**
 * Check if component is mounted
 */
export function isComponentMounted(componentId: string): boolean {
  const componentData = componentRegistry.get(componentId);
  return componentData?.isMounted ?? false;
}

/**
 * Get component statistics (for debugging)
 */
export function getComponentStats(componentId: string) {
  const componentData = componentRegistry.get(componentId);
  if (!componentData) return null;
  
  return {
    id: componentId,
    states: componentData.states.length,
    effects: componentData.effects.length,
    memos: componentData.memos.length,
    callbacks: componentData.callbacks.length,
    refs: componentData.refs.length,
    isMounted: componentData.isMounted
  };
}

/**
 * Get all component statistics (for debugging)
 */
export function getAllComponentStats() {
  return Array.from(componentRegistry.keys()).map(getComponentStats).filter(Boolean);
}

// ============================================================================
// Legacy Support (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use setComponentContext instead
 */
export function setCurrentComponent(component: any): void {
  console.warn('[0x1 Hooks] setCurrentComponent is deprecated, use setComponentContext instead');
  if (component && component.id) {
    setComponentContext(component.id, component.update);
  }
}

/**
 * @deprecated Use clearComponentContext instead
 */
export function resetHookContext(): void {
  console.warn('[0x1 Hooks] resetHookContext is deprecated, use clearComponentContext instead');
  clearComponentContext();
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * useClickOutside - Detect clicks outside of an element
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): RefObject<T> {
  const ref = useRef<T>(null);

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

/**
 * useFetch - Fetch data with loading and error states
 */
export function useFetch<T = any>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setError(error);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, JSON.stringify(options)]);

  return { data, loading, error };
}

/**
 * useForm - Form state management with validation
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name] && validationRules?.[name]) {
      const error = validationRules[name]!(value);
      setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }
  }, [touched, validationRules]);

  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  const validateField = useCallback((name: keyof T) => {
    if (!validationRules?.[name]) return null;
    
    const error = validationRules[name]!(values[name]);
    setErrors(prev => ({ ...prev, [name]: error || undefined }));
    return error;
  }, [values, validationRules]);

  const validateAll = useCallback(() => {
    if (!validationRules) return true;
    
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(key => {
      const error = validationRules[key as keyof T]!(values[key as keyof T]);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    return (event?: Event | { preventDefault?: () => void }) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      
      if (validateAll()) {
        onSubmit(values);
      }
    };
  }, [values, validateAll]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    handleSubmit,
    isValid: Object.keys(errors).filter(key => errors[key as keyof T]).length === 0
  };
}

/**
 * useLocalStorage - Sync state with localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get value from localStorage on initialization
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`[0x1 useLocalStorage] Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = typeof value === 'function' ? (value as any)(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`[0x1 useLocalStorage] Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.warn(`[0x1 useLocalStorage] Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// ============================================================================
// Exports
// ============================================================================

export {
  clearComponentContext as clearContext, getAllComponentStats as getAllStats, getComponentStats as getStats, isComponentMounted as isMounted, setComponentContext as setContext, unmountComponent as unmount
};

// Default export for convenience
export default {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  setComponentContext,
  clearComponentContext,
  unmountComponent,
  isComponentMounted,
  getComponentStats,
  getAllComponentStats
};

// Export the RefObject type
export type { RefObject };
