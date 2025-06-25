/**
 * 0x1 Hooks System
 * React-compatible hooks implementation with optimized state management
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

// Extend Window interface for 0x1 error boundary
declare global {
  interface Window {
    __0x1_errorBoundary?: {
      addError: (error: Error, componentName?: string) => void;
      errors: any[];
      listeners: Set<any>;
    };
  }
}

interface EffectData {
  effect: () => void | (() => void);
  cleanup?: (() => void) | void;
  deps?: any[] | undefined;
  id: string;
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
  needsUpdate: boolean;
  updateScheduled: boolean;
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

// Update tracking for performance monitoring
const pendingUpdates = new Map<string, any>(); // Use 'any' to handle both Node.js and browser timeout types

// 🆕 GLOBAL STATE REGISTRY - Cross-component state sharing
const globalStateRegistry = new Map<string, {
  value: any;
  listeners: Set<string>; // Component IDs that listen to this state
  type: 'boolean' | 'string' | 'number' | 'object';
}>();

// 🆕 GLOBAL STATE METHODS
export function setGlobalState<T>(key: string, value: T, type: 'boolean' | 'string' | 'number' | 'object' = 'object'): void {
  const existing = globalStateRegistry.get(key);
  const listeners = existing?.listeners || new Set<string>();
  
  globalStateRegistry.set(key, {
    value,
    listeners,
    type
  });
  
  // Notify all listening components
  listeners.forEach(componentId => {
    triggerComponentUpdate(componentId);
    
    // Trigger visual updates for the state change
    const componentElement = document.querySelector(`[data-component-id="${componentId}"]`);
    if (componentElement) {
      // Find the hook index for this global state in the component
      const componentData = componentRegistry.get(componentId);
      if (componentData) {
        // Trigger visual update for the first matching hook (most global states are primary)
        applyUniversalVisualUpdates(componentElement, componentId, 0, value, existing?.value);
      }
    }
  });
  
      // Silent global state update
}

export function getGlobalState<T>(key: string): T | undefined {
  return globalStateRegistry.get(key)?.value;
}

export function subscribeToGlobalState(key: string, componentId: string): void {
  const existing = globalStateRegistry.get(key);
  if (existing) {
    existing.listeners.add(componentId);
  } else {
    globalStateRegistry.set(key, {
      value: undefined,
      listeners: new Set([componentId]),
      type: 'object'
    });
  }
  
  // Component subscribed to global state
}

export function unsubscribeFromGlobalState(key: string, componentId: string): void {
  const existing = globalStateRegistry.get(key);
  if (existing) {
    existing.listeners.delete(componentId);
  }
}

// 🆕 SPECIALIZED GLOBAL STATE HOOKS
export function useGlobalState<T>(key: string, initialValue: T): [T, (newValue: T | ((prev: T) => T)) => void] {
  // Subscribe current component to this global state
  if (currentComponentId) {
    subscribeToGlobalState(key, currentComponentId);
  }
  
  // Get current value or use initial
  const currentValue = getGlobalState<T>(key) ?? initialValue;
  
  const setValue = (newValue: T | ((prev: T) => T)) => {
    const resolved = typeof newValue === 'function' ? (newValue as (prev: T) => T)(currentValue) : newValue;
    setGlobalState(key, resolved);
  };
  
  return [currentValue, setValue];
}

// 🆕 THEME MANAGEMENT
export function useTheme(): [boolean, (isDark: boolean | ((prev: boolean) => boolean)) => void] {
  const [isDark, setIsDark] = useGlobalState<boolean>('theme.isDark', false);
  
  const setTheme = (newIsDark: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof newIsDark === 'function' ? newIsDark(isDark) : newIsDark;
    
    // Apply theme changes immediately to document
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', resolved);
      document.body.className = resolved ? 'bg-slate-900 text-white' : 'bg-white text-gray-900';
      
      // Save to localStorage
      try {
        localStorage.setItem('0x1-dark-mode', resolved ? 'dark' : 'light');
      } catch (error) {
        console.warn('[0x1 Theme] Could not save theme preference:', error);
      }
    }
    
    setIsDark(resolved);
    // Theme changed
  };
  
  return [isDark, setTheme];
}

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

// 🚨 CRITICAL FIX: Event listener attachment state variables
let mutationObserver: MutationObserver | null = null;
let eventListenersInitialized = false;

// ============================================================================
// Core Hook System Functions
// ============================================================================

/**
 * Set the current component context for hooks to operate within
 * This is the primary entry point for hook context management
 * 🚨 CRITICAL FIX: Enhanced for nested layout support (app/layout + app/(chat)/layout + page)
 */
export function setComponentContext(componentId: string, updateCallback?: () => void): void {
  // Validate componentId
  if (!componentId || componentId === 'undefined' || componentId === 'null') {
    return;
  }
  
  // 🚨 CRITICAL FIX: Enhanced nested layout detection and handling
  const isLayoutComponent = componentId.includes('Layout') || componentId.includes('layout');
  const isRootLayout = componentId.includes('RootLayout') || componentId.includes('rootLayout');
  const isChatLayout = componentId.includes('ChatLayout') || componentId.includes('chatLayout');
  const isPageComponent = componentId.includes('Page') || componentId.includes('page');
  
  // 🚨 CRITICAL FIX: Smart context stack management for nested layouts
  // Only push to stack if we're not dealing with a layout re-initialization
  if (currentComponentId && currentComponentId !== componentId) {
    // Check if this is a layout hierarchy switch (root -> chat -> page)
    const isHierarchySwitch = (
      (isRootLayout && currentComponentId.includes('Chat')) ||
      (isChatLayout && currentComponentId.includes('Page')) ||
      (isPageComponent && currentComponentId.includes('Layout'))
    );
    
    if (!isHierarchySwitch) {
      // Normal component nesting - save context to stack
      componentContextStack.push({
        id: currentComponentId,
        hookIndex: currentHookIndex
      });
    } else {
      // Layout hierarchy switch - clear stack to prevent corruption
      componentContextStack.length = 0;
      console.log(`[0x1 Hooks] 🔄 Layout hierarchy switch detected: ${currentComponentId} -> ${componentId}, stack cleared`);
    }
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
      isMounted: false,
      needsUpdate: false,
      updateScheduled: false
    });
    
    // 🚨 CRITICAL FIX: IMMEDIATE event listener attachment for new components
    if (typeof window !== 'undefined') {
      // IMMEDIATE attachment without timeout - critical for first load
      attachEventListenersToExistingElements();
      attachDataActionHandlers();
    }
  }
  
  // Store update callback for this component
  if (updateCallback) {
    componentUpdateCallbacks.set(componentId, updateCallback);
  }
  
  const componentData = componentRegistry.get(componentId)!;
  componentData.isMounted = true;
  componentData.hookIndex = 0;
  
  console.log(`[0x1 Hooks] ✅ Context set for ${componentId} (stack depth: ${componentContextStack.length})`);
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
  
  let componentData = componentRegistry.get(currentComponentId);
  
  // 🚨 CRITICAL SAFETY: Auto-initialize if somehow missing
  if (!componentData) {
    console.warn(`[0x1 Hooks] ⚠️ Component data missing for ${currentComponentId} - auto-initializing`);
    componentData = {
      states: [],
      effects: [],
      memos: [],
      callbacks: [],
      refs: [],
      hookIndex: 0,
      isMounted: true,
      needsUpdate: false,
      updateScheduled: false
    };
    componentRegistry.set(currentComponentId, componentData);
  }
  
  // 🚨 CRITICAL SAFETY: Ensure all arrays exist
  if (!componentData.states) componentData.states = [];
  if (!componentData.effects) componentData.effects = [];
  if (!componentData.memos) componentData.memos = [];
  if (!componentData.callbacks) componentData.callbacks = [];
  if (!componentData.refs) componentData.refs = [];
  
  return componentData;
}

