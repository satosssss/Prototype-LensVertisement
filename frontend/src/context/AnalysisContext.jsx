import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { analyzeAdvertisement } from '../api/client.js';

/**
 * AnalysisContext
 * Holds the state of the one analysis the user is currently running, so the
 * upload, processing and results screens share it without prop-drilling or
 * stuffing data into the URL.
 *
 * status:
 *   'idle'      — nothing submitted yet
 *   'uploading' — request in flight
 *   'done'      — backend returned a result
 *   'error'     — request failed (see `error`)
 */
const AnalysisContext = createContext(null);

const INITIAL_STATE = {
  status: 'idle',
  result: null,
  meta: null,
  input: null,
  error: null,
};

export function AnalysisProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);

  /**
   * Start an analysis. Called by the upload page, which then navigates to
   * the processing screen; that screen only watches `status`.
   */
  const runAnalysis = useCallback(async (input) => {
    setState({ ...INITIAL_STATE, status: 'uploading', input });

    try {
      const payload = await analyzeAdvertisement(input);
      setState({
        status: 'done',
        result: payload.result,
        meta: payload.meta ?? null,
        input,
        error: null,
      });
    } catch (error) {
      setState({
        status: 'error',
        result: null,
        meta: null,
        input,
        error: {
          message: error.message,
          status: error.status ?? 0,
          details: error.details ?? null,
        },
      });
    }
  }, []);

  /** Clear everything and start over. */
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const value = useMemo(
    () => ({ ...state, runAnalysis, reset }),
    [state, runAnalysis, reset]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

/**
 * useAnalysis
 * Access the current analysis state and actions.
 * Throws if used outside the provider, which is a wiring bug worth catching.
 */
export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used inside an <AnalysisProvider>');
  }
  return context;
}
