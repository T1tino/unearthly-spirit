# iFrame PCF Code Component

## Clipboard permission test variant

This separate control variant preserves the original compiled PCF and adds an iframe `allow` attribute that delegates `clipboard-read` and `clipboard-write` to the exact origin configured in `src`. The control has a distinct namespace and constructor so it can be imported alongside the regular build.

The permission is only a request/delegation. It cannot override a restrictive `Permissions-Policy` from the Power Apps host, browser policy, or clipboard user-activation requirements. Clipboard read may prompt or remain blocked; writing generally needs a user gesture such as pressing a button inside the page. CORS is unrelated to clipboard permissions, and making the iframe same-origin with Power Apps is neither needed nor a realistic option for GitHub Pages.

Compare this version with the regular build under the same browser and Power Apps host. In `notes.js`, try `navigator.clipboard.writeText(text)` from the actual Copy button click and record `navigator.clipboard.readText()` separately; do not infer clipboard-read permission from a successful write. The page must be in a secure context (HTTPS).

Build this variant from this directory with `npm ci && npm run refreshTypes && npm run build`. Its artifacts are isolated in this project's `out` directory.

![demo](/img/iFramePCF.gif)

The **iFrameVirtualPCF** code component provides a wrapper around the `<iframe>` [HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#positioning_and_scaling), providing a nested browsing context inside a Power Apps Canvas App or [Custom Page](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/add-page-to-model-app).

This is a non-standard React ([virtual](https://powerapps.microsoft.com/en-us/blog/virtual-code-components-for-power-apps-using-react-and-fluent-ui-react-platform-libraries/)) code component.

## Configuration
The control accepts the following properties:
### Properties
- **src** - URL of the webpage to embed
- **FullscreenButton** - sets the visibility of the [Full screen](https://docs.microsoft.com/en-us/power-apps/developer/component-framework/reference/mode/setfullscreen) button. This allows users to expand the iFrame to fit the screen of the host Canvas App (see the demo `.gif` above)
- **noteText** - latest note received from the embedded page
- **noteId** - increments each time a note is received, including when the same text is sent again

## Leaflet notes bridge

Set `src` in the Canvas App to the GitHub Pages URL and append the encoded `data` value once:

```powerfx
"https://cesargarcia-cdcr.github.io/leaflet-Maps/?data=" & EncodeUrl(varEncodedData)
```

Do not include a signed Power Automate URL or other secret in the app source, a public page, or this repository. Values embedded in a Canvas App URL are visible to app users. If a signed URL was exposed, rotate it before using the flow again.

The PCF accepts messages only when both the sending iframe window and its origin match the configured `src`. The current page can continue sending a plain string. To avoid `postMessage(..., "*")` on the page, update `notes.js` to accept the PCF's origin handshake and use that exact origin:

```javascript
let powerAppsOrigin;

window.addEventListener("message", (event) => {
  if (
    event.source !== window.parent ||
    event.data?.type !== "leaflet-notes:init"
  ) {
    return;
  }
  powerAppsOrigin = event.origin;
});

function sendNoteToPowerApps(text) {
  if (!powerAppsOrigin) {
    throw new Error("The Power Apps message bridge is not ready.");
  }
  window.parent.postMessage(
    { type: "leaflet-notes:note", text },
    powerAppsOrigin
  );
}
```

Replace the existing wildcard `postMessage` call in `copyResult()` with `sendNoteToPowerApps(resultText)`. The iframe must be reloaded after the PCF sends its handshake.

To display a confirmation outside the iframe in a Canvas App, add a repeating Timer (for example, `Duration = 250`, `Repeat = true`, `AutoStart = true`, `Visible = false`) and initialize `varLastNoteId` to `0`. Set the Timer's `OnTimerEnd` to:

```powerfx
If(
    IFrameVirtualPCF1.noteId <> varLastNoteId,
    Set(varLastNoteId, IFrameVirtualPCF1.noteId);
    Set(varPendingNote, IFrameVirtualPCF1.noteText);
    Set(varShowNoteDialog, true)
)
```

Show a container with `Visible = varShowNoteDialog` and a label with `Text = varPendingNote`. Its **Copy** button can use `OnSelect = Copy(varPendingNote); Set(varShowNoteDialog, false)`, and its **Cancel** button can use `OnSelect = Set(varShowNoteDialog, false)`. The copy is initiated by the user's button click, not by the iframe message.

## Installation / Usage

GitHub Actions builds both `main` and `clipboard-write` on pushes and pull requests. You can also start a build from the **Actions** tab with **Run workflow**. Download the compiled control from that run's **Artifacts** section; artifacts are retained for 14 days.

There are two ways to install the PCF component.
1. Download the managed solution from the [releases](https://github.com/iamgreggarcia/IFrameVirtualPCF/releases/) page of this repo
2. Clone and push the solution via the [MS Power Platform CLI](https://docs.microsoft.com/en-us/power-platform/developer/cli/introduction)

### Use Power Platform CLI

Make sure you have an [authentication profile](https://docs.microsoft.com/en-us/power-platform/developer/cli/reference/auth#pac-auth-create) configured.

Clone the repo:
```bash
git clone https://github.com/T1tino/unearthly-spirit.git
```
Push the component to your chosen environment:
```bash
pac pcf push --publisher-prefix <your-publisher-prefix>
```

### Add component to a Canvas App
![use inside canvas apps](/img/iFrameAddComponent.gif)


## Limitations
* SharePoint URLs work inside custom pages but ***not*** Canvas Apps. This is because SharePoint (online) restricts cross-site scripting with powerapps.com. Read this helpful tutorial for more info: [SharePoint Document Library In A Power Apps Custom Page](https://www.matthewdevaney.com/sharepoint-document-library-in-a-power-apps-custom-page/)