/**
 * Queue a component update - OPTIMIZED FOR BATCHING
 */
function queueUpdate(componentId: string, priority: UpdatePriority = UpdatePriority.NORMAL): void {
  const componentData = componentRegistry.get(componentId);
  if (!componentData) return;

  // ✅ Prevent duplicate scheduling
  if (componentData.updateScheduled) return;
  
  componentData.updateScheduled = true;
  updateScheduler.scheduleUpdate(componentId, priority);
}

/**
 * Compare two dependency arrays for changes - OPTIMIZED WITH CACHING
 */
function depsChanged(oldDeps: any[] | undefined, newDeps: any[] | undefined): boolean {
  if (!oldDeps || !newDeps) return true;
  if (oldDeps.length !== newDeps.length) return true;
  
  // ✅ Quick reference check first
  if (oldDeps === newDeps) return false;
  
  // ✅ Use cached result if available
  if (depsCache.has(newDeps)) {
    return depsCache.get(newDeps)!;
  }
  
  // ✅ Optimized comparison - bail early on first difference
  for (let i = 0; i < oldDeps.length; i++) {
    if (oldDeps[i] !== newDeps[i]) {
      depsCache.set(newDeps, true);
      return true;
    }
  }
  
  depsCache.set(newDeps, false);
  return false;
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
      isRenderingComponent,
      componentUpdateCallbacks
    };
    
    // CRITICAL FIX: Add hooks system to be accessible from polyfill system
    (window as any).__0x1_hooksSystem = {
      isInitialized: true,
      forceUpdateAll: forceUpdateAllComponents,
      triggerUpdate: triggerComponentUpdate,
      getAllComponents: () => Array.from(componentRegistry.keys()),
      getComponentData: (id: string) => componentRegistry.get(id),
      setComponentContext,
      clearComponentContext,
      componentRegistry // 🚨 CRITICAL: Store render functions for re-rendering
    };
    
    // 🚨 CRITICAL FIX: IMMEDIATE event listener attachment - no delays
    // This ensures ALL elements can receive state change events on first load
    
    // IMMEDIATE attachment if DOM is ready, otherwise wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        attachEventListenersToExistingElements();
        attachDataActionHandlers();
      });
    } else {
      // DOM already ready - attach immediately
      attachEventListenersToExistingElements();
      attachDataActionHandlers();
    }
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
 * useState - Manage component state - PURE DIRECT DOM MANIPULATION (0x1 PHILOSOPHY)
 * 🚨 CRITICAL FIX: Return LIVE state getter, never stale closure values
 */
export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prevValue: T) => T)) => void] {
  if (!currentComponentId) {
    throw new Error('[0x1 Hooks] useState must be called within a component context');
  }

  let data;
  try {
    data = getCurrentComponentData();
  } catch (error) {
    console.error(`[0x1 Hooks] ❌ Failed to get component data for ${currentComponentId}:`, error);
    throw error;
  }
  
  // 🚨 ULTRA DEFENSIVE: Ensure states array exists and is actually an array
  if (!Array.isArray(data.states)) {
    console.warn(`[0x1 Hooks] ⚠️ States is not an array for ${currentComponentId}, fixing...`);
    data.states = [];
  }
  
  // 🚨 ULTRA DEFENSIVE: Ensure hookIndex is a number
  if (typeof data.hookIndex !== 'number') {
    console.warn(`[0x1 Hooks] ⚠️ hookIndex is not a number for ${currentComponentId}, resetting to 0`);
    data.hookIndex = 0;
  }
  
  const hookIndex = data.hookIndex++;
  
  // CRITICAL FIX: Capture the component ID at useState creation time
  const componentIdSnapshot = currentComponentId;

  // 🚨 ULTRA DEFENSIVE: Safe length check
  const statesLength = Array.isArray(data.states) ? data.states.length : 0;
  
  // Initialize state if it doesn't exist
  if (hookIndex >= statesLength) {
    const computedInitialValue = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
    
    // Ensure states array exists before setting
    if (!Array.isArray(data.states)) data.states = [];
    data.states[hookIndex] = computedInitialValue;
  }

  // 🚨 CRITICAL FIX: ALWAYS get current state from registry at access time
  const getCurrentState = (): T => {
    const latestData = componentRegistry.get(componentIdSnapshot);
    if (latestData && Array.isArray(latestData.states) && hookIndex < latestData.states.length) {
      return latestData.states[hookIndex] as T;
    }
    // Fallback to original data with safety checks
    if (Array.isArray(data.states) && hookIndex < data.states.length) {
      return data.states[hookIndex] as T;
    }
    // Ultimate fallback - return initial value
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  };

  // 🚨 RETURN LIVE STATE - Not cached value!
  const currentValue = getCurrentState();

  // 🚨 CRITICAL FIX: LIVE STATE GETTER - Always get current state from registry
    const setValue = (newValue: T | ((prevValue: T) => T)) => {
    // 🚨 CRITICAL FIX: Always read the absolute latest state from registry at execution time
    const latestData = componentRegistry.get(componentIdSnapshot);
    if (!latestData) {
      console.warn(`[0x1 Hooks] No component data found for ${componentIdSnapshot}`);
      return;
    }

    // 🚨 ULTRA DEFENSIVE: Ensure states array exists
    if (!Array.isArray(latestData.states)) {
      console.warn(`[0x1 Hooks] States array missing in setValue for ${componentIdSnapshot}, initializing...`);
      latestData.states = [];
    }

    // ALWAYS get fresh state at execution time, never use closure values
    const currentRegistryValue = (Array.isArray(latestData.states) && hookIndex < latestData.states.length) 
      ? latestData.states[hookIndex] as T
      : getCurrentState(); // Fallback to safe getter
      
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prevValue: T) => T)(currentRegistryValue) 
      : newValue;

    // Only update if value actually changed
    if (currentRegistryValue !== nextValue) {
      // 🚨 ULTRA DEFENSIVE: Ensure we can safely set the state
      if (!Array.isArray(latestData.states)) {
        latestData.states = [];
      }
      // Extend array if needed
      while (latestData.states.length <= hookIndex) {
        latestData.states.push(undefined);
      }
      latestData.states[hookIndex] = nextValue;
      
      // 🎯 0X1 PHILOSOPHY: DIRECT DOM MANIPULATION ONLY - NO RE-RENDERS
      // Find all elements that should respond to this state change
      const componentElements = document.querySelectorAll(`[data-component-id="${componentIdSnapshot}"]`);
      
      if (componentElements.length > 0) {
        // DIRECT DOM UPDATE: Let elements update themselves based on new state
        componentElements.forEach(element => {
          // Set the new state value as a data attribute for components to read
          (element as any).__0x1_state = (element as any).__0x1_state || {};
          (element as any).__0x1_state[hookIndex] = nextValue;
          
          // Trigger custom state-change event for direct DOM manipulation
          const stateChangeEvent = new CustomEvent('0x1-state-change', {
            detail: {
              componentId: componentIdSnapshot,
              hookIndex,
              oldValue: currentRegistryValue,
              newValue: nextValue,
              stateSnapshot: latestData.states.slice() // Copy of all states
            }
          });
          
          element.dispatchEvent(stateChangeEvent);
        });
      }
      
      // FALLBACK: For compatibility with legacy update callbacks (will be removed later)
      const updateCallback = componentUpdateCallbacks.get(componentIdSnapshot);
      if (updateCallback) {
        try {
          updateCallback();
        } catch (error) {
          console.error(`[0x1 Hooks] Legacy update callback failed for ${componentIdSnapshot}:`, error);
        }
      }
    }
  };

  return [currentValue, setValue];
}

