// ==============================
// Canvas Setup
// ==============================
const canvasElement = document.getElementById("map");
let topLayerIndex = 1;

// ==============================
// DATA RESTORATION AAAAAAHHHHHHH
// ==============================
let db;

const DB_NAME = "LumaBlocksDB";
const STORE_NAME = "layout";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      database.createObjectStore(STORE_NAME, { keyPath: "id" });
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

function serializeLayout() {
  const blocks = document.querySelectorAll(".block");

  const data = [];

  blocks.forEach(block => {
    // Ignore blocks already inside folders (saved via parent)
    if (block.parentElement.classList.contains("children")) return;

    data.push(serializeBlock(block));
  });

  return data;
}

function serializeBlock(blockElement) {
  const blockData = {
    id: crypto.randomUUID(),
    type: [...blockElement.classList].find(c => c !== "block"),
    left: blockElement.style.left,
    top: blockElement.style.top,
    zIndex: blockElement.style.zIndex,
    html: blockElement.innerHTML,
    children: []
  };

  const childrenContainer = blockElement.querySelector(".children");
  if (childrenContainer) {
    childrenContainer.querySelectorAll(".block").forEach(child => {
      blockData.children.push(serializeBlock(child));
    });
  }

  return blockData;
}

async function saveLayout() {
  if (!db) return;

  const layoutData = serializeLayout();

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await store.put({
    id: "main-layout",
    data: layoutData
  });
}

async function loadLayout() {
  if (!db) return;

  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const request = store.get("main-layout");

  request.onsuccess = () => {
    if (!request.result) return;

    canvasElement.innerHTML = "";
    request.result.data.forEach(blockData => {
      restoreBlock(blockData, canvasElement);
    });
  };
}

function restoreBlock(blockData, parentElement) {
  const blockElement = document.createElement("div");

  blockElement.className = `block ${blockData.type}`;
  blockElement.style.position = "absolute";
  blockElement.style.left = blockData.left;
  blockElement.style.top = blockData.top;
  blockElement.style.zIndex = blockData.zIndex;
  blockElement.innerHTML = blockData.html;

  enableDragging(blockElement);

  parentElement.appendChild(blockElement);

  const childrenContainer = blockElement.querySelector(".children");
  if (childrenContainer && blockData.children) {
    blockData.children.forEach(childData => {
      restoreBlock(childData, childrenContainer);
    });
  }
}



// ==============================
// Add Block Entry Point
// ==============================
function addBlock(blockType) {
  const blockElement = document.createElement("div");

  blockElement.className = `block ${blockType}`;
  blockElement.style.position = "absolute";
  blockElement.style.left = "100px";
  blockElement.style.top = "100px";
  blockElement.style.zIndex = topLayerIndex++;

  blockElement.innerHTML = buildBlockContent(blockType);

  enableDragging(blockElement);
  canvasElement.appendChild(blockElement);
}

// ==============================
// Build Block Inner HTML
// ==============================
function buildBlockContent(blockType) {
  let content = "";

  if (blockType === "folder") {
    const folderName =
      prompt("What would you like to call this folder?") || "Untitled Folder";

    content = `
      <strong class="block-title">${folderName}</strong>
      <div class="children"></div>
    `;
  }

  if (blockType === "bookmark") {
    const url = prompt("Enter your URL to bookmark");
    if (!url) return "";

    const displayText = url
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    content = `
      <strong class="block-title">BOOKMARK</strong>
      <div class="bookmark-content">
        <a href="${url}" target="_blank">${displayText}</a>
      </div>
    `;
  }

  if (blockType === "note") {
    content = `
      <strong class="block-title" contenteditable="true">
        Enter note title
      </strong>
      <div class="note-content">
        <p contenteditable="true">
          click me to start writing your notes!~
        </p>
      </div>
    `;
  }

  return content;
}

