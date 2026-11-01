export interface ClipboardPermissionConfig {
  clipboardRead: boolean;
  clipboardWrite: boolean;
  permissionOrigin: string;
}

export const clipboardPermissionConfig: ClipboardPermissionConfig = {
  clipboardRead: false,
  clipboardWrite: false,
  permissionOrigin: "iframe",
};