/**
 * useEffect - Handle side effects - POST-DOM-CREATION EXECUTION
 */
export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  const componentData = getCurrentComponentData();
  const hookIndex = currentHookIndex++;
  
  // CRITICAL FIX: Capture component ID at useEffect registration time
  const componentIdSnapshot = currentComponentId || 'unknown';
  
  // Initialize effect data if needed
  if (componentData.effects.length <= hookIndex) {
    componentData.effects[hookIndex] = {
      effect,
      cleanup: undefined,
      deps: undefined,
      id: `${componentIdSnapshot}:${hookIndex}`
    };
  }
  
  const effectData = componentData.effects[hookIndex];
  const hasChanged = depsChanged(effectData.deps, deps);
  
  if (hasChanged) {
    // Store new dependencies
    effectData.deps = deps ? [...deps] : undefined;
    effectData.effect = effect; // Store the new effect
    
    // Clean up previous effect immediately
    if (effectData.cleanup) {
      try {
        effectData.cleanup();
      } catch (error) {
        console.error('[0x1 Hooks] Effect cleanup error:', error);
      }
      effectData.cleanup = undefined;
    }
    
    // 🚨 CRITICAL FIX: EXECUTE EFFECTS IMMEDIATELY LIKE BEFORE
    // The post-DOM system was causing infinite loops - reverting to immediate execution
    try {
      const result = effect();
      if (typeof result === 'function') {
        effectData.cleanup = result;
      }
    } catch (error) {
      console.error(`[0x1 Hooks] Effect execution error for ${componentIdSnapshot}:`, error);
    }
  }
}

/**
 * Schedule and execute effects after DOM elements are created
 * 🚨 CRITICAL ARCHITECTURE FIX: This ensures effects run AFTER JSX-to-DOM conversion
 */
let postDomExecutionScheduled = false;

function schedulePostDomEffectExecution(): void {
  if (typeof window === 'undefined' || postDomExecutionScheduled) return;
  
  postDomExecutionScheduled = true;
  // Scheduling post-DOM effect execution
  
  // Use requestAnimationFrame to ensure DOM rendering is complete
  requestAnimationFrame(() => {
    // Add additional delay to ensure JSX-to-DOM conversion is completely finished
    setTimeout(() => {
      executePostDomEffects();
      postDomExecutionScheduled = false;
    }, 10); // Minimal delay after requestAnimationFrame
  });
}

function executePostDomEffects(): void {
  if (typeof window === 'undefined') return;
  
  const effectQueue = (window as any).__0x1_postDomEffectQueue || [];
  if (effectQueue.length === 0) {
    return;
  }
  
  // Clear the queue to prevent duplicate executions
  (window as any).__0x1_postDomEffectQueue = [];
  
  effectQueue.forEach((effectExecution: any, index: number) => {
    const { componentId, hookIndex, effect, timestamp } = effectExecution;
    
    try {
      // Verify the component still exists and is mounted
      const componentData = componentRegistry.get(componentId);
      if (!componentData || !componentData.isMounted) {
        return;
      }
      
      // Execute the effect
      const result = effect();
      
      // Store cleanup function if returned
      if (typeof result === 'function' && componentData.effects[hookIndex]) {
        componentData.effects[hookIndex].cleanup = result;
      }
      
    } catch (error) {
      console.error(`[0x1 Hooks] ❌ Post-DOM effect execution failed for ${componentId}[${hookIndex}]:`, error);
    }
  });
}

/**
 * useLayoutEffect - Handle layout effects synchronously
 * Runs synchronously after all DOM mutations but before browser paint
 */
