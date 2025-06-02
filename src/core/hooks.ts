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

// Update queue for batching state changes (optimized for performance)
const updateQueue = new Set<() => void>();
let isProcessingUpdates = false;

// Optimized debouncing mechanism - reduced frequency for better performance
const pendingUpdates = new Map<string, number>();
const UPDATE_DEBOUNCE_MS = 8; // Reduced from 16ms for smoother scrolling

// Component context management with stack for nested components
interface ComponentContext {
  id: string;
  hookIndex: number;
}

// Component update callbacks - optimized with WeakMap for better memory management
const componentUpdateCallbacks = new Map<string, () => void>();

// Performance monitoring
const _updateCount = 0;
const _lastUpdateTime = 0;

// Component context stack for nested components
const componentContextStack: ComponentContext[] = [];
let currentComponentId: string | null = null;
let currentHookIndex = 0;

// Debug mode flag - REDUCED LOGGING
const debugMode = false;

// Track if we're in a component rendering context
let isRenderingComponent = false;

// ============================================================================
// Core Hook System Functions
// ============================================================================

/**
 * Set the current component context for hooks to operate within
 * This is the primary entry point for hook context management
 */
export function setComponentContext(componentId: string, updateCallback?: () => void): void {
  // Validate componentId
  if (!componentId || componentId === 'undefined' || componentId === 'null') {
    return;
  }
  
  // Save previous context to stack if exists
  if (currentComponentId) {
    componentContextStack.push({
      id: currentComponentId,
      hookIndex: currentHookIndex
    });
  }
  
  // Set new context
  currentComponentId = componentId;
  currentHookIndex = 0;
  isRenderingComponent = true;
  
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
 * Clear the current component context and restore previous context if available
 */
export function clearComponentContext(): void {
  // Pop previous context from stack if available
  const previousContext = componentContextStack.pop();
  if (previousContext) {
    currentComponentId = previousContext.id;
    currentHookIndex = previousContext.hookIndex;
    isRenderingComponent = componentContextStack.length > 0;
  } else {
    // No previous context, clear everything
    currentComponentId = null;
    currentHookIndex = 0;
    isRenderingComponent = false;
  }
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
 * Queue a component update - FIXED TO ACTUALLY RE-RENDER COMPONENTS
 */
function queueUpdate(componentId: string): void {
  // Validate componentId
  if (!componentId || componentId === 'undefined' || componentId === 'null') {
    console.warn('[0x1 Hooks] Invalid componentId for queueUpdate:', componentId);
    return;
  }
  
  console.log(`[0x1 Hooks] Queuing update for component: ${componentId}`);
  
  const updateCallback = componentUpdateCallbacks.get(componentId);
  if (!updateCallback) {
    console.warn(`[0x1 Hooks] No update callback found for component: ${componentId}`);
    // FALLBACK: Try to force a global re-render via router
    if (typeof window !== 'undefined' && (window as any).__0x1_router) {
      console.log('[0x1 Hooks] Fallback: Triggering router refresh');
      try {
        (window as any).__0x1_router.refresh();
      } catch (e) {
        console.warn('[0x1 Hooks] Router refresh failed:', e);
      }
    }
    return;
  }
  
  // SIMPLIFIED APPROACH: Just call the update callback directly
  console.log(`[0x1 Hooks] Calling update callback for ${componentId}`);
  try {
    updateCallback();
    console.log(`[0x1 Hooks] Update callback completed for ${componentId}`);
  } catch (error) {
    console.error(`[0x1 Hooks] Update error for ${componentId}:`, error);
  }
  
  // ADDITIONAL: Queue for microtask processing
  updateQueue.add(updateCallback);
  
  if (!isProcessingUpdates) {
    isProcessingUpdates = true;
    queueMicrotask(() => {
      const updates = Array.from(updateQueue);
      updateQueue.clear();
      isProcessingUpdates = false;
      
      console.log(`[0x1 Hooks] Processing ${updates.length} queued updates`);
      updates.forEach((update, index) => {
        try {
          console.log(`[0x1 Hooks] Executing queued update ${index + 1}`);
          update();
        } catch (error) {
          handleError(error, 'component update');
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
// Browser Bridge - For Router Integration
// ============================================================================

/**
 * Global browser-compatible hook context entry function
 * This function is exposed to the browser environment for the router to use
 */
export function enterComponentContext(componentId: string, updateCallback?: () => void): void {
  setComponentContext(componentId, updateCallback);
}

/**
 * Global browser-compatible hook context exit function
 * This function is exposed to the browser environment for the router to use
 */
export function exitComponentContext(): void {
  clearComponentContext();
}

/**
 * Trigger component update - used by router to force re-render
 */
export function triggerComponentUpdate(componentId: string): void {
  // Validate componentId
  if (!componentId || componentId === 'undefined' || componentId === 'null') {
    return;
  }
  
  queueUpdate(componentId);
}

/**
 * Initialize browser compatibility
 * This function attaches the hook context functions to the window object
 */
export function initializeBrowserCompat(): void {
  if (typeof window !== 'undefined') {
    // Set up window globals for hook context management
    (window as any).__0x1_enterComponentContext = enterComponentContext;
    (window as any).__0x1_exitComponentContext = exitComponentContext;
    (window as any).__0x1_triggerUpdate = triggerComponentUpdate;
    
    // CRITICAL FIX: Add mount effects system for immediate execution
    (window as any).__0x1_markComponentMounted = markComponentMounted;
    (window as any).__0x1_executeMountEffects = executeMountEffects;
    
    // Add debug flag for verbose logging
    (window as any).__0x1_debug = (window as any).__0x1_debug || false;
    
    // Compatibility for React hooks
    if (!(window as any).React) {
      (window as any).React = {};
    }
    
    // Attach hook functions to React for compatibility
    (window as any).React.useState = useState;
    (window as any).React.useEffect = useEffect;
    (window as any).React.useLayoutEffect = useLayoutEffect;
    (window as any).React.useRef = useRef;
    (window as any).React.useMemo = useMemo;
    (window as any).React.useCallback = useCallback;
    
    // Add global hook tracking for hook-aware tools
    (window as any).__0x1_hooks = {
      isInitialized: true,
      componentRegistry,
      updateQueue,
      componentContextStack,
      currentComponentId,
      currentHookIndex,
      isRenderingComponent
    };
    
    // CRITICAL FIX: Add hooks system to be accessible from polyfill system
    (window as any).__0x1_hooksSystem = {
      isInitialized: true,
      forceUpdateAll: forceUpdateAllComponents,
      triggerUpdate: triggerComponentUpdate,
      getAllComponents: () => Array.from(componentRegistry.keys()),
      getComponentData: (id: string) => componentRegistry.get(id),
      setComponentContext,
      clearComponentContext
    };
  }
}

/**
 * Force update all mounted components - CRITICAL for polyfill system
 */
export function forceUpdateAllComponents(): void {
  let updatedCount = 0;
  
  // Update all mounted components
  for (const [componentId, data] of componentRegistry.entries()) {
    if (data.isMounted) {
      queueUpdate(componentId);
      updatedCount++;
    }
  }
  
  // CRITICAL FIX: Add polyfill-ready flag and callback for components that mount later
  if (typeof window !== 'undefined') {
    // Set global flag so components can check on mount
    (window as any).__0x1_polyfillsReady = true;
    
    // Create a registry for late-mounting components  
    if (!(window as any).__0x1_lateComponentCallbacks) {
      (window as any).__0x1_lateComponentCallbacks = [];
    }
    
    // Execute any waiting callbacks
    const callbacks = (window as any).__0x1_lateComponentCallbacks || [];
    
    callbacks.forEach((callback: any, index: number) => {
      try {
        callback();
      } catch (error) {
        console.error(`[0x1 Hooks] Error in late callback ${index + 1}:`, error);
      }
    });
    
    // Clear the callbacks after execution
    (window as any).__0x1_lateComponentCallbacks = [];
  }
}

// ============================================================================
// Hook Implementations
// ============================================================================

/**
 * useState - Manage component state - FIXED FOR ASYNC CONTEXT
 */
export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prevValue: T) => T)) => void] {
  if (!currentComponentId) {
    throw new Error('[0x1 Hooks] useState must be called within a component context');
  }

  const data = getCurrentComponentData();
  const hookIndex = data.hookIndex++;
  
  // CRITICAL FIX: Capture the component ID at useState creation time
  const componentIdSnapshot = currentComponentId;

  // Initialize state if it doesn't exist
  if (hookIndex >= data.states.length) {
    const computedInitialValue = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
    data.states[hookIndex] = computedInitialValue;
  }

  const currentValue = data.states[hookIndex] as T;
  
  const setValue = (newValue: T | ((prevValue: T) => T)) => {
    const data = componentRegistry.get(componentIdSnapshot);
    if (!data) {
      console.warn(`[0x1 Hooks] No component data found for ${componentIdSnapshot}`);
      return;
    }

    const prevValue = data.states[hookIndex] as T;
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prevValue: T) => T)(prevValue) 
      : newValue;

    // Only update if value actually changed
    if (prevValue !== nextValue) {
      data.states[hookIndex] = nextValue;
      
      // Trigger re-render by calling the update callback
      const updateCallback = componentUpdateCallbacks.get(componentIdSnapshot);
      if (updateCallback) {
        updateCallback();
      }
    }
  };

  return [currentValue, setValue];
}

/**
 * useEffect - Handle side effects - INSTANT EXECUTION
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
    
    // Clean up previous effect
    if (effectData.cleanup) {
      try {
        effectData.cleanup();
      } catch (error) {
        console.error('[0x1 Hooks] Effect cleanup error:', error);
      }
      effectData.cleanup = undefined;
    }
    
    // Execute effects immediately - no delays!
    try {
      const result = effect();
      if (typeof result === 'function') {
        effectData.cleanup = result;
      }
    } catch (error) {
      console.error('[0x1 Hooks] Effect error:', error);
    }
  }
}

/**
 * useLayoutEffect - Handle layout effects synchronously
 * Runs synchronously after all DOM mutations but before browser paint
 */
export function useLayoutEffect(effect: () => void | (() => void), deps?: any[]): void {
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
    
    // Run effect synchronously (before browser paint)
    // This is the key difference from useEffect
    try {
      // Clean up previous effect
      if (effectData.cleanup && typeof effectData.cleanup === 'function') {
        effectData.cleanup();
      }
      
      // Run new effect immediately (synchronous)
      const cleanup = effect();
      effectData.cleanup = cleanup;
    } catch (error) {
      handleError(error, 'useLayoutEffect');
    }
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
        handleError(error, 'effect cleanup');
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
 * Mark component as mounted and initialize it
 */
export function markComponentMounted(componentId: string): void {
  const componentData = componentRegistry.get(componentId);
  if (componentData) {
    componentData.isMounted = true;
  }
}

/**
 * Execute mount effects immediately for better UX
 * This runs effects with empty dependency arrays right away
 */
export function executeMountEffects(componentId: string): void {
  const componentData = componentRegistry.get(componentId);
  if (!componentData) {
    return;
  }
  
  // Execute effects with empty dependency arrays immediately
  componentData.effects.forEach((effectData, index) => {
    // Only execute mount effects (empty deps array or no deps)
    if (!effectData.deps || effectData.deps.length === 0) {
      try {
        // Clean up any previous effect
        if (effectData.cleanup && typeof effectData.cleanup === 'function') {
          effectData.cleanup();
        }
        
        // Run the effect immediately
        const cleanup = effectData.effect();
        effectData.cleanup = cleanup;
      } catch (error) {
        console.error(`[0x1 Hooks] Error executing mount effect for ${componentId}:`, error);
        handleError(error, `mount effect for ${componentId}`);
      }
    }
  });
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
  if (component && component.id) {
    setComponentContext(component.id, component.update);
  }
}

/**
 * @deprecated Use clearComponentContext instead
 */
export function resetHookContext(): void {
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
// Debug and Production Error Handling
// ============================================================================

/**
 * Production-safe error handler - SIMPLIFIED
 */
function handleError(error: any, context: string): void {
  console.error(`[0x1 Hooks] Error in ${context}:`, error);
}

/**
 * Enable debug mode for verbose logging
 */
export function enableDebugMode(): void {
  if (typeof window !== 'undefined') {
    (window as any).__0x1_debug = true;
  }
}

/**
 * Disable debug mode
 */
export function disableDebugMode(): void {
  if (typeof window !== 'undefined') {
    (window as any).__0x1_debug = false;
  }
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__0x1_debug;
}

// ============================================================================
// Exports
// ============================================================================

export {
  clearComponentContext as clearContext,
  getAllComponentStats as getAllStats,
  getComponentStats as getStats,
  isComponentMounted as isMounted,
  setComponentContext as setContext,
  unmountComponent as unmount
};

// Default export for convenience
export default {
  useState,
  useEffect,
  useLayoutEffect,
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
  getAllComponentStats,
  enableDebugMode,
  disableDebugMode,
  isDebugMode
};

// Export the RefObject type
export type { RefObject };

// ============================================================================
// Auto-Initialize Browser Compatibility - SIMPLIFIED
// ============================================================================

// Initialize browser compatibility automatically when module loads
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after all module code is parsed
  setTimeout(() => {
    initializeBrowserCompat();
  }, 0);
}
