"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import type { Result } from "@zxing/library";
import { Button } from "@/components/ui/button";

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
};

type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorCtor;
};

interface BarcodeScannerPanelProps {
  readonly active: boolean;
  readonly onDetected: (code: string) => void;
}

export function BarcodeScannerPanel({
  active,
  onDetected,
}: BarcodeScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectorRef = useRef<InstanceType<BarcodeDetectorCtor> | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const lastDetectedAtRef = useRef<number>(0);
  const wasActiveRef = useRef(false);

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const globalWindow = globalThis as typeof globalThis &
    WindowWithBarcodeDetector;

  const isDetectorSupported = "BarcodeDetector" in globalWindow;
  const hasMediaDevices =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const emitDetectedCode = useCallback(
    (value: string) => {
      if (!value) return;

      const now = Date.now();
      if (now - lastDetectedAtRef.current < 1200) return;
      lastDetectedAtRef.current = now;

      onDetected(value);
    },
    [onDetected],
  );

  const stopScanner = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      const currentStream = videoRef.current.srcObject;
      if (currentStream instanceof MediaStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }

    setIsRunning(false);
  }, []);

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || !detector || !isRunning) return;

    const canReadFrame = video.readyState >= 2;
    if (!canReadFrame) {
      frameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      frameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    detector
      .detect(canvas)
      .then((barcodes: DetectedBarcode[]) => {
        const value = barcodes.find(
          (barcode: DetectedBarcode) => barcode.rawValue,
        )?.rawValue;
        if (!value) return;
        emitDetectedCode(value);
      })
      .catch(() => {
        // keep looping when no code detected
      })
      .finally(() => {
        frameRef.current = requestAnimationFrame(detectLoop);
      });
  }, [emitDetectedCode, isRunning]);

  const startWithNativeDetector = useCallback(async () => {
    if (isRunning) return;

    setError(null);

    try {
      const BarcodeDetectorClass = globalWindow?.BarcodeDetector;

      if (!BarcodeDetectorClass) {
        setError("Camera barcode detection is unavailable in this browser.");
        return;
      }

      detectorRef.current = new BarcodeDetectorClass({
        formats: [
          "ean_13",
          "ean_8",
          "code_128",
          "code_39",
          "upc_a",
          "upc_e",
          "itf",
          "qr_code",
        ],
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsRunning(true);
      frameRef.current = requestAnimationFrame(detectLoop);
    } catch {
      setError("Unable to access camera. Please allow camera permission.");
      stopScanner();
    }
  }, [detectLoop, globalWindow, isRunning, stopScanner]);

  const startWithZxingFallback = useCallback(async () => {
    if (isRunning) return;

    if (!hasMediaDevices) {
      setError("Camera access is not available in this browser.");
      return;
    }

    if (!videoRef.current) {
      setError("Camera preview is not ready yet.");
      return;
    }

    setError(null);

    try {
      zxingReaderRef.current ??= new BrowserMultiFormatReader();

      const controls = await zxingReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result: Result | undefined) => {
          const code = result?.getText();
          if (!code) return;
          emitDetectedCode(code);
        },
      );

      zxingControlsRef.current = controls;
      setIsRunning(true);
    } catch {
      setError("Unable to access camera. Please allow camera permission.");
      stopScanner();
    }
  }, [emitDetectedCode, hasMediaDevices, isRunning, stopScanner]);

  const startScanner = useCallback(async () => {
    if (isDetectorSupported) {
      await startWithNativeDetector();
      return;
    }

    await startWithZxingFallback();
  }, [isDetectorSupported, startWithNativeDetector, startWithZxingFallback]);

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      startScanner().catch(() => {
        setError("Unable to start scanner.");
      });
    }

    if (!active && wasActiveRef.current) {
      stopScanner();
    }

    wasActiveRef.current = active;
  }, [active, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  if (!active) return null;

  return (
    <div className="rounded-md border bg-background p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Camera Scanner</p>
        <div className="text-xs text-muted-foreground">
          {isRunning ? "Scanning..." : "Opening camera..."}
        </div>
      </div>

      <video
        ref={videoRef}
        className="w-full max-h-64 rounded border bg-black"
        muted
        playsInline
      />

      {!isDetectorSupported && hasMediaDevices && (
        <p className="text-xs text-muted-foreground">
          Native barcode detector is unavailable; using compatibility mode.
        </p>
      )}

      {!hasMediaDevices && (
        <p className="text-xs text-muted-foreground">
          Camera access is not supported in this browser.
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {isRunning && (
        <Button type="button" variant="outline" size="sm" onClick={stopScanner}>
          Stop Camera
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: point the camera at a barcode and keep it steady for 1-2 seconds.
      </p>
    </div>
  );
}
