import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

let unsubscribeMedals = null;

function setStatus(message) {
  document.getElementById("medal-auth-status").textContent = message;
}

function setLoading(loading) {
  const button = document.getElementById("medal-auth-button");
  button.disabled = loading;
}

function showError(message) {
  const error = document.getElementById("medal-error");
  error.textContent = message;
  error.hidden = false;
  document.getElementById("medal-list").replaceChildren();
}

function showAuthError(error) {
  console.error("Firebase authentication failed:", error);
  setStatus("ログインエラー");

  if (error.code === "auth/unauthorized-domain") {
    showError(`このURLはFirebase Authenticationの承認済みドメインにありません。Firebase ConsoleのAuthentication > Settings > Authorized domainsに「${window.location.hostname}」を追加してください。`);
  } else if (error.code === "auth/operation-not-allowed") {
    showError("Firebase ConsoleでGoogleログインプロバイダを有効にしてください。");
  } else {
    showError("ログインに失敗しました。");
  }
}

function renderMedals(snapshot) {
  const list = document.getElementById("medal-list");
  const error = document.getElementById("medal-error");
  error.hidden = true;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dateFormatter = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" });

  if (snapshot.empty) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "預けメダルはありません";
    list.replaceChildren(empty);
    return;
  }

  const items = snapshot.docs.map(documentSnapshot => {
    const medal = documentSnapshot.data();
    const deadline = medal.expireDate?.toDate();
    if (!deadline) return null;

    const deadlineStart = new Date(deadline);
    deadlineStart.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((deadlineStart - now) / 86400000);
    const item = document.createElement("li");
    item.className = `medal-row${daysLeft < 0 ? " expired" : ""}`;

    let deadlineLabel;
    if (daysLeft < 0) {
      deadlineLabel = `${Math.abs(daysLeft)}日超過`;
    } else if (daysLeft === 0) {
      deadlineLabel = "本日まで";
    } else {
      deadlineLabel = `あと${daysLeft}日`;
    }

    const detail = medal.memo?.trim()
      ? medal.memo.trim()
      : `${typeof medal.amount === "number" ? `${medal.amount}枚` : "期限管理"}`;

    item.innerHTML =
      `<div><p class="store-name">${escapeHtml(medal.title || "名称未設定")}</p>` +
      `<p class="store-place">${escapeHtml(detail)}</p></div>` +
      `<div class="deadline"><p class="days-left">${deadlineLabel}</p>` +
      `<p class="deadline-date">期限 ${dateFormatter.format(deadline)}</p></div>`;
    return item;
  }).filter(Boolean);

  list.replaceChildren(...items);
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value);
  return element.innerHTML;
}

function subscribeMedals() {
  if (unsubscribeMedals) {
    unsubscribeMedals();
  }

  const medalsQuery = query(
    collection(db, "medals"),
    orderBy("expireDate", "asc")
  );

  unsubscribeMedals = onSnapshot(
    medalsQuery,
    renderMedals,
    error => {
      console.error("Firestore medal update failed:", error);
      if (error.code === "permission-denied") {
        showError("このアカウントにはメダルデータの閲覧権限がありません。");
      } else if (error.code === "unavailable") {
        showError("通信に失敗しました。復旧後に自動で再取得します。");
      } else {
        showError("メダル期限を取得できません。");
      }
    }
  );
}

export function initMedals() {
  const button = document.getElementById("medal-auth-button");

  button.addEventListener("click", async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      showAuthError(error);
    } finally {
      setLoading(false);
    }
  });

  onAuthStateChanged(auth, user => {
    if (unsubscribeMedals) {
      unsubscribeMedals();
      unsubscribeMedals = null;
    }

    if (user) {
      setStatus("ログイン済み");
      button.textContent = "ログアウト";
      document.getElementById("medal-error").hidden = true;
      const loading = document.createElement("li");
      loading.className = "empty-state";
      loading.textContent = "メダルを読み込み中...";
      document.getElementById("medal-list").replaceChildren(loading);
      subscribeMedals();
    } else {
      setStatus("ログインが必要です");
      button.textContent = "Googleでログイン";
      document.getElementById("medal-list").replaceChildren();
      document.getElementById("medal-error").hidden = true;
    }
  });
}