// ==============================
// Drag Logic
// ==============================
function enableDragging(blockElement) {
  let mouseOffsetX = 0;
  let mouseOffsetY = 0;

  blockElement.addEventListener("mousedown", (event) => {
    // Prevent dragging when editing text
    if (event.target.isContentEditable) return;

    event.preventDefault();
    blockElement.style.zIndex = topLayerIndex++;

    mouseOffsetX = event.clientX - blockElement.offsetLeft;
    mouseOffsetY = event.clientY - blockElement.offsetTop;

    function handleMouseMove(moveEvent) {
      blockElement.style.left =
        moveEvent.clientX - mouseOffsetX + "px";
      blockElement.style.top =
        moveEvent.clientY - mouseOffsetY + "px";
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      tryDropIntoFolder(blockElement);
      snapToNearbyBlocks(blockElement);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  });
}

// ==============================
// Snap Logic (Lego Feel)
// ==============================
function snapToNearbyBlocks(activeBlock) {
  if (activeBlock.parentElement.classList.contains("children")) return;

  const allBlocks = document.querySelectorAll(".block");
  const SNAP_DISTANCE = 40;

  allBlocks.forEach(targetBlock => {
    if (targetBlock === activeBlock) return;
    if (targetBlock.parentElement.classList.contains("children")) return;

    const dx = targetBlock.offsetLeft - activeBlock.offsetLeft;
    const dy = targetBlock.offsetTop - activeBlock.offsetTop;

    if (Math.abs(dx) < SNAP_DISTANCE && Math.abs(dy) < SNAP_DISTANCE) {
      activeBlock.style.left = targetBlock.offsetLeft + 30 + "px";
      activeBlock.style.top = targetBlock.offsetTop + 30 + "px";
    }
  });
}
saveLayout();

// ==============================
// Folder Drop Logic
// ==============================
function tryDropIntoFolder(blockElement) {
  const folderBlocks = document.querySelectorAll(".folder");

  folderBlocks.forEach(folderElement => {
    if (folderElement === blockElement) return;

    const folderRect = folderElement.getBoundingClientRect();
    const blockRect = blockElement.getBoundingClientRect();

    const isInside =
      blockRect.left > folderRect.left &&
      blockRect.right < folderRect.right &&
      blockRect.top > folderRect.top &&
      blockRect.bottom < folderRect.bottom;

    if (!isInside) return;

    const childrenContainer = folderElement.querySelector(".children");
    if (!childrenContainer) return;

    childrenContainer.appendChild(blockElement);

    blockElement.style.position = "relative";
    blockElement.style.left = "0";
    blockElement.style.top = "0";
  });
}
saveLayout();

// ==============================
// Folder Expand / Collapse
// ==============================
document.addEventListener("dblclick", (event) => {
  const folderElement = event.target.closest(".folder");
  if (!folderElement) return;

  const children = folderElement.querySelector(".children");
  if (!children) return;

  children.style.display =
    children.style.display === "none" ? "block" : "none";
});
saveLayout();


/*
This is just the preview function
*/
const previewElement = document.createElement("div");
previewElement.className = "bookmark-preview";
document.body.appendChild(previewElement);

function enableBookmarkPreview(bookmarkBlock) {
  const linkElement = bookmarkBlock.querySelector("a");
  if (!linkElement) return;

  let previewLoaded = false;

  bookmarkBlock.addEventListener("mouseenter", (event) => {
    const url = linkElement.href;

    previewElement.style.display = "block";
    previewElement.style.left = event.clientX + 20 + "px";
    previewElement.style.top = event.clientY + 20 + "px";

    if (!previewLoaded) {
      previewElement.innerHTML = `
        <iframe 
          src="${bookmark}" 
          sandbox="allow-scripts allow-same-origin">
        </iframe>
      `;
      previewLoaded = true;
    }
  });

  bookmarkBlock.addEventListener("mousemove", (event) => {
    previewElement.style.left = event.clientX + 20 + "px";
    previewElement.style.top = event.clientY + 20 + "px";
  });

  bookmarkBlock.addEventListener("mouseleave", () => {
    previewElement.style.display = "none";
    previewElement.innerHTML = "";
    previewLoaded = false;
  });
}
