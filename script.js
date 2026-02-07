<<<<<<< HEAD
// =====================================
// LumaBlocks — Private Key Mode 🔐
// =====================================
=======
// ================================
// LumaBlocks — All-in-One Script
// ================================

// ---------- Global State ----------
const map = document.getElementById("map");
let topLayerIndex = 1;
let currentUsername = null;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
// ---------- Canvas ----------
const map = document.getElementById("map");
let topZ = 1;
=======
// ================================
// Cognito Configuration (EDIT THESE)
// ================================
const COGNITO = {
  domain: "https://us-east-1de69dgxpy.auth.us-east-1.amazoncognito.com",
  clientId: "5mqehvmde8ta3ao1pfvq2b6eck",
  redirectUri: window.location.origin + window.location.pathname,
};
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
// ---------- App State ----------
let userKey = null;
let cryptoKey = null;
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
// ---------- IndexedDB ----------
const DB_NAME = "LumaBlocksSecure";
const STORE = "encryptedLayouts";
=======
function signup() {
  window.location.href =
    `${COGNITO.domain}/signup?` +
    `client_id=${COGNITO.clientId}` +
    `&response_type=token` +
    `&scope=openid+email+profile` +
    `&redirect_uri=${encodeURIComponent(COGNITO.redirectUri)}`;
}
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
// ---------- Key Utilities ----------
function generatePrivateKey() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}
=======
function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
async function deriveCryptoKey(privateKey) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(privateKey),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
=======
// ================================
// IndexedDB Setup
// ================================
const DB_NAME = "LumaBlocksDB";
const STORE_NAME = "layouts";
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("LumaBlocksSalt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
// ---------- Encrypt / Decrypt ----------
async function encryptData(data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoded
  );
=======
  const children = block.querySelector(".children");
  if (children) {
    children.querySelectorAll(":scope > .block").forEach(child => {
      data.children.push(serializeBlock(child));
    });
  }
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(cipher)))
  };
=======
  return data;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
async function decryptData(payload) {
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));
=======
function serializeLayout() {
  return [...document.querySelectorAll("#map > .block")].map(serializeBlock);
}
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data
  );

  return JSON.parse(new TextDecoder().decode(plain));
}

