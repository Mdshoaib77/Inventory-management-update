import { useEffect, useRef } from "react";
import { normalizeBarcode } from "../utils/barcode";

// USB / handheld scanner support ("keyboard wedge").
//
// A hardware scanner is just a keyboard: it types the whole code in a few
// milliseconds and then sends Enter (sometimes Tab). A human can't type
// like that, so timing is what tells the two apart:
//
//   * every key must arrive within `maxGap` ms of the previous one, else
//     the buffer restarts — slow manual typing never builds up a buffer;
//   * on Enter/Tab, a buffer of at least `minLength` fast characters is a
//     scan. Anything else is left alone, so a person typing a code and
//     pressing Enter behaves exactly as before.
//
// Because the scanner "types", the characters also land in whatever input
// has focus. When a scan is recognised we remove them from that field
// (and swallow the Enter so no form submits), then hand the clean code to
// `onScan`. That is what lets one global listener coexist with manual
// typing, camera scanning and focused text fields without conflicts.
//
// Options
//   onScan(code)   called once per scan with the normalized barcode
//   enabled        turn the listener off (e.g. while a camera modal owns
//                  scanning, so the same scan is never handled twice)
//   minLength      shortest code accepted (default 4)
//   maxGap         max ms between keystrokes of one scan (default 50)
//   idleFlush      also accept scanners that send NO Enter suffix: a long
//                  fast burst followed by silence counts as a scan
//   idleMinLength  shortest burst accepted in idleFlush mode (default 8)

const TEXT_INPUT_TYPES = ["text", "search", "tel", "url", "number", "password", "email"];

function isTextField(el) {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(el.type);
}

// React tracks input values itself, so a plain `el.value = x` is invisible
// to it. Going through the native setter + a real "input" event makes a
// controlled <input> fire onChange with the cleaned value.
function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (!setter) return;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

// Remove the characters the scanner just typed into the focused field.
function stripFromField(el, raw) {
  if (!isTextField(el) || !raw) return;
  const value = el.value || "";
  const at = value.lastIndexOf(raw);
  if (at === -1) return;
  setNativeValue(el, value.slice(0, at) + value.slice(at + raw.length));
}

export default function useBarcodeWedge({
  onScan,
  enabled = true,
  minLength = 4,
  maxGap = 50,
  idleFlush = false,
  idleMinLength = 8,
} = {}) {
  // Latest callback/options live in refs so the window listener is bound
  // once and never re-attached (re-attaching mid-scan would drop keys).
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return undefined;

    let chars = "";
    let last = 0;
    let idleTimer = null;

    const reset = () => {
      chars = "";
      clearTimeout(idleTimer);
    };

    const emit = (raw, target) => {
      const code = normalizeBarcode(raw);
      stripFromField(target, raw);
      reset();
      if (code) onScanRef.current?.(code);
    };

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
      const now = performance.now();

      if (e.key === "Enter" || e.key === "Tab") {
        const fast = chars.length > 0 && now - last <= maxGap;
        if (fast && normalizeBarcode(chars).length >= minLength) {
          // A scan: keep the suffix from submitting a form / moving focus.
          e.preventDefault();
          e.stopPropagation();
          emit(chars, e.target);
        } else {
          reset();
        }
        return;
      }

      // Shift, arrows, F-keys etc. neither extend nor break a scan.
      if (e.key.length !== 1) return;

      if (now - last > maxGap) chars = "";
      chars += e.key;
      last = now;

      if (idleFlush) {
        clearTimeout(idleTimer);
        const target = e.target;
        idleTimer = setTimeout(() => {
          if (normalizeBarcode(chars).length >= idleMinLength) emit(chars, target);
          else reset();
        }, maxGap * 3);
      }
    };

    // Capture phase on window: runs before React's handlers and before the
    // browser's default Enter behaviour, so a recognised scan can be
    // intercepted cleanly.
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      clearTimeout(idleTimer);
    };
  }, [enabled, minLength, maxGap, idleFlush, idleMinLength]);
}
