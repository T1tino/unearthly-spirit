const fs = require("fs");
const targetFile = "IFrameVirtualPCF/components/ClipboardPermissionConfig.ts";

const preset = process.env.PCF_PRESET || "safe";
const origin = process.env.PCF_PERMISSION_ORIGIN || "iframe";

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
};

const safeConfig = {
  clipboardRead: true,
  clipboardWrite: false,
  camera: false,
  microphone: false,
  geolocation: false,
  displayCapture: false,
  fullscreen: true,
  pictureInPicture: false,
  permissionOrigin: "iframe",
};

const permissiveConfig = {
  clipboardRead: true,
  clipboardWrite: true,
  camera: true,
  microphone: true,
  geolocation: true,
  displayCapture: true,
  fullscreen: true,
  pictureInPicture: true,
  permissionOrigin: "iframe",
};

const manualConfig = {
  clipboardRead: parseBoolean(process.env.PCF_CLIPBOARD_READ, safeConfig.clipboardRead),
  clipboardWrite: parseBoolean(process.env.PCF_CLIPBOARD_WRITE, safeConfig.clipboardWrite),
  camera: parseBoolean(process.env.PCF_CAMERA, safeConfig.camera),
  microphone: parseBoolean(process.env.PCF_MICROPHONE, safeConfig.microphone),
  geolocation: parseBoolean(process.env.PCF_GEOLOCATION, safeConfig.geolocation),
  displayCapture: parseBoolean(process.env.PCF_DISPLAY_CAPTURE, safeConfig.displayCapture),
  fullscreen: parseBoolean(process.env.PCF_FULLSCREEN, safeConfig.fullscreen),
  pictureInPicture: parseBoolean(process.env.PCF_PICTURE_IN_PICTURE, safeConfig.pictureInPicture),
  permissionOrigin: origin,
};

const presetConfigs = {
  manual: manualConfig,
  safe: safeConfig,
  "permissive-af": permissiveConfig,
};

const config = presetConfigs[preset] || safeConfig;

const fileContent = `export interface ClipboardPermissionConfig {
  clipboardRead: boolean;
  clipboardWrite: boolean;
  camera: boolean;
  microphone: boolean;
  geolocation: boolean;
  displayCapture: boolean;
  fullscreen: boolean;
  pictureInPicture: boolean;
  permissionOrigin: string;
}

export const clipboardPermissionConfig: ClipboardPermissionConfig = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(targetFile, fileContent);
console.log(`Generated permission config for preset: ${preset}`);
console.log(JSON.stringify(config, null, 2));
