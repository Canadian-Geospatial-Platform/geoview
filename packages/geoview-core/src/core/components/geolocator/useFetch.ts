import { useEffect, useReducer, useRef } from 'react';
import { Action, State } from './types';

function useFetch<T = unknown>(url?: string, options?: RequestInit): State<T> {
  // Used to prevent state update if the component is unmounted
  const cancelRequest = useRef<boolean>(false);

  const initialState: State<T> = {
    error: undefined,
    loading: false,
    data: undefined,
  };

  const fetchReducer = (state: State<T>, action: Action<T>): State<T> => {
    switch (action.type) {
      case 'loading':
        return { ...initialState, loading: true };
      case 'fetched':
        return { ...initialState, data: action.payload, loading: false };
      case 'error':
        return { ...initialState, error: action.payload, loading: false };
      case 'reset':
        return { ...initialState };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(fetchReducer, initialState);

  const reset = () => {
    dispatch({ type: 'reset' });
  };

  useEffect(() => {
    // Do nothing if the url is not given
    if (!url) return;

    cancelRequest.current = false;

    const fetchData = async () => {
      dispatch({ type: 'loading' });

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        if (cancelRequest.current) return;

        dispatch({ type: 'fetched', payload: data as T });
      } catch (error) {
        if (cancelRequest.current) return;
        dispatch({ type: 'error', payload: error as Error });
      }
    };

    fetchData();

    // eslint-disable-next-line consistent-return
    return () => {
      cancelRequest.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { ...state, reset };
}

export default useFetch;
