const sampleSchedule = {
  today: [
    { time: "09:00", title: "学校・登校", detail: "いつもの時間に出発" },
    { time: "15:30", title: "ピアノ教室", detail: "バッグを忘れずに" },
    { time: "18:00", title: "家族で夕食", detail: "みんなでカレーライス" }
  ],
  tomorrow: [
    { time: "10:00", title: "買い物", detail: "日用品の買い出し" },
    { time: "14:00", title: "公園でお散歩", detail: "天気がよければ" }
  ]
};

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
      `<time class="event-time">${event.time}</time>` +
      `<div><p class="event-title">${event.title}</p>` +
      `<p class="event-detail">${event.detail}</p></div>`;
    list.append(item);
  });
}

export function initCalendar() {
  renderEvents("today-events", sampleSchedule.today);
  renderEvents("tomorrow-events", sampleSchedule.tomorrow);

  // External calendar integration can replace this sample provider later.
  document.getElementById("calendar-error").hidden = true;
}