export function useLayoutEffect(effect: () => void | (() => void), deps?: any[]): void {
  const componentData = getCurrentComponentData();
  const hookIndex = currentHookIndex++;
  
  // CRITICAL FIX: Capture component ID at useLayoutEffect registration time
  const componentIdSnapshot = currentComponentId || 'unknown';
  
  // Initialize effect data if needed
  if (componentData.effects.length <= hookIndex) {
    componentData.effects[hookIndex] = {
      effect,
      cleanup: undefined,
      deps: undefined,
      id: `${componentIdSnapshot}:${hookIndex}`
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
  useGlobalState,
  useTheme,
  setComponentContext,
  clearComponentContext,
  unmountComponent,
  isComponentMounted,
  getComponentStats,
  getAllComponentStats,
  enableDebugMode,
  disableDebugMode,
  isDebugMode,
  setGlobalState,
  getGlobalState,
  subscribeToGlobalState,
  unsubscribeFromGlobalState
};

// Export the RefObject type
export type { RefObject };

// ============================================================================
// Auto-Initialize Browser Compatibility - IMMEDIATE SYNCHRONOUS INITIALIZATION
// ============================================================================

/**
 * 🚨 CRITICAL FIX: IMMEDIATE SYNCHRONOUS INITIALIZATION
 * No timeouts, no delays, no waiting - hooks must work on first load
 * This runs IMMEDIATELY when the module loads, before ANY other code can execute
 */
if (typeof window !== 'undefined') {
  // 🚨 STEP 0: IMMEDIATE module load hook setup - prevent router override
  // This executes BEFORE any constructor or other module initialization
  (window as any).__0x1_real_hooks_loaded = true;
  console.log('[0x1 Hooks] 🚀 IMMEDIATE: Real hooks claimed window properties');
  
  // Pre-claim the hook function properties immediately
  (window as any).__0x1_enterComponentContext = enterComponentContext;
  (window as any).__0x1_exitComponentContext = exitComponentContext;
  (window as any).__0x1_triggerUpdate = triggerComponentUpdate;
  // 🚨 STEP 1: IMMEDIATE browser compatibility setup
  initializeBrowserCompat();
  
  // 🚨 STEP 2: IMMEDIATE DOM ready detection and event listener attachment
  if (document.readyState === 'loading') {
    // DOM is still loading - attach listener for when it's ready
    document.addEventListener('DOMContentLoaded', () => {
      attachEventListenersToExistingElements();
      attachDataActionHandlers();
    });
  } else {
    // DOM is already ready - attach immediately
    attachEventListenersToExistingElements();
    attachDataActionHandlers();
  }
  
  // 🚨 STEP 3: IMMEDIATE mutation observer setup for dynamic elements
  if (!eventListenersInitialized) {
    initializeDOMObserver();
    eventListenersInitialized = true;
  }
  
  // 🚨 STEP 4: SMART OVERRIDE any existing minimal hook systems (like router's)
  // This ensures our real hooks system takes precedence without property conflicts
  (window as any).__0x1_hooks_real_system_loaded = true;
  
  // Store the real hook functions to prevent override
  const realHooks = {
    enterComponentContext,
    exitComponentContext,
    setComponentContext,
    clearComponentContext,
    triggerComponentUpdate,
    useState,
    useEffect,
    useLayoutEffect,
    useMemo,
    useCallback,
    useRef
  };
  
  // CRITICAL: Smart override strategy - delete existing properties first, then set new ones
  try {
    delete (window as any).__0x1_enterComponentContext;
    delete (window as any).__0x1_exitComponentContext;
    delete (window as any).__0x1_triggerUpdate;
  } catch (e) {
    // Properties might be non-configurable, that's OK
  }
  
  // CRITICAL: Set up real hook functions with proper fallback detection
  // The router checks "if they don't exist", so we need to be there first
  (window as any).__0x1_enterComponentContext = realHooks.enterComponentContext;
  (window as any).__0x1_exitComponentContext = realHooks.exitComponentContext;
  (window as any).__0x1_triggerUpdate = realHooks.triggerComponentUpdate;
  
  // 🚨 CRITICAL: Mark that the real hooks system is loaded
  // This prevents router from overriding with minimal versions
  (window as any).__0x1_real_hooks_loaded = true;
  
  // CRITICAL: Ensure React hooks are available immediately for React compatibility
  if (!(window as any).React) {
    (window as any).React = {};
  }
  
  Object.assign((window as any).React, realHooks);
  
  console.log('[0x1 Hooks] 🚀 IMMEDIATE synchronous initialization complete - hooks ready on first load');
}

// ✅ ADD: Priority levels for concurrent features (MOVED BEFORE CLASS)
enum UpdatePriority {
  IMMEDIATE = 0,    // User interactions (clicks, typing)
  HIGH = 1,         // Animation frames
  NORMAL = 2,       // Regular state updates
  LOW = 3,          // Background updates, transitions
  IDLE = 4          // Cleanup, analytics
}

// ✅ ADD: React-style update batching system
class UpdateScheduler {
  private updateQueues = new Map<UpdatePriority, Set<string>>();
  private effectQueues = new Map<UpdatePriority, Set<string>>();
  private isScheduling = false;
  private frameId: number | null = null;
  private immediateTimeoutId: any = null; // ✅ Fix: Use any to handle Node/Browser differences

  constructor() {
    // Initialize priority queues - FIXED: Use explicit priority values
    const priorities = [
      UpdatePriority.IMMEDIATE,
      UpdatePriority.HIGH,
      UpdatePriority.NORMAL,
      UpdatePriority.LOW,
      UpdatePriority.IDLE
    ];
    
    priorities.forEach(priority => {
      this.updateQueues.set(priority, new Set());
      this.effectQueues.set(priority, new Set());
    });
  }

  scheduleUpdate(componentId: string, priority: UpdatePriority = UpdatePriority.NORMAL): void {
    this.updateQueues.get(priority)!.add(componentId);
    this.markComponentNeedsUpdate(componentId);
    this.scheduleWork(priority);
  }

  scheduleEffect(effectId: string, priority: UpdatePriority = UpdatePriority.NORMAL): void {
    this.effectQueues.get(priority)!.add(effectId);
    this.scheduleWork(priority);
  }

  private scheduleWork(priority: UpdatePriority): void {
    if (this.isScheduling) return;
    
    this.isScheduling = true;
    
    // ✅ IMMEDIATE priority uses synchronous execution
    if (priority === UpdatePriority.IMMEDIATE) {
      if (this.immediateTimeoutId) {
        clearTimeout(this.immediateTimeoutId);
      }
      this.immediateTimeoutId = setTimeout(() => this.flushWork(), 0);
      return;
    }
    
    // ✅ Other priorities use RAF for smooth performance
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    
    this.frameId = requestAnimationFrame(() => {
      this.flushWork();
    });
  }

  private flushWork(): void {
    try {
      // ✅ Process updates in priority order (IMMEDIATE -> IDLE)
      for (const priority of [UpdatePriority.IMMEDIATE, UpdatePriority.HIGH, UpdatePriority.NORMAL, UpdatePriority.LOW, UpdatePriority.IDLE]) {
        const updateQueue = this.updateQueues.get(priority)!;
        if (updateQueue.size > 0) {
          const updates = Array.from(updateQueue);
          updateQueue.clear();
          
          for (const componentId of updates) {
            this.flushComponentUpdate(componentId);
          }
        }

        const effectQueue = this.effectQueues.get(priority)!;
        if (effectQueue.size > 0) {
          const effects = Array.from(effectQueue);
          effectQueue.clear();
          
          this.flushEffects(effects);
        }
      }
    } finally {
      this.isScheduling = false;
      this.frameId = null;
      this.immediateTimeoutId = null;
    }
  }

  private markComponentNeedsUpdate(componentId: string): void {
    const componentData = componentRegistry.get(componentId);
    if (componentData) {
      componentData.needsUpdate = true;
    }
  }

  private flushComponentUpdate(componentId: string): void {
    const componentData = componentRegistry.get(componentId);
    if (!componentData || !componentData.needsUpdate) return;

    componentData.needsUpdate = false;
    componentData.updateScheduled = false;

    const callback = componentUpdateCallbacks.get(componentId);
    if (callback) {
      try {
        callback();
      } catch (error) {
        handleError(error, `Component update: ${componentId}`);
      }
    }
  }

  private flushEffects(effectIds: string[]): void {
    const effectsByComponent = new Map<string, string[]>();
    
    for (const effectId of effectIds) {
      const [componentId] = effectId.split(':');
      if (!effectsByComponent.has(componentId)) {
        effectsByComponent.set(componentId, []);
      }
      effectsByComponent.get(componentId)!.push(effectId);
    }

    for (const [componentId, componentEffectIds] of effectsByComponent) {
      const componentData = componentRegistry.get(componentId);
      if (!componentData) continue;

      for (const effectId of componentEffectIds) {
        const effectIndex = parseInt(effectId.split(':')[1]);
        const effectData = componentData.effects[effectIndex];
        
        if (effectData) {
          this.executeEffect(effectData);
        }
      }
    }
  }

  private executeEffect(effectData: EffectData): void {
    try {
      if (effectData.cleanup && typeof effectData.cleanup === 'function') {
        effectData.cleanup();
        effectData.cleanup = undefined;
      }

      const cleanup = effectData.effect();
      if (typeof cleanup === 'function') {
        effectData.cleanup = cleanup;
      }
    } catch (error) {
      handleError(error, `Effect execution: ${effectData.id}`);
    }
  }
}

// ✅ Global scheduler instance
const updateScheduler = new UpdateScheduler();

// ✅ OPTIMIZED: Fast dependency comparison with memoization
const depsCache = new WeakMap<any[], boolean>();

// ✅ ADD: Memory cleanup for better performance
export function cleanupComponentData(componentId: string): void {
  const componentData = componentRegistry.get(componentId);
  if (!componentData) return;

  // ✅ Clean up all effects
  for (const effectData of componentData.effects) {
    if (effectData.cleanup && typeof effectData.cleanup === 'function') {
      try {
        effectData.cleanup();
      } catch (error) {
        handleError(error, `Effect cleanup: ${effectData.id}`);
      }
    }
  }

  // ✅ Clear dependency cache entries
  componentData.effects.forEach(effect => {
    if (effect.deps) {
      depsCache.delete(effect.deps);
    }
  });

  // ✅ Remove from store
  componentRegistry.delete(componentId);
  componentUpdateCallbacks.delete(componentId);
}

// ✅ ADD: Performance monitoring
export function getPerformanceMetrics() {
  return {
    totalComponents: componentRegistry.size,
    totalCallbacks: componentUpdateCallbacks.size,
    averageEffectsPerComponent: Array.from(componentRegistry.values())
      .reduce((sum, data) => sum + data.effects.length, 0) / componentRegistry.size,
    componentsNeedingUpdate: Array.from(componentRegistry.values())
      .filter(data => data.needsUpdate).length
  };
}

// ✅ ADD: Transition context for useTransition
interface TransitionContext {
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}

// ✅ ADD: Context system for useContext
interface ContextValue<T> {
  value: T;
  subscribers: Set<string>; // Component IDs that consume this context
}

const contextRegistry = new Map<any, ContextValue<any>>();
const componentContextSubscriptions = new Map<string, Set<any>>(); // componentId -> Set of contexts

// ✅ ADD: Reducer action type
interface ReducerAction {
  type: string;
  payload?: any;
}

// ============================================================================
// Advanced Hook Implementations
// ============================================================================

/**
 * useReducer - For complex state management like Redux
 */
export function useReducer<State, Action>(
  reducer: (state: State, action: Action) => State,
  initialState: State
): [State, (action: Action) => void] {
  const componentData = getCurrentComponentData();
  const hookIndex = componentData.hookIndex++;

  if (hookIndex >= componentData.states.length) {
    componentData.states.push(initialState);
  }

  const currentState = componentData.states[hookIndex] as State;

  const dispatch = (action: Action) => {
    const componentData = getCurrentComponentData();
    const oldState = componentData.states[hookIndex];
    
    try {
      const newState = reducer(oldState, action);
      
      // ✅ Only update if state actually changed
      if (!Object.is(oldState, newState)) {
        componentData.states[hookIndex] = newState;
        queueUpdate(currentComponentId!, UpdatePriority.NORMAL);
      }
    } catch (error) {
      handleError(error, `useReducer dispatch`);
    }
  };

  return [currentState, dispatch];
}

/**
 * useTransition - For marking updates as non-urgent (React 18 concurrent feature)
 */
export function useTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setIsPending] = useState(false);

  const startTransition = (callback: () => void) => {
    setIsPending(true);
    
    // ✅ Execute callback with LOW priority
    setTimeout(() => {
      try {
        callback();
      } finally {
        setIsPending(false);
      }
    }, 0);
  };

  return [isPending, startTransition];
}

