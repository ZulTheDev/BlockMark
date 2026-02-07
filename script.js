// ================================
// LumaBlocks — All-in-One Script
// ================================

// ---------- Global State ----------
const map = document.getElementById("map");
let topLayerIndex = 1;
let currentUsername = null;

// ================================
// Cognito Configuration (EDIT THESE)
// ================================
const COGNITO = {
  domain: "https://us-east-1de69dgxpy.auth.us-east-1.amazoncognito.com",
  clientId: "5mqehvmde8ta3ao1pfvq2b6eck",
  redirectUri: window.location.origin + window.location.pathname,
};

// ================================
// Auth Actions
// ================================
function login() {
  window.location.href =
    `${COGNITO.domain}/login?` +
    `client_id=${COGNITO.clientId}` +
    `&response_type=token` +
    `&scope=openid+email+profile` +
    `&redirect_uri=${encodeURIComponent(COGNITO.redirectUri)}`;
}

function signup() {
  window.location.href =
    `${COGNITO.domain}/signup?` +
    `client_id=${COGNITO.clientId}` +
    `&response_type=token` +
    `&scope=openid+email+profile` +
    `&redirect_uri=${encodeURIComponent(COGNITO.redirectUri)}`;
}

function logout() {
  localStorage.removeItem("cognito_id_token");
  location.reload();
}

// ================================
// Token Handling
// ================================
function handleCognitoToken() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const token = params.get("id_token");

  if (token) {
    localStorage.setItem("cognito_id_token", token);
    window.history.replaceState({}, document.title, window.location.pathname);
    return token;
  }
  return localStorage.getItem("cognito_id_token");
}

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// ================================
// IndexedDB Setup
// ================================
const DB_NAME = "LumaBlocksDB";
const STORE_NAME = "layouts";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getLayoutKey() {
  return currentUsername ? `layout-${currentUsername}` : "layout-guest";
}

// ================================
// Save / Load Layout
// ================================
function serializeBlock(block) {
  const data = {
    type: [...block.classList].find(c => c !== "block"),
    left: block.style.left,
    top: block.style.top,
    zIndex: block.style.zIndex,
    html: block.innerHTML,
    children: []
  };

  const children = block.querySelector(".children");
  if (children) {
    children.querySelectorAll(":scope > .block").forEach(child => {
      data.children.push(serializeBlock(child));
    });
  }

  return data;
}

function serializeLayout() {
  return [...document.querySelectorAll("#map > .block")].map(serializeBlock);
}

async function saveLayout() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({
    id: getLayoutKey(),
    data: serializeLayout()
  });
}

async function loadLayout() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  return new Promise(resolve => {
    const req = tx.objectStore(STORE_NAME).get(getLayoutKey());
    req.onsuccess = () => resolve(req.result?.data || []);
    req.onerror = () => resolve([]);
  });
}

function restoreBlocks(blocks, parent = map) {
  blocks.forEach(data => {
    const block = document.createElement("div");
    block.className = `block ${data.type}`;
    block.style.position = "absolute";
    block.style.left = data.left;
    block.style.top = data.top;
    block.style.zIndex = data.zIndex;
    block.innerHTML = data.html;

    enableDragging(block);
    if (data.type === "bookmark") enableBookmarkPreview(block);

    parent.appendChild(block);

    const children = block.querySelector(".children");
    if (children && data.children.length) {
      restoreBlocks(data.children, children);
    }
  });
}

// ================================
// Block Creation
// ================================
function addBlock(type) {
  if (!currentUsername) {
    alert("Please login to save your progress ✨");
    return;
  }

  const block = document.createElement("div");
  block.className = `block ${type}`;
  block.style.left = "120px";
  block.style.top = "120px";
  block.style.zIndex = topLayerIndex++;

  block.innerHTML = buildBlockContent(type);
  enableDragging(block);
  if (type === "bookmark") enableBookmarkPreview(block);

  map.appendChild(block);
  saveLayout();
}

