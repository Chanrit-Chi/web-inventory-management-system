/**
 * usePhysicalBarcodeScanner
 *
 * Detects input from a USB/Bluetooth HID barcode scanner at the document level.
 *
 * KEY DESIGN: The main keydown effect depends ONLY on [enabled].
 * All mutable state lives as local variables inside the effect closure.
 * All options are read through a single `optionsRef` that is updated
 * on every render — this means NO dependency-change re-runs that would
 * add duplicate listeners after state updates (e.g. setIsScanning).
 *
 * Behavior:
 *  - Characters arriving faster than charIntervalMs apart are buffered.
 *  - Enter/Tab flushes the buffer and calls onScan (with stopPropagation
 *    so the focused element's React onKeyDown never fires).
 *  - bufferClearMs timeout ONLY clears stale buffers — never calls onScan.
 */

import { useEffect, useRef, useLayoutEffect } from "react";

interface UsePhysicalBarcodeScannerOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
  /** Max ms between consecutive chars to be considered scanner speed. Default: 100 */
  charIntervalMs?: number;
  /** After this many ms of silence, stale buffer is CLEARED (not submitted). Default: 500 */
  bufferClearMs?: number;
  /** Minimum character count for a valid scan. Default: 3 */
  minLength?: number;
  /** Input element to keep in sync with the buffer (uncontrolled). */
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** Re-focuses inputRef when it loses focus. Default: false */
  keepFocus?: boolean;
}

export function usePhysicalBarcodeScanner({
  onScan,
  enabled = true,
  charIntervalMs = 100,
  bufferClearMs = 500,
  minLength = 3,
  inputRef,
  keepFocus = false,
}: UsePhysicalBarcodeScannerOptions): void {
  // ── All options live in a ref so the effect reads latest values
  //    without needing them as deps (avoids effect re-runs & duplicate listeners).
  const optionsRef = useRef({
    charIntervalMs,
    bufferClearMs,
    minLength,
    inputRef,
    keepFocus,
  });

  // Stable ref to the onScan callback
  const onScanRef = useRef(onScan);

  // Update options and callback refs without causing effect re-runs
  useLayoutEffect(() => {
    optionsRef.current = { charIntervalMs, bufferClearMs, minLength, inputRef, keepFocus };
    onScanRef.current = onScan;
  });

  // ── Main keydown listener 
  // Effect ONLY depends on [enabled]. Changing any option never causes a
  // re-run, so there is always exactly one listener active.
  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastCharTime = 0;
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    const clearBuffer = () => {
      if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
      buffer = "";
      const { inputRef } = optionsRef.current;
      if (inputRef?.current) inputRef.current.value = "";
    };

    const submitBuffer = () => {
      const { minLength, inputRef } = optionsRef.current;
      if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }

      const code = buffer.trim();
      buffer = "";
      if (inputRef?.current) inputRef.current.value = "";

      if (code.length < minLength) return;

      onScanRef.current(code);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const { charIntervalMs, bufferClearMs, minLength, inputRef } = optionsRef.current;

      // ── Terminator key ─────────────────────────────────────────────────────
      if (e.key === "Enter" || e.key === "Tab") {
        if (buffer.length >= minLength) {
          e.preventDefault();
          // stopPropagation in capture phase prevents the focused element's
          // React onKeyDown from also firing → no double-submit.
          e.stopPropagation();
          submitBuffer();
        }
        return; // never add Enter to the buffer
      }

      // ── Skip non-printable / modifier keys 
      if (e.key.length > 1) return;

      // ── Skip textarea / contenteditable 
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      if (target.getAttribute("contenteditable") === "true") return;

      // ── Per-character timing 
      const now = Date.now();
      const elapsed = now - lastCharTime;
      lastCharTime = now;

      if (elapsed > charIntervalMs && buffer.length > 0) {
        // Gap too large — previous chars were human typing, discard
        buffer = "";
        if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
      }

      // ── Accumulate 
      buffer += e.key;
      if (inputRef?.current) inputRef.current.value = buffer;

      // Reset stale-buffer clear timer (only clears, never submits)
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        clearBuffer();
      }, bufferClearMs);
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [enabled]); // ← ONLY re-runs when scanner permission changes

  // ── Auto-refocus
  useEffect(() => {
    if (!enabled || !keepFocus || !inputRef?.current) return;
    const el = inputRef.current;
    const handleBlur = () => {
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          el.focus();
        }
      }, 150);
    };
    el.addEventListener("blur", handleBlur);
    return () => el.removeEventListener("blur", handleBlur);
  }, [enabled, keepFocus, inputRef]);
}
