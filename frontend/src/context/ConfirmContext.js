import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        message,
        title: options.title || "Confirm action",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        danger: options.danger ?? false,
      });
    });
  }, []);

  const close = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="staff-confirm-overlay" role="dialog" aria-modal="true">
          <div className="staff-confirm-dialog">
            <h3>{state.title}</h3>
            <p>{state.message}</p>
            <div className="staff-confirm-actions">
              <button type="button" className="staff-btn staff-btn-secondary" onClick={() => close(false)}>
                {state.cancelLabel}
              </button>
              <button
                type="button"
                className={`staff-btn ${state.danger ? "staff-btn-danger" : "staff-btn-primary"}`}
                onClick={() => close(true)}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}