/**
 * createContext - Create a context for prop drilling solutions
 */
export function createContext<T>(defaultValue: T) {
  const contextKey = Symbol('0x1Context');
  
  // Initialize context registry
  contextRegistry.set(contextKey, {
    value: defaultValue,
    subscribers: new Set()
  });

  return {
    Provider: ({ value, children }: { value: T; children: any }) => {
      // Update context value and notify subscribers
      const contextData = contextRegistry.get(contextKey)!;
      const oldValue = contextData.value;
      
      if (!Object.is(oldValue, value)) {
        contextData.value = value;
        
        // ✅ Notify all subscriber components
        for (const componentId of contextData.subscribers) {
          queueUpdate(componentId, UpdatePriority.NORMAL);
        }
      }

      return children;
    },
    Consumer: ({ children }: { children: (value: T) => any }) => {
      const contextData = contextRegistry.get(contextKey)!;
      return children(contextData.value);
    },
    contextKey
  };
}

/**
 * useContext - Consume context values
 */
export function useContext<T>(context: { contextKey: symbol }): T {
  if (!currentComponentId) {
    throw new Error('[0x1 Hooks] useContext called outside component context');
  }

  const contextData = contextRegistry.get(context.contextKey);
  if (!contextData) {
    throw new Error('[0x1 Hooks] useContext called with invalid context');
  }

  // ✅ Subscribe component to context updates
  contextData.subscribers.add(currentComponentId);
  
  // ✅ Track context subscription for cleanup
  if (!componentContextSubscriptions.has(currentComponentId)) {
    componentContextSubscriptions.set(currentComponentId, new Set());
  }
  componentContextSubscriptions.get(currentComponentId)!.add(context.contextKey);

  return contextData.value as T;
}

/**
 * useDeferredValue - Defer updates for better performance
 */
export function useDeferredValue<T>(value: T): T {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    // ✅ Defer the update with LOW priority
    const timeoutId = setTimeout(() => {
      setDeferredValue(value);
    }, 5); // Small delay for deferring

    return () => clearTimeout(timeoutId);
  }, [value]);

  return deferredValue;
}

/**
 * useId - Generate stable unique IDs (useful for accessibility)
 */
export function useId(): string {
  const componentData = getCurrentComponentData();
  const hookIndex = componentData.hookIndex++;

  if (hookIndex >= componentData.states.length) {
    const id = `0x1-${currentComponentId || 'unknown'}-${hookIndex}`;
    componentData.states.push(id);
  }

  return componentData.states[hookIndex] as string;
}

// REMOVED: All hardcoded DOM manipulation functions - they go against 0x1 philosophy
// Components should re-render naturally with their new state

// REMOVED: All generic DOM update functions with hardcoded selectors  
// Components should use JSX re-rendering instead

// REMOVED: All layout-specific DOM manipulation functions with hardcoded selectors
// Layout components should use pure JSX re-rendering based on state changes

/**
 * Apply universal visual updates based on element data attributes
 * 🎯 0X1 PHILOSOPHY: UNIVERSAL patterns with ACTUAL DOM MANIPULATION
 */
