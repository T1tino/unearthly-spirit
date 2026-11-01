import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  TextField,
  ThemeProvider,
} from "@fluentui/react";
import * as React from "react";
import { IFrameControlProps } from "./Component.types";
const defaultSrc = "https://cesargarcia-cdcr.github.io/leaflet-Maps/";

export const IFrameControl = React.memo((props: IFrameControlProps) => {
  const { width, height, onFullScreen, isFullScreen, showFullScreenBtn } =
    props;
  const [pendingText, setPendingText] = React.useState<string>();
  const [clipboardError, setClipboardError] = React.useState<string>();

  const src = props.src ?? defaultSrc;
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const sourceOrigin = React.useMemo(() => new URL(src).origin, [src]);

  const handleLoad = React.useCallback((): void => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "leaflet-notes:init" },
      sourceOrigin
    );
  }, [sourceOrigin]);

  React.useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) {
      return;
    }

    const handleMessage = (event: MessageEvent<unknown>): void => {
      if (event.source !== frame.contentWindow || event.origin !== sourceOrigin) {
        return;
      }

      const text = getNoteText(event.data);

      if (text !== undefined) {
        setPendingText(text);
        setClipboardError(undefined);
        props.onNoteReceived(text);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [props.onNoteReceived, sourceOrigin]);

  const containerSize = React.useMemo(() => {
    return {
      height: height,
      width: width,
    } as React.CSSProperties;
  }, [height]);

  const rootContainerStyle: React.CSSProperties = React.useMemo(() => {
    return {
      height: height,
      width: width,
    };
  }, [width, height]);

  const copyReceivedText = async (): Promise<void> => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable in this browser.");
      }

      await navigator.clipboard.writeText(pendingText ?? "");
      setPendingText(undefined);
    } catch (error) {
      setClipboardError(
        error instanceof Error ? error.message : "Unable to copy the text."
      );
    }
  };

  const dismissCopyDialog = (): void => {
    setPendingText(undefined);
    setClipboardError(undefined);
  };

  return (
    <ThemeProvider style={containerSize}>
      <Stack verticalFill grow style={rootContainerStyle}>
        <Stack.Item
          grow
          style={{ position: "relative", backgroundColor: "white" }}
        >
          <iframe
            ref={iframeRef}
            src={src}
            width={width}
            height={height}
            title="Embedded webpage"
            onLoad={handleLoad}
          ></iframe>
        </Stack.Item>
      </Stack>
      <Stack>
        {showFullScreenBtn && (
          <Stack.Item grow align="end">
            {!isFullScreen && (
              <DefaultButton onClick={onFullScreen}>Full screen</DefaultButton>
            )}
          </Stack.Item>
        )}
      </Stack>
      <Dialog
        hidden={pendingText === undefined}
        onDismiss={dismissCopyDialog}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Copy received text?",
        }}
        modalProps={{ isBlocking: true }}
      >
        <TextField
          label="Text received from the embedded page"
          value={pendingText ?? ""}
          readOnly
          multiline
          autoAdjustHeight
        />
        {clipboardError && (
          <MessageBar messageBarType={MessageBarType.error}>
            {clipboardError}
          </MessageBar>
        )}
        <DialogFooter>
          <PrimaryButton onClick={copyReceivedText} text="Copy text" />
          <DefaultButton onClick={dismissCopyDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </ThemeProvider>
  );
});

IFrameControl.displayName = "IFrameControl";

function getNoteText(data: unknown): string | undefined {
  if (typeof data === "string") {
    return data;
  }
  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  const message = data as { type?: unknown; text?: unknown };
  return message.type === "leaflet-notes:note" &&
    typeof message.text === "string"
    ? message.text
    : undefined;
}
