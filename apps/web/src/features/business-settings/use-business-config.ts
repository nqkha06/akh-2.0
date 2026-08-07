"use client";

import {
  DEFAULT_BACKGROUND_IMAGE_PRESETS,
  DEFAULT_BACKGROUND_VIDEO_PRESETS,
  DEFAULT_UPLOAD_MIME_TYPES,
  DEFAULT_UPLOAD_LIMITS,
} from "@stu/contracts";
import { useEffect, useState } from "react";

import type { PublicBusinessConfig } from "./types";

const fallback: PublicBusinessConfig = {
  version: 1,
  authentication: { registrationEnabled: true, googleLoginEnabled: true },
  operations: { maintenanceMode: false, withdrawalsPaused: false },
  uploads: {
    memberFileMaxBytes: DEFAULT_UPLOAD_LIMITS.memberFileMaxBytes,
    coverImageMaxBytes: DEFAULT_UPLOAD_LIMITS.coverImageMaxBytes,
    allowedMimeTypes: [...DEFAULT_UPLOAD_MIME_TYPES],
  },
  presetLibrary: {
    images: DEFAULT_BACKGROUND_IMAGE_PRESETS,
    videos: DEFAULT_BACKGROUND_VIDEO_PRESETS,
  },
};

let cached: PublicBusinessConfig | null = null;
let pending: Promise<PublicBusinessConfig> | null = null;

async function loadBusinessConfig() {
  if (cached) return cached;
  pending ??= fetch("/api/backend/business-config", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Không thể tải Business settings.");
      return (await response.json()) as PublicBusinessConfig;
    })
    .then((value) => {
      cached = value;
      return value;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function useBusinessConfig() {
  const [config, setConfig] = useState(cached ?? fallback);

  useEffect(() => {
    let active = true;
    void loadBusinessConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return config;
}

export function clearBusinessConfigCache() {
  cached = null;
  pending = null;
}