// ---------- Layout Serialize ----------
function serializeBlock(block) {
  return {
    type: [...block.classList].find(c => c !== "block"),
    left: block.style.left,
    top: block.style.top,
    z: block.style.zIndex,
    html: block.innerHTML,
    children: [...block.querySelectorAll(":scope > .children > .block")]
      .map(serializeBlock)
  };
=======
async function saveLayout() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({
    id: getLayoutKey(),
    data: serializeLayout()
  });
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
function restoreBlocks(blocks, parent = map) {
  blocks.forEach(b => {
    const el = document.createElement("div");
    el.className = `block ${b.type}`;
    el.style.position = "absolute";
    el.style.left = b.left;
    el.style.top = b.top;
    el.style.zIndex = b.z;
    el.innerHTML = b.html;

    enableDragging(el);
    if (b.type === "bookmark") enablePreview(el);

    parent.appendChild(el);

    const children = el.querySelector(".children");
    if (children) restoreBlocks(b.children, children);
  });
=======
async function loadLayout() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  return new Promise(resolve => {
    const req = tx.objectStore(STORE_NAME).get(getLayoutKey());
    req.onsuccess = () => resolve(req.result?.data || []);
    req.onerror = () => resolve([]);
  });
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
// ---------- Save / Load ----------
async function saveLayout() {
  if (!cryptoKey) return;
=======
function restoreBlocks(blocks, parent = map) {
  blocks.forEach(data => {
    const block = document.createElement("div");
    block.className = `block ${data.type}`;
    block.style.position = "absolute";
    block.style.left = data.left;
    block.style.top = data.top;
    block.style.zIndex = data.zIndex;
    block.innerHTML = data.html;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  const blocks = [...map.querySelectorAll(":scope > .block")]
    .map(serializeBlock);
=======
    enableDragging(block);
    if (data.type === "bookmark") enableBookmarkPreview(block);
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  const encrypted = await encryptData(blocks);
  const db = await openDB();
=======
    parent.appendChild(block);
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  db.transaction(STORE, "readwrite")
    .objectStore(STORE)
    .put({ id: "layout", payload: encrypted });
}
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
async function loadLayout() {
  const db = await openDB();
  return new Promise(resolve => {
    const req = db.transaction(STORE)
      .objectStore(STORE)
      .get("layout");
=======
  const block = document.createElement("div");
  block.className = `block ${type}`;
  block.style.left = "120px";
  block.style.top = "120px";
  block.style.zIndex = topLayerIndex++;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
    req.onsuccess = async () => {
      if (!req.result) return resolve([]);
      try {
        const data = await decryptData(req.result.payload);
        resolve(data);
      } catch {
        alert("❌ Invalid private key");
        resolve([]);
      }
    };
  });
}
=======
  block.innerHTML = buildBlockContent(type);
  enableDragging(block);
  if (type === "bookmark") enableBookmarkPreview(block);
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
// ---------- Key Actions ----------
async function setupWithKey(key) {
  userKey = key;
  cryptoKey = await deriveCryptoKey(key);
  const data = await loadLayout();
  restoreBlocks(data);
}

// ---------- UI Helpers ----------
function generateKeyFlow() {
  const key = generatePrivateKey();
  alert(
    "SAVE THIS PRIVATE KEY ⚠️\n\n" +
    key +
    "\n\nYou need it to restore your layout."
  );
  setupWithKey(key);
}

function restoreWithKey() {
  const key = prompt("Paste your private key:");
  if (!key) return;
  setupWithKey(key);
=======
  map.appendChild(block);
  saveLayout();
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
// ---------- Blocks ----------
function addBlock(type) {
  if (!cryptoKey) {
    alert("Generate or restore with a private key first 🔐");
    return;
  }

  const block = document.createElement("div");
  block.className = `block ${type}`;
  block.style.position = "absolute";
  block.style.left = "120px";
  block.style.top = "120px";
  block.style.zIndex = topZ++;

  if (type === "folder") {
    block.innerHTML =
      `<strong>${prompt("Folder name") || "Folder"}</strong>
       <div class="children"></div>`;
=======
function buildBlockContent(type) {
  if (type === "folder") {
    const name = prompt("Folder name") || "Untitled Folder";
    return `<strong class="block-title">${name}</strong><div class="children"></div>`;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
  }

<<<<<<< HEAD
  if (type === "bookmark") {
    const url = prompt("Enter URL");
    if (!url) return;
    block.innerHTML =
      `<strong>Bookmark</strong>
       <a href="${url}" target="_blank">${url}</a>`;
    enablePreview(block);
=======
  if (type === "bookmark") {
    const url = prompt("Enter URL") || "#";
    const label = url.replace(/^https?:\/\//, "").split("/")[0];
    return `<strong class="block-title">BOOKMARK</strong>
            <a href="${url}" target="_blank">${label}</a>`;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
  }

<<<<<<< HEAD
  if (type === "note") {
    block.innerHTML =
      `<strong contenteditable="true">Note</strong>
       <p contenteditable="true">Write here…</p>`;
=======
  if (type === "note") {
    return `<strong class="block-title" contenteditable="true">Note</strong>
            <p contenteditable="true">Write here…</p>`;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
  }

<<<<<<< HEAD
  enableDragging(block);
  map.appendChild(block);
  saveLayout();
=======
  return "";
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
// ---------- Drag / Snap ----------
function enableDragging(el) {
  let ox, oy;
=======
// ================================
// Drag / Snap / Folder Logic
// ================================
function enableDragging(block) {
  let offsetX = 0, offsetY = 0;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  el.addEventListener("mousedown", e => {
    if (e.target.isContentEditable) return;
    ox = e.clientX - el.offsetLeft;
    oy = e.clientY - el.offsetTop;
    el.style.zIndex = topZ++;
=======
  block.addEventListener("mousedown", e => {
    if (e.target.isContentEditable) return;
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
    function move(e) {
      el.style.left = e.clientX - ox + "px";
      el.style.top = e.clientY - oy + "px";
=======
    block.style.zIndex = topLayerIndex++;
    offsetX = e.clientX - block.offsetLeft;
    offsetY = e.clientY - block.offsetTop;

    function move(e) {
      block.style.left = e.clientX - offsetX + "px";
      block.style.top = e.clientY - offsetY + "px";
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
    }

<<<<<<< HEAD
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      saveLayout();
=======
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      snapToBlocks(block);
      dropIntoFolder(block);
      saveLayout();
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

<<<<<<< HEAD
// ---------- Bookmark Preview ----------
const preview = document.createElement("div");
preview.className = "bookmark-preview";
document.body.appendChild(preview);

function enablePreview(block) {
  const link = block.querySelector("a");
  if (!link) return;

  block.addEventListener("mouseenter", () => {
    preview.style.display = "block";
    preview.innerHTML = `<iframe src="${link.href}"></iframe>`;
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
  });
<<<<<<< HEAD
=======
}
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  block.addEventListener("mousemove", e => {
    preview.style.left = e.clientX + 20 + "px";
    preview.style.top = e.clientY + 20 + "px";
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
  });
<<<<<<< HEAD
=======
}
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e

<<<<<<< HEAD
  block.addEventListener("mouseleave", () => {
    preview.style.display = "none";
    preview.innerHTML = "";
=======
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
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
  });
<<<<<<< HEAD
=======

  block.addEventListener("mousemove", e => {
    preview.style.left = e.clientX + 20 + "px";
    preview.style.top = e.clientY + 20 + "px";
  });

  block.addEventListener("mouseleave", () => {
    preview.style.display = "none";
    preview.innerHTML = "";
  });
>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e
}

<<<<<<< HEAD
// ---------- Auto Save ----------
setInterval(saveLayout, 4000);

=======
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

>>>>>>> 837c041f74e46e8770a1078a8ac6439fbce6890e