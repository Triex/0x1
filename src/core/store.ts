/**
 * 0x1 Store
 * A lightweight state management system with actions and selectors
 */

type Listener<T> = (state: T) => void;
type Selector<T, S> = (state: T) => S;
type Reducer<T> = (state: T, action: Action) => T;
type Middleware<T> = (store: Store<T>) => (next: (action: Action) => any) => (action: Action) => any;

export interface Action {
  type: string;
  payload?: any;
  [key: string]: any;
}

export interface Store<T> {
  getState: () => T;
  dispatch: (action: Action) => any;
  subscribe: (listener: Listener<T>) => () => void;
  select: <S>(selector: Selector<T, S>, listener?: (selectedState: S) => void) => () => S;
}

/**
 * Create a store with initial state, reducer, and optional middleware
 */
export function createStore<T>(
  reducer: Reducer<T>,
  initialState: T,
  middlewares: Middleware<T>[] = []
): Store<T> {
  let state = initialState;
  const listeners: Set<Listener<T>> = new Set();
  const selectorCache: Map<Selector<T, any>, any> = new Map();
  
  // Create base dispatch function
  let dispatch = (action: Action) => {
    state = reducer(state, action);
    
    // Clear selector cache on state change
    selectorCache.clear();
    
    // Notify all listeners of state change
    listeners.forEach(listener => listener(state));
    
    return action;
  };
  
  // Apply middleware
  if (middlewares.length > 0) {
    const middlewareAPI = {
      getState: () => state,
      dispatch: (action: Action) => dispatch(action)
    };
    
    // Create middleware chain
    const chain = middlewares.map(middleware => middleware(middlewareAPI as Store<T>));
    
    // Enhance dispatch with middleware
    dispatch = chain.reduce(
      (prevDispatch, middleware) => middleware(prevDispatch),
      dispatch
    );
  }
  
  // Return store interface
  return {
    getState: () => state,
    dispatch,
    
    // Add listener that runs on every state change
    subscribe: (listener: Listener<T>): (() => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    
    // Subscribe to a specific part of the state using a selector
    select: <S>(selector: Selector<T, S>, listener?: (selectedState: S) => void): (() => S) => {
      // Get current value
      const getValue = () => {
        // Check cache first
        if (selectorCache.has(selector)) {
          return selectorCache.get(selector);
        }
        
        const value = selector(state);
        selectorCache.set(selector, value);
        return value;
      };
      
      // If a listener is provided, subscribe to changes
      if (listener) {
        let previousValue = getValue();
        
        // Create subscription that only fires when selected data changes
        const unsubscribe = this.subscribe((state: T) => {
          const newValue = selector(state);
          
          if (newValue !== previousValue) {
            previousValue = newValue;
            listener(newValue);
          }
        });
        
        return () => {
          unsubscribe();
          return getValue();
        };
      }
      
      // Just return the getter function
      return getValue;
    }
  };
}

/**
 * Combine multiple reducers into one
 */
export function combineReducers<T extends Record<string, any>>(
  reducers: { [K in keyof T]: Reducer<T[K]> }
): Reducer<T> {
  return (state: T = {} as T, action: Action): T => {
    const nextState: Partial<T> = {};
    let hasChanged = false;
    
    // Run each reducer with its own slice of state
    Object.entries(reducers).forEach(([key, reducer]) => {
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      
      nextState[key as keyof T] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    });
    
    return hasChanged ? nextState as T : state;
  };
}

/**
 * Create a slice with reducer and actions
 */
export function createSlice<T>({
  name,
  initialState,
  reducers
}: {
  name: string;
  initialState: T;
  reducers: Record<string, (state: T, payload?: any) => T | void>;
}) {
  const actionCreators: Record<string, (payload?: any) => Action> = {};
  const reducer: Reducer<T> = (state = initialState, action) => {
    const reducerFunction = reducers[action.type.replace(`${name}/`, '')];
    
    if (reducerFunction) {
      // Allow either immutable or mutable updates
      const result = reducerFunction(state, action.payload);
      return result === undefined ? state : result;
    }
    
    return state;
  };
  
  // Create action creators for each reducer
  Object.keys(reducers).forEach(actionType => {
    const fullActionType = `${name}/${actionType}`;
    
    const actionCreator = (payload?: any) => ({
      type: fullActionType,
      payload
    });
    
    // Add the type property to the action creator
    Object.defineProperty(actionCreator, 'type', {
      value: fullActionType,
      writable: false
    });
    
    actionCreators[actionType] = actionCreator;
  });
  
  return {
    name,
    reducer,
    actions: actionCreators
  };
}

/**
 * Middleware for logging actions and state changes
 */
export const logger: Middleware<any> = store => next => action => {
  console.group(`Action: ${action.type}`);
  console.log('Previous State:', store.getState());
  console.log('Action:', action);
  
  const result = next(action);
  
  console.log('Next State:', store.getState());
  console.groupEnd();
  
  return result;
};

/**
 * Middleware for handling async actions (thunk)
 */
export const thunk: Middleware<any> = store => next => action => {
  // Handle thunk functions - functions that take dispatch and getState
  if (typeof action === 'function') {
    return (action as any)(store.dispatch, store.getState);
  }
  
  return next(action);
};

/**
 * Create selectors with memoization
 */
export function createSelector<T, R1, Result>(
  selector1: (state: T) => R1,
  resultFn: (res1: R1) => Result
): (state: T) => Result {
  let lastR1: R1;
  let lastResult: Result;
  let lastState: T;
  
  return (state: T): Result => {
    if (state !== lastState) {
      const r1 = selector1(state);
      
      if (r1 !== lastR1) {
        lastResult = resultFn(r1);
      }
      
      lastR1 = r1;
      lastState = state;
    }
    
    return lastResult;
  };
}

/**
 * Create a selector with multiple input selectors
 */
export function createSelector2<T, R1, R2, Result>(
  selector1: (state: T) => R1,
  selector2: (state: T) => R2,
  resultFn: (res1: R1, res2: R2) => Result
): (state: T) => Result {
  let lastR1: R1;
  let lastR2: R2;
  let lastResult: Result;
  let lastState: T;
  
  return (state: T): Result => {
    if (state !== lastState) {
      const r1 = selector1(state);
      const r2 = selector2(state);
      
      if (r1 !== lastR1 || r2 !== lastR2) {
        lastResult = resultFn(r1, r2);
      }
      
      lastR1 = r1;
      lastR2 = r2;
      lastState = state;
    }
    
    return lastResult;
  };
}

/**
 * Connect a component to the store
 */
export function connect<T, P extends object>(
  mapStateToProps: (state: T) => Partial<P>,
  mapDispatchToProps?: Record<string, (dispatch: (action: Action) => any) => any>
) {
  return (component: (props: P) => HTMLElement) => {
    return (props: P) => {
      // Get the global store
      const store = (window as any).__0x1_STORE__ as Store<T>;
      
      if (!store) {
        console.error('Store not found. Make sure to initialize store first.');
        return component(props);
      }
      
      // Map state to props
      const stateProps = mapStateToProps(store.getState());
      
      // Map dispatch to props
      let dispatchProps = {};
      if (mapDispatchToProps) {
        dispatchProps = Object.entries(mapDispatchToProps).reduce((acc, [key, actionCreator]) => {
          acc[key] = (...args: any[]) => actionCreator(store.dispatch)(...args);
          return acc;
        }, {} as Record<string, any>);
      }
      
      // Merge props
      const mergedProps = { ...props, ...stateProps, ...dispatchProps };
      
      // Render component with merged props
      const element = component(mergedProps);
      
      // Subscribe to store changes
      store.subscribe((state) => {
        const newStateProps = mapStateToProps(state);
        const newMergedProps = { ...props, ...newStateProps, ...dispatchProps };
        
        // Re-render component if props changed
        if (JSON.stringify(newStateProps) !== JSON.stringify(stateProps)) {
          const newElement = component(newMergedProps);
          if (element.parentNode) {
            element.parentNode.replaceChild(newElement, element);
          }
        }
      });
      
      return element;
    };
  };
}

/**
 * Provider function to make store available globally
 */
export function initializeStore<T>(store: Store<T>): void {
  (window as any).__0x1_STORE__ = store;
}
