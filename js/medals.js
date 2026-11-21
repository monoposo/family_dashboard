const sampleMedals = [
  { name: "ゲームセンターA", place: "駅前店", deadline: "2026-11-23" },
  { name: "ゲームセンターB", place: "ショッピングモール店", deadline: "2026-12-11" },
  { name: "ゲームセンターC", place: "南口店", deadline: "2026-12-24" },
  { name: "ゲームセンターD", place: "大型商業施設店", deadline: "2027-01-07" }
];

export function initMedals() {
  const list = document.getElementById("medal-list");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dateFormatter = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" });

  const medals = [...sampleMedals].sort((a, b) => a.deadline.localeCompare(b.deadline));
  list.replaceChildren(...medals.map(medal => {
    const deadline = new Date(`${medal.deadline}T00:00:00`);
    const daysLeft = Math.ceil((deadline - now) / 86400000);
    const item = document.createElement("li");
    item.className = `medal-row${daysLeft < 0 ? " expired" : ""}`;
    const label = daysLeft < 0 ? `${Math.abs(daysLeft)}日超過` : `あと${daysLeft}日`;
    item.innerHTML =
      `<div><p class="store-name">${medal.name}</p>` +
      `<p class="store-place">${medal.place}</p></div>` +
      `<div class="deadline"><p class="days-left">${label}</p>` +
      `<p class="deadline-date">期限 ${dateFormatter.format(deadline)}</p></div>`;
    return item;
  }));
  document.getElementById("medal-error").hidden = true;
}
