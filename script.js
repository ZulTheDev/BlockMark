// =====================================
// LumaBlocks — Private Key Mode 🔐
// =====================================

// ---------- Canvas ----------
const map = document.getElementById("map");
let topZ = 1;

// ---------- App State ----------
let userKey = null;
let cryptoKey = null;

// ---------- IndexedDB ----------
const DB_NAME = "LumaBlocksSecure";
const STORE = "encryptedLayouts";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- Key Utilities ----------
function generatePrivateKey() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

async function deriveCryptoKey(privateKey) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(privateKey),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

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
}

// ---------- Encrypt / Decrypt ----------
async function encryptData(data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoded
  );

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(cipher)))
  };
}

async function decryptData(payload) {
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));

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
}

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
}

// ---------- Save / Load ----------
async function saveLayout() {
  if (!cryptoKey) return;

  const blocks = [...map.querySelectorAll(":scope > .block")]
    .map(serializeBlock);

  const encrypted = await encryptData(blocks);
  const db = await openDB();

  db.transaction(STORE, "readwrite")
    .objectStore(STORE)
    .put({ id: "layout", payload: encrypted });
}

async function loadLayout() {
  const db = await openDB();
  return new Promise(resolve => {
    const req = db.transaction(STORE)
      .objectStore(STORE)
      .get("layout");

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

// ---------- Key Actions ----------
async function setupWithKey(key) {
  userKey = key;
  cryptoKey = await deriveCryptoKey(key);
  const data = await loadLayout();
  restoreBlocks(data);
}

// ---------- UI Helpers ----------
function generateKeyFlow() {generateKeyFlow()
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
}

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
  }

  if (type === "bookmark") {
    const url = prompt("Enter URL");
    if (!url) return;
    block.innerHTML =
      `<strong>Bookmark</strong>
       <a href="${url}" target="_blank">${url}</a>`;
    enablePreview(block);
  }

  if (type === "note") {
    block.innerHTML =
      `<strong contenteditable="true">Note</strong>
       <p contenteditable="true">Write here…</p>`;
  }

  enableDragging(block);
  map.appendChild(block);
  saveLayout();
}

// ---------- Drag / Snap ----------
function enableDragging(el) {
  let ox, oy;

  el.addEventListener("mousedown", e => {
    if (e.target.isContentEditable) return;
    ox = e.clientX - el.offsetLeft;
    oy = e.clientY - el.offsetTop;
    el.style.zIndex = topZ++;

    function move(e) {
      el.style.left = e.clientX - ox + "px";
      el.style.top = e.clientY - oy + "px";
    }

    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      saveLayout();
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

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

// ---------- Auto Save ----------
setInterval(saveLayout, 4000);