function applyUniversalVisualUpdates(element: Element, componentId: string, hookIndex: number, newValue: any, oldValue: any) {
  try {
    console.log(`[0x1 Visual] 🎯 STARTING visual update for ${componentId}[${hookIndex}]: ${oldValue} -> ${newValue}`);
    
    // 🎯 UNIVERSAL BOOLEAN STATE UPDATES - Handles dropdowns, toggles, etc.
    
    // UNIVERSAL PATTERN: Set CSS custom properties that ANY framework can use
    document.documentElement.style.setProperty(`--0x1-${componentId}-${hookIndex}`, String(newValue));
    document.documentElement.style.setProperty(`--0x1-${componentId}-${hookIndex}-bool`, typeof newValue === 'boolean' ? (newValue ? '1' : '0') : '0');
    
    // UNIVERSAL PATTERN: Let components control their own styling via data attributes
    element.setAttribute(`data-0x1-state-${hookIndex}`, String(newValue));
    element.setAttribute(`data-0x1-value-${hookIndex}`, String(newValue));
    
    // UNIVERSAL PATTERN: Dispatch custom events for complete component autonomy
    const stateUpdateEvent = new CustomEvent('0x1-state-update', {
      detail: { componentId, hookIndex, newValue, oldValue, type: typeof newValue },
      bubbles: true,
      cancelable: false
    });
    element.dispatchEvent(stateUpdateEvent);
    
        // 🚨 REAL 0X1 PHILOSOPHY: PURE DIRECT DOM MANIPULATION ONLY
    // NO re-renders, NO JSX re-evaluation, NO component function calls
    
    console.log(`[0x1 Visual] 🎯 DIRECT DOM MANIPULATION for ${componentId}[${hookIndex}]: ${oldValue} -> ${newValue}`);
    
    // 🎯 THEME PATTERN: Global theme changes
    if (componentId.includes('ThemeToggle')) {
      console.log(`[0x1 Visual] 🌓 THEME CHANGE: ${componentId}[${hookIndex}] = ${newValue}`);
      
      const isDark = newValue;
      const html = document.documentElement;
      const body = document.body;
      
      if (isDark) {
        html.classList.add('dark');
        body.classList.add('dark');
      } else {
        html.classList.remove('dark');
        body.classList.remove('dark');
      }
      return;
    }
    
    // 🚨 REAL 0X1: HOOK-SPECIFIC DIRECT DOM MANIPULATION
    // Only manipulate DOM elements related to this specific hook change
    
    // 🎯 SMART HOOK-BASED PATTERN DETECTION
    // Find the component element to scope our search
    const componentElements = document.querySelectorAll(`[data-component-id="${componentId}"]`);
    
    if (componentElements.length > 0) {
      console.log(`[0x1 Direct DOM] 🎯 Hook-specific update for ${componentId}[${hookIndex}]: ${oldValue} -> ${newValue}`);
      
      componentElements.forEach(componentElement => {
        
        // 🎯 HOOK INDEX 0: Usually selected values (model, option, etc.)
        if (hookIndex === 0 && typeof newValue === 'string') {
          console.log(`[0x1 Direct DOM] 📝 SELECTED VALUE UPDATE: ${oldValue} -> ${newValue}`);
          
          // 🚨 CRITICAL FIX: Handle model dropdown updates (EntityChat specific)
          if (newValue.startsWith('entity-')) {
            console.log(`[0x1 Direct DOM] 🤖 MODEL SELECTION: ${oldValue} -> ${newValue}`);
            
            // Define model data mapping
            const modelData: Record<string, any> = {
              'entity-swift': {
                name: 'Entity Swift',
                badge: 'Swift',
                color: 'from-cyan-500 to-blue-500',
                learning: 'Session-adaptive'
              },
              'entity-fusion': {
                name: 'Entity Fusion', 
                badge: 'Fusion',
                color: 'from-violet-500 to-purple-500',
                learning: 'Workflow-adaptive'
              },
              'entity-quantum': {
                name: 'Entity Quantum',
                badge: 'Quantum', 
                color: 'from-emerald-500 to-teal-500',
                learning: 'Self-integrating'
              }
            };
            
            const currentModel = modelData[newValue];
            if (currentModel) {
              // Update model name displays
              const modelNameElements = componentElement.querySelectorAll(`[data-model-name]`);
              modelNameElements.forEach(nameEl => {
                nameEl.textContent = currentModel.name;
                console.log(`[0x1 Direct DOM] ✅ Updated model name to: ${currentModel.name}`);
              });
              
              // Update model badge displays
              const modelBadgeElements = componentElement.querySelectorAll(`[data-model-badge]`);
              modelBadgeElements.forEach(badgeEl => {
                badgeEl.textContent = currentModel.badge;
                // Update gradient classes
                badgeEl.className = badgeEl.className.replace(/from-\w+-\d+\s+to-\w+-\d+/g, currentModel.color);
                console.log(`[0x1 Direct DOM] ✅ Updated model badge to: ${currentModel.badge}`);
              });
              
              // Update model dot displays
              const modelDotElements = componentElement.querySelectorAll(`[data-model-dot]`);
              modelDotElements.forEach(dotEl => {
                // Update gradient classes for the dot
                dotEl.className = dotEl.className.replace(/from-\w+-\d+\s+to-\w+-\d+/g, currentModel.color);
                console.log(`[0x1 Direct DOM] ✅ Updated model dot color`);
              });
              
              // Update learning type if present (both with data attribute and fallback)
              const learningElements = componentElement.querySelectorAll(`[data-model-learning]`);
              learningElements.forEach(learningEl => {
                learningEl.textContent = currentModel.learning;
                console.log(`[0x1 Direct DOM] ✅ Updated learning type to: ${currentModel.learning}`);
              });
              
                             // FALLBACK: Also look for the learning text next to model name (common pattern)
               const modelNameContainers = componentElement.querySelectorAll(`[data-model-name]`);
               modelNameContainers.forEach(nameEl => {
                 // Look for sibling elements that might contain learning type
                 const parent = nameEl.parentElement;
                 if (parent) {
                   const learningSpans = parent.querySelectorAll('span');
                   learningSpans.forEach(span => {
                     // Check if this looks like a learning type span (orange color classes)
                     if (span !== nameEl && (span.className.includes('orange-') || span.textContent?.includes('-adaptive') || span.textContent?.includes('integrating'))) {
                       span.textContent = currentModel.learning;
                       console.log(`[0x1 Direct DOM] ✅ Updated learning type (fallback) to: ${currentModel.learning}`);
                     }
                   });
                 }
               });
               
               // 🚨 CRITICAL FIX: Update dropdown selection state
               console.log(`[0x1 Direct DOM] 🔄 Updating dropdown selection state for: ${newValue}`);
               
               // Find all model selection buttons in dropdown
               const dropdownButtons = componentElement.querySelectorAll('[data-model-select]');
               dropdownButtons.forEach(button => {
                 const buttonModelId = button.getAttribute('data-model-select');
                 const isSelected = buttonModelId === newValue;
                 
                 // Update button styling classes
                 if (isSelected) {
                   // Add selected styling
                   button.classList.add('bg-primary/5', 'border-l-2', 'border-l-primary');
                   console.log(`[0x1 Direct DOM] ✅ Added selected styling to ${buttonModelId}`);
                 } else {
                   // Remove selected styling
                   button.classList.remove('bg-primary/5', 'border-l-2', 'border-l-primary');
                   console.log(`[0x1 Direct DOM] ✅ Removed selected styling from ${buttonModelId}`);
                 }
                 
                 // Handle checkmark icon visibility
                 const checkmarkContainer = button.querySelector('.w-6.h-6.rounded-full.bg-primary');
                 if (isSelected) {
                   // Show checkmark - create if doesn't exist
                   if (!checkmarkContainer) {
                     const checkmark = document.createElement('div');
                     checkmark.className = 'w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0';
                     checkmark.innerHTML = `
                       <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                       </svg>
                     `;
                     // Find the right place to insert it (usually in the top right section)
                     const topSection = button.querySelector('.flex.items-start.justify-between');
                     if (topSection) {
                       topSection.appendChild(checkmark);
                     }
                     console.log(`[0x1 Direct DOM] ✅ Created checkmark for ${buttonModelId}`);
                   } else {
                     // Show existing checkmark
                     (checkmarkContainer as HTMLElement).style.display = 'flex';
                     console.log(`[0x1 Direct DOM] ✅ Showed checkmark for ${buttonModelId}`);
                   }
                 } else {
                   // Hide checkmark
                   if (checkmarkContainer) {
                     (checkmarkContainer as HTMLElement).style.display = 'none';
                     console.log(`[0x1 Direct DOM] ✅ Hid checkmark for ${buttonModelId}`);
                   }
                 }
               });
             }
          } else {
            // Generic text value updates (non-model)
            const selectedDisplays = componentElement.querySelectorAll(`[data-selected-display], .selected-display, [data-current-model], [data-model-name]`);
            selectedDisplays.forEach(display => {
              if (display.textContent !== null) {
                display.textContent = newValue;
                console.log(`[0x1 Direct DOM] ✅ Updated selected display to: ${newValue}`);
              }
            });
          }
        }
        
        // 🎯 HOOK INDEX 1: Usually web search toggle 
        else if (hookIndex === 1 && typeof newValue === 'boolean') {
          console.log(`[0x1 Direct DOM] 🔍 WEB SEARCH TOGGLE: ${newValue ? 'ON' : 'OFF'}`);
          
          // Find web search toggles ONLY within this component
          const webSearchToggles = componentElement.querySelectorAll(`[data-action="toggle-web-search"], [data-web-search-toggle]`);
          webSearchToggles.forEach(toggle => {
            // Update background and text colors
            if (newValue) {
              toggle.classList.add('bg-blue-600', 'text-white');
              toggle.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
              toggle.classList.add('bg-gray-200', 'text-gray-700');
              toggle.classList.remove('bg-blue-600', 'text-white');
            }
            
            // Update toggle handle position
            const handle = toggle.querySelector('[data-web-search-switch], span');
            if (handle) {
              if (newValue) {
                handle.classList.add('translate-x-5');
                handle.classList.remove('translate-x-0', 'translate-x-1');
              } else {
                handle.classList.add('translate-x-1');
                handle.classList.remove('translate-x-5', 'translate-x-0');
              }
            }
            
            console.log(`[0x1 Direct DOM] ✅ Web search toggle updated to: ${newValue ? 'ON' : 'OFF'}`);
          });
        }
        
        // 🎯 HOOK INDEX 2: Usually dropdown visibility
        else if (hookIndex === 2 && typeof newValue === 'boolean') {
          console.log(`[0x1 Direct DOM] 🔽 DROPDOWN VISIBILITY: ${newValue ? 'SHOWING' : 'HIDING'}`);
          
          // Find dropdown content ONLY within this component
          const dropdownContents = componentElement.querySelectorAll(`[data-dropdown-content]`);
          dropdownContents.forEach(dropdown => {
            if (newValue) {
              dropdown.classList.remove('hidden', 'opacity-0', 'scale-95');
              dropdown.classList.add('block', 'opacity-100', 'scale-100');
              (dropdown as HTMLElement).style.display = 'block';
            } else {
              dropdown.classList.add('hidden', 'opacity-0', 'scale-95');
              dropdown.classList.remove('block', 'opacity-100', 'scale-100');
              (dropdown as HTMLElement).style.display = 'none';
            }
            
            console.log(`[0x1 Direct DOM] ✅ Dropdown visibility updated to: ${newValue ? 'VISIBLE' : 'HIDDEN'}`);
          });
        }
        
        // 🎯 FALLBACK: Generic boolean handling for other hook indices
        else if (typeof newValue === 'boolean') {
          console.log(`[0x1 Direct DOM] 🤔 Generic boolean update for hook ${hookIndex}: ${newValue}`);
          // Don't do anything - avoid cross-contamination
        }
      });
    } else {
      console.log(`[0x1 Direct DOM] ⚠️ No component elements found for ${componentId}`);
    }
    
    console.log(`[0x1 Visual] ✅ Direct DOM manipulation complete for ${componentId}[${hookIndex}]`);
    
    // 🎯 UNIVERSAL GLOBAL STATE PROPAGATION
    const globalStateKey = `${componentId}.${hookIndex}`;
    setGlobalState(globalStateKey, newValue);
    
    console.log(`[0x1 Visual] ✅ COMPLETED visual update for ${componentId}[${hookIndex}]`);
    
  } catch (error) {
    console.error(`[0x1 Visual] Error in universal visual updates for ${componentId}[${hookIndex}]:`, error);
  }
}

