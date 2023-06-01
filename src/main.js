import "./style.css";
import { WebContainer } from "@webcontainer/api";
import { files } from "./files";
import { getEditor } from "./monacoapi";
import * as monaco from "monaco-editor";
import getLanguageFromFileExtension from "./fileExtMap";

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

/** @type {monaco.editor | null}  */
let editor = null;
let currentFile = null;
let editorMutexLock = false;

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
    // if (item.name == "node_modules") {
    //   return
    // }
    let fileDiv = document.createElement("div");

    // Set name
    fileDiv.innerHTML = item.name + (item.isDirectory() ? "/" : "");
    // Add classes
    fileDiv.classList.add("px-6", "py-2", "text-sm");

    // Grey out directories
    const textColor = item.isDirectory() ? "text-gray-400" : "text-white";
    fileDiv.classList.add(textColor);

    // Add onclick to files
    if (item.isFile())
      fileDiv.onclick = () => {
        updateActiveFile(rootPath + item.name);
      };
    if (item.isDirectory())
      fileDiv.onclick = (event) => {
        expandDirectory(event, rootPath + item.name);
      };

    // Add to files tab
    filesTab.appendChild(fileDiv);
  });
};

async function expandDirectory(event, dirPath) {
  const target = event.target;
  /** @type {HTMLDivElement | null} */
  const filesTab = target;
  event.stopPropagation();
  console.log("called " + dirPath);
  if (target.classList.contains("expanded")) {
    console.log("removing");
    while (filesTab.firstElementChild) {
      filesTab.removeChild(filesTab.firstElementChild);
    }
    target.classList.remove("expanded");
  } else {
    console.log("adding");
    const files = await webcontainerInstance.fs.readdir(dirPath, {
      withFileTypes: true,
    });
    target.classList.add("expanded");
    files.forEach((item) => {
      // File Div
      let fileDiv = document.createElement("div");
      fileDiv.innerHTML = item.name + (item.isDirectory() ? "/" : "");
      // Add classes
      fileDiv.classList.add("px-6", "py-2", "text-sm");
      // Grey out directories
      const textColor = item.isDirectory() ? "text-gray-400" : "text-white";
      fileDiv.classList.add(textColor);
      // Add onclick to files
      if (item.isFile()) {
        fileDiv.onclick = (e) => {
          e.stopPropagation();
          updateActiveFile(dirPath + "/" + item.name);
        };
      }
      if (item.isDirectory()) {
        fileDiv.onclick = (event) => {
          event.stopPropagation();
          expandDirectory(event, dirPath + "/" + item.name);
        };
      }
      filesTab.append(fileDiv);
      // Add to files tab
    });
  }
}

async function updateActiveFile(filePath) {

  document.getElementById('currentFile').innerText = filePath.replace("/", "").replaceAll("/", " > ")
  // Lock editor
  editor.updateOptions({ readOnly: true });
  editorMutexLock = true;

  // change current file
  currentFile = filePath;

  // Get file contents
  let fileContents = await readFromContainerFS(filePath);

  // uint8array to string
  fileContents = new TextDecoder("utf-8").decode(fileContents);

  // Set editor value
  editor.getModel().setValue(fileContents);

  //get file extension
  const fileExtension = filePath.split(".").pop();

  // update language
  monaco.editor.setModelLanguage(
    editor.getModel(),
    getLanguageFromFileExtension(fileExtension)
  );

  // Unlock editor
  editor.updateOptions({ readOnly: false });
  editorMutexLock = false;

}

const urlParams = new URLSearchParams(window.location.search);
const repoUrl = urlParams.get("github");
let mountFiles = files;
window.addEventListener("load", async () => {
  // Call only once
  // Fix this later
  currentFile = null;
  // Get editor will init the editor if it's not initialized yet
  editor = getEditor();
  // Set the editor value to the contents of index.js
  editor.getModel().setValue("// Select a file to get started :)");
  // Write the contents of the editor to index.js
  editor.getModel().onDidChangeContent(() => {
    if (!currentFile) return;
    if (editorMutexLock) return;

    const filePath = currentFile;
    const content = editor.getModel().getValue();
    writeToContainerFS(filePath, content);
  });
  webcontainerInstance = await WebContainer.boot();
  if (repoUrl) {
    mountFiles = null;
    // Get files from github
    const [_, __, ___, userName, repoName] = repoUrl.split("/");
    const url = `https://api.github.com/repos/${userName}/${repoName}/git/trees/main?recursive=1`;
    const response = await fetch(url);
    const data = await response.json();

    for (let ent of data.tree) {
      if (ent.type === "tree") {
        webcontainerInstance.fs.mkdir(ent.path);
      } else {
        const rawContentUrl = `https://raw.githubusercontent.com/${userName}/${repoName}/main/${ent.path}`;
        const res = await fetch(rawContentUrl);
        const fileName = ent.path.split("/").pop();
        const fileExtension = fileName.split(".").pop();
        let content = "";
        if (
          fileExtension == "png" ||
          fileExtension == "jpeg" ||
          fileExtension == "jpg" ||
          fileExtension == "svg"
        )
          content = new Uint8Array(await res.arrayBuffer());
        else content = await res.text();
        await webcontainerInstance.fs.writeFile(ent.path, content);
      }
    }
  }

  if (mountFiles) await webcontainerInstance.mount(mountFiles);

  mapContainerFS();
  const exitCode = await installDependencies();
  iframeEl.src = "complete.html";
  //const exitCode = 0;
  if (exitCode !== 0) {
    throw new Error("Installation failed");
  }
  mapContainerFS();

  const input = document.getElementById("consoleInput");

  input.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {

      if (input.value.startsWith("npm run ")) {
        spawnProcess(input.value.replace("npm run ", ""));
      }
      input.value = "";
    }
  });

});

async function installDependencies() {
  // Install dependencies
  const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
  const consoleStream = document.getElementById("shell");
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        const colorRegex = /\x1B\[\d+m/g;
        consoleStream.innerText += data.replace(colorRegex, "");
        consoleStream.scrollTop = consoleStream.scrollHeight;
      },
    })
  );
  installProcess.exit;
  return installProcess.exit;
}

async function spawnProcess(command) {
  // Run `npm run start` to start the Express app
  const process = await webcontainerInstance.spawn("npm", ["run", command]);
  const consoleStream = document.getElementById("shell");
  process.output.pipeTo(
    new WritableStream({
      write(data) {
        const colorRegex = /\x1B\[\d+m/g;
        consoleStream.innerText += data.replace(colorRegex, "");
        consoleStream.scrollTop = consoleStream.scrollHeight;
      },
    })
  );
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

async function addFileInFs(path, content) {
  const pathArr = path.split("/");
  const fileName = pathArr.pop();
  const dirPath = pathArr.join("/");

  if (dirPath) {
    const path = dirPath.split("/");
    let currentPath = "";
    for (let i = 0; i < path.length; i++) {
      currentPath += path[i] + "/";
      try {
        await webcontainerInstance.fs.mkdir(currentPath);
      } catch (e) {
        // Ignore :)
        // console.log(e);
      }
    }
    
  }
  webcontainerInstance.fs.writeFile(dirPath + "/" + fileName, content);
  mapContainerFS();
};

document.getElementById("createFile").addEventListener("click", () => {
  document.getElementById("addFileWrapperDiv").classList.remove("hidden");
})

document.getElementById("createFileInput").addEventListener('keydown', async (e) => {

  if (e.key == 'Enter') {
    console.log(e.target.value)
    await addFileInFs(e.target.value,"");
    document.getElementById("addFileWrapperDiv").classList.add("hidden");
    e.target.value = "";
  }


})