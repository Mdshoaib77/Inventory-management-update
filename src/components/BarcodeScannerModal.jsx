import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { X, Camera, Keyboard, SwitchCamera, ScanLine } from "lucide-react";
import Modal from "./Modal";
import useBarcodeWedge from "../hooks/useBarcodeWedge";
import { normalizeBarcode } from "../utils/barcode";

// Web equivalent of mobile/screens/ScanScreen.js's camera (expo-camera ->
// @zxing/browser reading the device webcam). Every mobile barcode type
// used there (ean13/ean8/upc_a/upc_e/code128/code39/qr) is covered by
// ZXing's default reader. A manual entry fallback is always available —
// required per the master prompt for when the browser has no camera
// access (permission denied, no camera hardware, insecure context, etc).
//
// Four input methods work here at the same time and share one "handled"
// latch, so a single scan is only ever reported once:
//   1. laptop webcam / mobile camera (ZXing)  - with a camera switcher
//   2. USB / handheld scanner (keyboard wedge) - works with the camera
//      open OR with the manual-entry box focused
//   3. manual typing + Enter
//   4. paste
//
// Browser camera errors surface as raw DOMException names that mean
// nothing to a shopkeeper. Translate the ones that actually happen into
// an instruction the user can act on.
function friendlyCameraError(err) {
  const name = err?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission was denied. Allow camera access for this site in your browser settings, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera was found on this device. You can type the barcode instead.";
  }
  if (name === "NotReadableError") {
    return "The camera is already in use by another app. Close it and try again.";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "The camera needs a secure connection (HTTPS). Open this site over HTTPS, or type the barcode instead.";
  }
  return err?.message || "Could not access the camera.";
}

export default function BarcodeScannerModal({ visible, onClose, onDetected, title = "Scan Barcode" }) {
  const videoRef = useRef(null);
  // ZXing's continuous decoder fires its callback on EVERY frame that
  // decodes successfully — holding a barcode in view for a second can
  // emit a dozen identical results. This latch makes one presentation of
  // a barcode produce exactly one onDetected call. It is reset when the
  // modal reopens, so deliberately scanning the same item again still
  // registers as a new scan.
  const handledRef = useRef(false);
  const stopCameraRef = useRef(() => {});
  const [cameraError, setCameraError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  // Camera switching (laptops with several cameras, phones front/back).
  // `deviceId` undefined = ZXing's default, which prefers the rear camera
  // on phones.
  const [deviceId, setDeviceId] = useState(undefined);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);

  // Keep the latest onDetected in a ref so the camera effect below never
  // depends on it. Without this, a parent that re-creates its handler each
  // render would tear down and restart the camera stream on every render —
  // visibly flickering the preview on mobile.
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  // Single exit point for every input method.
  const accept = useCallback((raw) => {
    const code = normalizeBarcode(raw);
    if (!code || handledRef.current) return;
    handledRef.current = true;
    // Release the camera the moment a code is accepted so the preview
    // never stays live after a successful scan (battery + privacy).
    stopCameraRef.current();
    onDetectedRef.current?.(code);
  }, []);

  // USB / handheld scanner. Only active while this modal is open; the
  // page behind it must disable its own listener (see `enabled` there).
  useBarcodeWedge({ onScan: accept, enabled: visible });

  // Fresh state each time the modal opens.
  useEffect(() => {
    if (!visible) return;
    setCameraError(null);
    setManualMode(false);
    setManualCode("");
    setDeviceId(undefined);
    setActiveDeviceId(null);
    handledRef.current = false;
  }, [visible]);

  // Camera runs only while the modal is open AND the camera view is
  // showing. Leaving the camera view (manual entry) releases the camera;
  // returning to it restarts the stream on the freshly mounted <video>.
  useEffect(() => {
    if (!visible || manualMode) return undefined;

    const reader = new BrowserMultiFormatReader();
    let stopped = false;
    let controls = null;

    const stopCamera = () => {
      stopped = true;
      try {
        controls?.stop();
      } catch {
        // Stream may already be closed — nothing to clean up.
      }
      // @zxing/browser does not always detach the underlying MediaStream;
      // stopping every track guarantees the camera light goes out on
      // mobile browsers.
      try {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks?.().forEach((track) => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
      } catch {
        // Nothing attached.
      }
    };
    stopCameraRef.current = stopCamera;

    reader
      .decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (stopped || handledRef.current) return;
        if (result) {
          accept(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          // Real decode errors are extremely frequent (they fire on every
          // frame with no barcode in view) — NotFoundException is the
          // normal "nothing found this frame" case and is safe to ignore.
        }
      })
      .then((c) => {
        if (stopped) {
          // Modal closed / view changed while the camera was starting.
          c.stop();
          return;
        }
        controls = c;
        try {
          const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
          setActiveDeviceId(track?.getSettings?.().deviceId || null);
        } catch {
          // Settings not exposed on this browser.
        }
        // Labels/ids are only reliable after permission was granted.
        BrowserCodeReader.listVideoInputDevices()
          .then((list) => !stopped && setDevices(list))
          .catch(() => {});
      })
      .catch((err) => {
        if (stopped) return;
        setCameraError(friendlyCameraError(err));
        setManualMode(true);
      });

    return stopCamera;
  }, [visible, manualMode, deviceId, accept]);

  if (!visible) return null;

  const submitManual = () => accept(manualCode);

  const switchCamera = () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === activeDeviceId);
    setDeviceId(devices[(idx + 1) % devices.length].deviceId);
  };

  return (
    <Modal visible={visible} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="btn-icon">
          <X size={18} className="text-slate-500" />
        </button>
      </div>

      {!manualMode ? (
        <>
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2/3 h-1/2 border-4 border-brand rounded-2xl" />
            </div>
            {devices.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/75"
              >
                <SwitchCamera size={14} /> Switch camera
              </button>
            )}
          </div>
          {cameraError && (
            <p className="text-sm text-red-600 mt-3">{cameraError}</p>
          )}
          <p className="text-xs text-slate-500 mt-3 text-center">
            Point your camera at a barcode or QR code. A USB scanner works too — just scan.
          </p>
          <button
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-sm"
            onClick={() => setManualMode(true)}
          >
            <Keyboard size={16} /> Enter barcode manually
          </button>
        </>
      ) : (
        <div>
          <label className="block text-sm text-slate-500 font-semibold mb-1.5">Barcode</label>
          <input
            autoFocus
            className="input"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Type, paste or scan with a USB scanner"
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
          />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <ScanLine size={13} /> USB / handheld scanner ready
          </p>
          {cameraError && <p className="text-sm text-red-600 mt-2">{cameraError}</p>}
          <div className="flex gap-2 mt-4">
            {!cameraError && (
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-sm"
                onClick={() => setManualMode(false)}
              >
                <Camera size={16} /> Use camera
              </button>
            )}
            <button
              className="flex-1 py-2.5 rounded-lg bg-brand text-white font-semibold text-sm disabled:opacity-50"
              disabled={!manualCode.trim()}
              onClick={submitManual}
            >
              Use this code
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
