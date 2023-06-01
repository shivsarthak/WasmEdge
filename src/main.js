import "./style.css";
import { WebContainer } from "@webcontainer/api";
import { files } from "./files";
import { getEditor } from "./monacoapi";
import * as monaco from "monaco-editor";

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

/** @type {monaco.editor | null}  */
let editor = null;
let currentFile = null;

const mapContainerFS = async () => {
  const rootPath = "/";

  let files = await webcontainerInstance.fs.readdir(rootPath, {
    withFileTypes: true,
  });
  const filesTab = document.getElementById("files");
  // Remove all children
  while (filesTab.firstChild) filesTab.removeChild(filesTab.firstChild);

  files.forEach((item) => {
    // File Div
    let fileDiv = document.createElement("div");

    // Set name
    fileDiv.innerHTML = item.name;
    // Add classes
    fileDiv.classList.add("px-6", "py-2", "border", "text-sm");

    // Grey out directories
    const textColor = item.isDirectory() ? "text-gray-400" : "text-white";
    fileDiv.classList.add(textColor);

    // Add onclick to files
    if (item.isFile())
      fileDiv.onclick = () => {
        updateActiveFile(rootPath + item.name);
      };

    // Add to files tab
    filesTab.appendChild(fileDiv);
  });
};

async function updateActiveFile(filePath) {
  // Lock editor
  editor.updateOptions({ readOnly: true });

  // change current file
  currentFile = filePath;

  // Get file contents
  let fileContents = await readFromContainerFS(filePath);
  
  // uint8array to string
  fileContents = new TextDecoder("utf-8").decode(fileContents);

  // Set editor value
  editor.getModel().setValue(fileContents);

  // Unlock editor
  editor.updateOptions({ readOnly: false });
}

window.addEventListener("load", async () => {
  // Fix this later
  currentFile = "/index.js";
  // Get editor will init the editor if it's not initialized yet
  editor = getEditor();
  // Set the editor value to the contents of index.js
  editor.getModel().setValue(files["index.js"].file.contents);
  // Write the contents of the editor to index.js
  editor.getModel().onDidChangeContent(() => {
    const filePath = currentFile;
    const content = editor.getModel().getValue();
    writeToContainerFS(filePath, content);
  });

  // Call only once
  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(files);

  mapContainerFS();
  const exitCode = await installDependencies();
  if (exitCode !== 0) {
    throw new Error("Installation failed");
  }
  mapContainerFS();
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

async function writeToContainerFS(filePath, content) {
  await webcontainerInstance.fs.writeFile(filePath, content);
}

async function readFromContainerFS(filePath) {
  const content = await webcontainerInstance.fs.readFile(filePath);
  return content;
}

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector("iframe");

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector("textarea");
