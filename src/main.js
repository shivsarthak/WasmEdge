import "./style.css";
import { WebContainer } from "@webcontainer/api";
import { files } from "./files";
import { getEditor } from "./monacoapi";
import * as monaco from "monaco-editor";

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

/** @type {monaco.editor | null}  */
let editor = null;

window.addEventListener("load", async () => {
  // Get editor will init the editor if it's not initialized yet
  editor = getEditor();
  // Set the editor value to the contents of index.js
  editor.getModel().setValue(files["index.js"].file.contents);  
  // Write the contents of the editor to index.js
  editor.getModel().onDidChangeContent((event) => {
    writeIndexJS(editor.getModel().getValue());
  });

  // Call only once
  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(files);

  const exitCode = await installDependencies();
  if (exitCode !== 0) {
    throw new Error("Installation failed");
  }

  startDevServer();
});

async function installDependencies() {
  // Install dependencies
  const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );
  // Wait for install command to exit
  return installProcess.exit;
}

async function startDevServer() {
  // Run `npm run start` to start the Express app
  await webcontainerInstance.spawn("npm", ["run", "start"]);

  // Wait for `server-ready` event
  webcontainerInstance.on("server-ready", (port, url) => {
    iframeEl.src = url;
  });
}

/**
 * @param {string} content
 */

async function writeIndexJS(content) {
  await webcontainerInstance.fs.writeFile("/index.js", content);
}

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector("iframe");

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector("textarea");