function buildBlockContent(type) {
  if (type === "folder") {
    const name = prompt("Folder name") || "Untitled Folder";
    return `<strong class="block-title">${name}</strong><div class="children"></div>`;
  }

  if (type === "bookmark") {
    const url = prompt("Enter URL") || "#";
    const label = url.replace(/^https?:\/\//, "").split("/")[0];
    return `<strong class="block-title">BOOKMARK</strong>
            <a href="${url}" target="_blank">${label}</a>`;
  }

  if (type === "note") {
    return `<strong class="block-title" contenteditable="true">Note</strong>
            <p contenteditable="true">Write here…</p>`;
  }

  return "";
}

// ================================
// Drag / Snap / Folder Logic
// ================================
function enableDragging(block) {
  let offsetX = 0, offsetY = 0;

  block.addEventListener("mousedown", e => {
    if (e.target.isContentEditable) return;

    block.style.zIndex = topLayerIndex++;
    offsetX = e.clientX - block.offsetLeft;
    offsetY = e.clientY - block.offsetTop;

    function move(e) {
      block.style.left = e.clientX - offsetX + "px";
      block.style.top = e.clientY - offsetY + "px";
    }

    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      snapToBlocks(block);
      dropIntoFolder(block);
      saveLayout();
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

function snapToBlocks(active) {
  const SNAP = 40;
  document.querySelectorAll(".block").forEach(b => {
    if (b === active || b.parentElement.classList.contains("children")) return;
    const dx = b.offsetLeft - active.offsetLeft;
    const dy = b.offsetTop - active.offsetTop;
    if (Math.abs(dx) < SNAP && Math.abs(dy) < SNAP) {
      active.style.left = b.offsetLeft + 30 + "px";
      active.style.top = b.offsetTop + 30 + "px";
    }
  });
}

function dropIntoFolder(block) {
  document.querySelectorAll(".folder").forEach(folder => {
    if (folder === block) return;
    const f = folder.getBoundingClientRect();
    const b = block.getBoundingClientRect();
    if (b.left > f.left && b.right < f.right && b.top > f.top && b.bottom < f.bottom) {
      folder.querySelector(".children")?.appendChild(block);
      block.style.position = "relative";
      block.style.left = "0";
      block.style.top = "0";
    }
  });
}

document.addEventListener("dblclick", e => {
  const folder = e.target.closest(".folder");
  if (!folder) return;
  const children = folder.querySelector(".children");
  if (!children) return;
  children.style.display = children.style.display === "none" ? "block" : "none";
  saveLayout();
});

// ================================
// Bookmark Hover Preview
// ================================
const preview = document.createElement("div");
preview.className = "bookmark-preview";
document.body.appendChild(preview);

function enableBookmarkPreview(block) {
  const link = block.querySelector("a");
  if (!link) return;

  block.addEventListener("mouseenter", e => {
    preview.style.display = "block";
    preview.style.left = e.clientX + 20 + "px";
    preview.style.top = e.clientY + 20 + "px";
    preview.innerHTML = `<iframe src="${link.href}"></iframe>`;
  });

  block.addEventListener("mousemove", e => {
    preview.style.left = e.clientX + 20 + "px";
    preview.style.top = e.clientY + 20 + "px";
  });

  block.addEventListener("mouseleave", () => {
    preview.style.display = "none";
    preview.innerHTML = "";
  });
}

// ================================
// Auto Save + Init
// ================================
setInterval(saveLayout, 3000);

window.addEventListener("load", async () => {
  const token = handleCognitoToken();
  if (token) {
    const payload = decodeJWT(token);
    currentUsername =
      payload?.["cognito:username"] ||
      payload?.email ||
      payload?.sub;
    document.body.classList.add("logged-in");
  }

  const blocks = await loadLayout();
  restoreBlocks(blocks);
});
