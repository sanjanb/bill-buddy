"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((msg: string) => {
    clearTimeout(timerRef.current);
    setMessage(msg);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  // Clean up on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function ToastContainer() {
    return (
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-emerald-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 whitespace-nowrap">
          {message}
        </div>
      </div>
    );
  }

  return { toast, ToastContainer };
}
