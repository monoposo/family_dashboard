export function initClock() {
  const headerYearElement = document.getElementById("header-year");
  const headerFullDateElement = document.getElementById("header-full-date");
  const headerWeekdayElement = document.getElementById("header-weekday");
  const tomorrowScheduleHeading = document.getElementById("tomorrow-schedule-heading");
  const timeline = document.getElementById("weather-timeline");
  const nowDot = document.querySelector(".timeline-now-dot");
  const currentTimeElement = document.getElementById("current-time");

  const gregorianDateFormatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric" });
  const japaneseEraFormatter = new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
    era: "long",
    year: "numeric"
  });
  const monthDayWeekdayFormatter = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric"
  });
  const weekdayFormatter = new Intl.DateTimeFormat("ja-JP", { weekday: "long" });
  const tomorrowDateFormatter = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" });
  const tomorrowWeekdayFormatter = new Intl.DateTimeFormat("ja-JP", { weekday: "narrow" });
  const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  function updateClock() {
    const now = new Date();
    headerYearElement.textContent =
      `${gregorianDateFormatter.format(now)} ／ ${japaneseEraFormatter.format(now)}`;
    headerFullDateElement.textContent = monthDayWeekdayFormatter.format(now);

    const weekday = weekdayFormatter.format(now);
    headerWeekdayElement.textContent = weekday;
    headerWeekdayElement.classList.toggle("saturday", weekday === "土曜日");
    headerWeekdayElement.classList.toggle("sunday", weekday === "日曜日");

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrowScheduleHeading.textContent =
      `明日 ${tomorrowDateFormatter.format(tomorrow)}(${tomorrowWeekdayFormatter.format(tomorrow)})`;
    currentTimeElement.textContent = timeFormatter.format(now);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    nowDot.hidden = currentMinutes < 7 * 60 || currentMinutes > 19 * 60;
    let markerPosition;
    if (currentMinutes <= 7 * 60) {
      markerPosition = 100 / 6;
    } else if (currentMinutes <= 15 * 60) {
      markerPosition = 100 / 6 + ((currentMinutes - 7 * 60) / (8 * 60)) * (100 / 3);
    } else if (currentMinutes <= 19 * 60) {
      markerPosition = 50 + ((currentMinutes - 15 * 60) / (4 * 60)) * (100 / 3);
    } else {
      markerPosition = 100 * 5 / 6;
    }
    timeline.style.setProperty("--now-position", `${markerPosition}%`);
  }

  updateClock();
  window.setInterval(updateClock, 1000);
}