// 🚨 CRITICAL FIX: IMMEDIATE event listener attachment with MutationObserver

/**
 * Attach event listener to a single element
 */
function attachListenerToElement(element: Element) {
  const componentId = element.getAttribute('data-component-id');
  
  if (!componentId || (element as any).__0x1_listenerAttached) {
    return;
  }
  
  try {
    // Attaching state change listener
    
    element.addEventListener('0x1-state-change', (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const { hookIndex, newValue, oldValue, componentId: eventComponentId } = customEvent.detail || {};
        
        // State change received
        
        // Only respond to state changes for this component
        if (eventComponentId === componentId) {
          // Processing visual update
          // Store the state value on the element for any component to use
          (element as any).__0x1_state = (element as any).__0x1_state || {};
          (element as any).__0x1_state[hookIndex] = newValue;
          
          // Apply universal visual updates
          applyUniversalVisualUpdates(element, componentId, hookIndex, newValue, oldValue);
        }
      } catch (err) {
        console.error(`[0x1 Hooks] ❌ Error in event listener:`, err);
      }
    });
    
    // Mark as having listener attached
    (element as any).__0x1_listenerAttached = true;
          // Listener attached
    
  } catch (err) {
    console.error(`[0x1 Hooks] ❌ Failed to attach event listener to ${element.tagName}:`, err);
  }
}

/**
 * 🚨 CRITICAL FIX: Initialize MutationObserver for real-time event listener attachment
 */
function initializeDOMObserver() {
  if (typeof window === 'undefined' || mutationObserver) return;
  
  mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check if this element or its children have component IDs
          const componentsToAttach: Element[] = [];
          
          if (element.hasAttribute('data-component-id')) {
            componentsToAttach.push(element);
          }
          
          // Also check children
          const childComponents = element.querySelectorAll('[data-component-id]');
          componentsToAttach.push(...Array.from(childComponents));
          
          if (componentsToAttach.length > 0) {
            componentsToAttach.forEach(comp => {
              attachListenerToElement(comp);
            });
            
            // Also attach action handlers to new elements  
            const actionElements: Element[] = [];
            if (element.hasAttribute('data-action')) {
              actionElements.push(element);
            }
            const childActionElements = element.querySelectorAll('[data-action]');
            actionElements.push(...Array.from(childActionElements));
            
            if (actionElements.length > 0) {
              attachActionHandlersToElements(actionElements);
            }
          }
        }
      });
    });
  });
  
  // Start observing
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });
}

/**
 * 🚨 CRITICAL FIX: Attach event listeners to ALL existing DOM elements with component IDs
 * Now uses MutationObserver for real-time detection + initial sweep
 */
function attachEventListenersToExistingElements() {
  if (typeof window === 'undefined') return;
  
  // Starting event listener attachment process
  
  // Initialize the MutationObserver for future elements
  if (!eventListenersInitialized) {
    initializeDOMObserver();
    eventListenersInitialized = true;
  }
  
  // Find all existing elements with component IDs and attach listeners
  const allComponentElements = document.querySelectorAll('[data-component-id]');
  allComponentElements.forEach((element: Element) => {
    attachListenerToElement(element);
  });
  
  // Attach data-action click handlers for existing elements
  attachDataActionHandlers();
}

// 🚨 DEBUG: Expose functions globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__0x1_attachDataActionHandlers = attachDataActionHandlers;
  (window as any).__0x1_triggerStateChange = triggerStateChange;
  (window as any).__0x1_attachEventListeners = attachEventListenersToExistingElements;
  
  // EntityZero handles its own actions - no interference needed
}

/**
 * Attach click handlers for data-action elements (replaces removed onClick handlers)
 */
