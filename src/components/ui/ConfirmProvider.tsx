"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ConfirmOpts = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type State = ConfirmOpts & { open: boolean };

const ConfirmCtx = createContext<(opts: ConfirmOpts) => Promise<boolean>>(
  () => Promise.resolve(false)
);

export function useConfirm() {
  return useContext(ConfirmCtx);
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ open: false, message: "" });
  const resolver = useRef<(v: boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOpts) => {
    setState({ open: true, ...opts });
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const close = (v: boolean) => {
    setState((s) => ({ ...s, open: false }));
    resolver.current(v);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="cf-overlay" onClick={() => close(false)}>
          <div className="cf-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {state.title && <div className="cf-title">{state.title}</div>}
            <p className="cf-message">{state.message}</p>
            <div className="cf-actions">
              <button className="cf-btn" onClick={() => close(false)}>{state.cancelLabel ?? "Cancel"}</button>
              <button className={"cf-btn" + (state.danger !== false ? " danger" : " primary")} onClick={() => close(true)} autoFocus>
                {state.confirmLabel ?? "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
