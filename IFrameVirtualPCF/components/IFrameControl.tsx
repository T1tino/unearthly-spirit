import { DefaultButton, Stack, ThemeProvider } from "@fluentui/react";
import * as React from "react";
import { IFrameControlProps } from "./Component.types";
const defaultSrc = "https://cesargarcia-cdcr.github.io/leaflet-Maps/";

export const IFrameControl = React.memo((props: IFrameControlProps) => {
  const { width, height, onFullScreen, isFullScreen, showFullScreenBtn } =
    props;

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