function attachDataActionHandlers() {
  if (typeof window === 'undefined') return;
  
  // Find all elements with data-action attributes for attachment
  const actionElements = document.querySelectorAll('[data-action]');
  
  // Found ${actionElements.length} action elements for handler attachment
  
  actionElements.forEach((element: Element) => {
    const action = element.getAttribute('data-action');
    if (!action) return;
    
    // 🚨 CRITICAL FIX: AGGRESSIVE duplicate prevention with unique identifier
    const handlerKey = `__0x1_actionHandler_${action}`;
    const attachedKey = `__0x1_actionHandlerAttached_${action}`;
    
    if ((element as any)[attachedKey]) {
      
      return; // Skip - already attached
    }
    
    // 🚨 CRITICAL: Remove ALL existing click listeners and 0x1 handlers
    const existingHandler = (element as any)[handlerKey];
    if (existingHandler) {
      element.removeEventListener('click', existingHandler);
      delete (element as any)[handlerKey];
      delete (element as any)[attachedKey];
    }
    
    // Remove any legacy handlers
    if ((element as any).__0x1_actionHandler) {
      element.removeEventListener('click', (element as any).__0x1_actionHandler);
      delete (element as any).__0x1_actionHandler;
      delete (element as any).__0x1_actionHandlerAttached;
    }
    
    // Create the handler function with optimized debouncing
    const actionHandler = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation(); // CRITICAL: Stop other handlers on same element
      
      // 🚨 LIGHTNING FAST: Optimized debouncing for responsive UI
      const now = Date.now();
      const globalLastClick = (window as any).__0x1_globalLastClick || 0;
      const elementLastClick = (element as any).__0x1_lastClick || 0;
      
      if (now - Math.max(globalLastClick, elementLastClick) < 16) { // 16ms (1 frame) - instant responsiveness
        return;
      }
      
      // Set both global and element-specific timestamps
      (window as any).__0x1_globalLastClick = now;
      (element as any).__0x1_lastClick = now;
      
      const componentId = element.closest('[data-component-id]')?.getAttribute('data-component-id');
      if (!componentId) {
        return;
      }
      
      // 🎯 STORE RECENT ACTION CONTEXT: For smart visual pattern matching
      if (!(window as any).__0x1_recentActions) {
        (window as any).__0x1_recentActions = {};
      }
      (window as any).__0x1_recentActions[componentId] = action;
      
      // Clear action context after a short delay to prevent stale context
      setTimeout(() => {
        const recentActions = (window as any).__0x1_recentActions || {};
        if (recentActions[componentId] === action) {
          delete recentActions[componentId];
        }
      }, 150);
      
      // 🎯 0X1 PHILOSOPHY: Universal action handling - dispatch SINGLE event
      const documentEvent = new CustomEvent('0x1-action', {
        detail: { 
          action, 
          componentId,
          element,
          timestamp: now,
          attributes: Object.fromEntries(Array.from(element.attributes).map(attr => [attr.name, attr.value]))
        },
        bubbles: false,
        cancelable: false
      });
      document.dispatchEvent(documentEvent);
      
      // Action dispatched silently for performance
    };
    
    // Store handler with unique key
    (element as any)[handlerKey] = actionHandler;
    (element as any)[attachedKey] = true;
    
    element.addEventListener('click', actionHandler, { 
      capture: false, // Use bubbling phase
      once: false,    // Allow multiple clicks
      passive: false  // Allow preventDefault
    });
    
    // Handler attached silently
  });
}

/**
 * Trigger a state change for a specific component and hook index
 */
function triggerStateChange(componentId: string, hookIndex: number, newValueOrUpdater: any) {
  let componentData = componentRegistry.get(componentId);
  
  // 🚨 CRITICAL FIX: Auto-register components that haven't been registered yet
  if (!componentData) {
    // Auto-register the component with minimal state
    componentRegistry.set(componentId, {
      states: [],
      effects: [],
      memos: [],
      callbacks: [],
      refs: [],
      hookIndex: 0,
      isMounted: true,
      needsUpdate: false,
      updateScheduled: false
    });
    
    componentData = componentRegistry.get(componentId)!;
  }
  
  let newValue: any;
  if (typeof newValueOrUpdater === 'function') {
    const currentValue = componentData.states[hookIndex];
    newValue = newValueOrUpdater(currentValue);
  } else {
    newValue = newValueOrUpdater;
  }
  
  // 🚨 CRITICAL FIX: Initialize state array if needed with universal defaults
  while (componentData.states.length <= hookIndex) {
    // 🎯 0X1 PHILOSOPHY: Universal default - let components handle their own logic
    const defaultValue = false; // Simple universal default
    componentData.states.push(defaultValue);
  }
  
  // Update the state
  const oldValue = componentData.states[hookIndex];
  componentData.states[hookIndex] = newValue;
  
  // 🚨 CRITICAL DEBUG: Check if we can find DOM elements for this component
  const elements = document.querySelectorAll(`[data-component-id="${componentId}"]`);
  
  if (elements.length === 0) {
    console.warn(`[0x1 Action] ❌ No DOM elements found for ${componentId}`);
    return;
  }
  
  // Found elements for state update
  
  // 🚨 CRITICAL: Dispatch state change events to component elements for visual updates
  elements.forEach((element) => {
    // Check if listener is attached
    const hasListener = (element as any).__0x1_listenerAttached;
    // Dispatching state change event
    
    const customEvent = new CustomEvent('0x1-state-change', {
      detail: {
        componentId,
        hookIndex,
        newValue,
        oldValue
      }
    });
    element.dispatchEvent(customEvent);
  });
}

/**
 * Attach action handlers to specific elements (used by MutationObserver)
 */
function attachActionHandlersToElements(elements: Element[]) {
  if (!elements || elements.length === 0) return;

  // 🚨 CRITICAL: Enhanced action tracking to prevent infinite loops
  const actionTracker = new Map<string, { lastTrigger: number; isProcessing: boolean }>();
  
  // 🚨 PERFORMANCE: Track elements we've already processed to avoid duplicates
  let processedCount = 0;
  let skippedCount = 0;
  
  elements.forEach((element) => {
    const action = element.getAttribute('data-action');
    const componentId = element.closest('[data-component-id]')?.getAttribute('data-component-id');
    if (!action || !componentId) return;

    // Create unique handler key to prevent duplicate attachments
    const handlerKey = `${componentId}-${action}-${element.tagName}-${action}`;
    const attachedKey = `__0x1_handler_${handlerKey}`;
    
    if ((element as any)[attachedKey]) {
      skippedCount++;
      return; // Skip - already attached
    }

    // Mark as attached with unique key
    (element as any)[attachedKey] = true;
    processedCount++;

    const actionHandler = (event: Event) => {
      // 🚨 CRITICAL: Enhanced debouncing to prevent rapid-fire actions
      const actionKey = `${action}-${componentId}`;
      const now = Date.now();
      const tracker = actionTracker.get(actionKey) || { lastTrigger: 0, isProcessing: false };
      
             // Prevent rapid actions (minimum 16ms - instant responsiveness)
       if (now - tracker.lastTrigger < 16) {
         event.preventDefault();
         event.stopPropagation();
         return; // Silent blocking
       }
      
      // Prevent overlapping action processing
      if (tracker.isProcessing) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      // Mark as processing
      tracker.isProcessing = true;
      tracker.lastTrigger = now;
      actionTracker.set(actionKey, tracker);

      try {
        event.preventDefault();
        event.stopPropagation();

        // 🎯 STORE RECENT ACTION CONTEXT: For smart visual pattern matching
        if (!(window as any).__0x1_recentActions) {
          (window as any).__0x1_recentActions = {};
        }
        (window as any).__0x1_recentActions[componentId] = action;
        
        // Clear action context after a short delay to prevent stale context
        setTimeout(() => {
          const recentActions = (window as any).__0x1_recentActions || {};
          if (recentActions[componentId] === action) {
            delete recentActions[componentId];
          }
        }, 150);

        // 🎯 0X1 PHILOSOPHY: Universal action handling - dispatch SINGLE event
        const documentEvent = new CustomEvent('0x1-action', {
          detail: { 
            action, 
            attributes: Object.fromEntries(
              Array.from(element.attributes).map(attr => [attr.name, attr.value])
            ),
            timestamp: now,
            componentId
          },
          bubbles: false,
          cancelable: false
        });
        document.dispatchEvent(documentEvent);
        
                 // 🚨 CRITICAL: Auto-clear processing flag after a short delay
         setTimeout(() => {
           tracker.isProcessing = false;
           actionTracker.set(actionKey, tracker);
         }, 50); // Reduced from 100ms for better responsiveness
         
       } catch (error) {
         console.error(`[0x1 Action] Error handling action ${action}:`, error);
         // Clear processing flag on error
         tracker.isProcessing = false;
         actionTracker.set(actionKey, tracker);
       }
     };

     element.addEventListener('click', actionHandler);
   });
   
   // Silent action handler processing
}





