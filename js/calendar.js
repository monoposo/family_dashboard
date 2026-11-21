const calendarTokenKey = "family-dashboard-google-calendar-token";
const calendarTokenExpiresKey = "family-dashboard-google-calendar-token-expires";
const oauthClientId = "358957661900-iq92nrmt70m69kdctsc60uv69vo0k3a4.apps.googleusercontent.com";
let isCalendarLoading = false;
let tokenClient = null;

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value);
  return element.innerHTML;
}

function renderEvents(elementId, events) {
  const list = document.getElementById(elementId);
  list.replaceChildren();
  if (!events.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "予定はありません";
    list.append(empty);
    return;
  }

  events.forEach(event => {
    const item = document.createElement("li");
    item.className = "event";
    item.innerHTML =
      `<time class="event-time">${escapeHtml(event.time)}</time>` +
      `<div><p class="event-title">${escapeHtml(event.title)}</p>` +
      `<p class="event-detail">${escapeHtml(event.detail)}</p></div>`;
    list.append(item);
  });
}

function setStatus(message) {
  document.getElementById("calendar-auth-status").textContent = message;
}

function setButtonLoading(loading) {
  const button = document.getElementById("calendar-auth-button");
  button.disabled = loading;
  isCalendarLoading = loading;
}

function showCalendarError(message) {
  const error = document.getElementById("calendar-error");
  error.textContent = message;
  error.hidden = false;
  renderEvents("today-events", []);
  renderEvents("tomorrow-events", []);
}

function getStoredToken() {
  const token = sessionStorage.getItem(calendarTokenKey);
  const expires = Number(sessionStorage.getItem(calendarTokenExpiresKey) || 0);
  if (!token || !expires || Date.now() >= expires) {
    clearStoredToken();
    return null;
  }
  return token;
}

function clearStoredToken() {
  sessionStorage.removeItem(calendarTokenKey);
  sessionStorage.removeItem(calendarTokenExpiresKey);
}

function storeToken(token) {
  if (!token) return;
  sessionStorage.setItem(calendarTokenKey, token);
  sessionStorage.setItem(calendarTokenExpiresKey, String(Date.now() + 50 * 60 * 1000));
}

function toLocalDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getEventTime(event) {
  if (event.start?.date) return "終日";
  if (!event.start?.dateTime) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(event.start.dateTime));
}

function getEventDetail(event) {
  if (event.location?.trim()) return event.location.trim();
  if (event.start?.date) return "終日予定";
  return "予定";
}

async function fetchGoogleCalendar() {
  const token = getStoredToken();
  if (!token) return;

  setButtonLoading(true);
  const now = new Date();
  const today = toLocalDate(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  try {
    const params = new URLSearchParams({
      timeMin: today.toISOString(),
      timeMax: dayAfterTomorrow.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50"
    });
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 401) {
      clearStoredToken();
      showCalendarError("カレンダーへの接続が期限切れです。再接続してください。");
      setStatus("再接続が必要です");
      updateButton();
      return;
    }
    if (!response.ok) throw new Error(`Calendar API returned ${response.status}`);

    const data = await response.json();
    const todayEvents = [];
    const tomorrowEvents = [];
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const tomorrowKey = `${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`;

    for (const event of data.items || []) {
      if (event.status === "cancelled") continue;
      const startValue = event.start?.dateTime || event.start?.date;
      if (!startValue) continue;

      let eventDate;
      if (event.start.date) {
        const [year, month, day] = event.start.date.split("-").map(Number);
        eventDate = new Date(year, month - 1, day);
      } else {
        eventDate = new Date(startValue);
      }
      const eventKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      const normalized = {
        time: getEventTime(event),
        title: event.summary?.trim() || "予定",
        detail: getEventDetail(event)
      };

      if (eventKey === todayKey) todayEvents.push(normalized);
      if (eventKey === tomorrowKey) tomorrowEvents.push(normalized);
    }

    renderEvents("today-events", todayEvents);
    renderEvents("tomorrow-events", tomorrowEvents);
    document.getElementById("calendar-error").hidden = true;
    setStatus("Googleカレンダー連携中");
  } catch (error) {
    console.error("Google Calendar update failed:", error);
    showCalendarError("予定を取得できません。");
  } finally {
    setButtonLoading(false);
  }
}

function updateButton() {
  if (isCalendarLoading) return;
  const button = document.getElementById("calendar-auth-button");
  if (getStoredToken()) {
    button.textContent = "接続を解除";
  } else {
    button.textContent = "カレンダーを接続";
  }
}

export function initCalendar() {
  const button = document.getElementById("calendar-auth-button");

  button.addEventListener("click", async () => {
    setButtonLoading(true);
    try {
      if (getStoredToken()) {
        const token = getStoredToken();
        clearStoredToken();
        if (window.google?.accounts?.oauth2 && token) {
          window.google.accounts.oauth2.revoke(token, () => {});
        }
        setStatus("カレンダー未接続");
        renderEvents("today-events", []);
        renderEvents("tomorrow-events", []);
        document.getElementById("calendar-error").hidden = true;
        updateButton();
      } else {
        tokenClient?.requestAccessToken({ prompt: "consent" });
      }
    } catch (error) {
      console.error("Google Calendar authentication failed:", error);
      showCalendarError("カレンダーへの接続に失敗しました。");
    } finally {
      setButtonLoading(false);
    }
  });

  const initializeTokenClient = () => {
    if (!window.google?.accounts?.oauth2) {
      setTimeout(initializeTokenClient, 100);
      return;
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: oauthClientId,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: response => {
        if (response.error) {
          console.error("Google Calendar authorization failed:", response);
          showCalendarError("カレンダーへの接続に失敗しました。");
          setStatus("カレンダー未接続");
          setButtonLoading(false);
          return;
        }
        storeToken(response.access_token);
        setStatus("Googleカレンダー連携中");
        setButtonLoading(false);
        updateButton();
        fetchGoogleCalendar();
      }
    });

    if (getStoredToken()) {
      setStatus("Googleカレンダー連携中");
      updateButton();
      fetchGoogleCalendar();
    } else {
      setStatus("カレンダー未接続");
      updateButton();
    }
  };

  initializeTokenClient();

  document.getElementById("calendar-error").hidden = true;
  if (!getStoredToken()) {
    renderEvents("today-events", []);
    renderEvents("tomorrow-events", []);
  }
}
