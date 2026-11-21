const TOKYO = { latitude: 35.6762, longitude: 139.6503 };

function weatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌥️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 99) return "⛈️";
  return "🌤️";
}

export function initWeather() {
  const card = document.getElementById("weather-card");
  const icon = document.getElementById("current-weather-icon");
  const temperature = document.getElementById("current-temperature");
  const timeline = document.getElementById("weather-timeline-points");
  const updated = document.getElementById("weather-updated");
  const error = document.getElementById("weather-error");
  const refreshButton = document.getElementById("weather-refresh");

  async function refresh() {
    card.setAttribute("aria-busy", "true");
    refreshButton.disabled = true;
    error.hidden = true;

    const params = new URLSearchParams({
      latitude: TOKYO.latitude,
      longitude: TOKYO.longitude,
      current: "temperature_2m,weather_code",
      hourly: "temperature_2m,weather_code",
      timezone: "Asia/Tokyo",
      forecast_days: "1"
    });

    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      icon.textContent = weatherIcon(data.current.weather_code);
      temperature.textContent = `${Math.round(data.current.temperature_2m)}°`;

      const targetHours = [7, 15, 19];
      const timeLabels = ["7:00", "15:00", "19:00"];
      timeline.replaceChildren(...targetHours.map((hour, index) => {
        const now = new Date();
        const datePrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const hourIndex = data.hourly.time.findIndex(time => time === `${datePrefix}T${String(hour).padStart(2, "0")}:00`);
        const code = hourIndex >= 0 ? data.hourly.weather_code[hourIndex] : data.current.weather_code;
        const temp = hourIndex >= 0 ? data.hourly.temperature_2m[hourIndex] : data.current.temperature_2m;
        const item = document.createElement("li");
        item.className = "timeline-point";
        item.innerHTML =
          `<span class="timeline-dot" aria-hidden="true"></span>` +
          `<span class="timeline-period">${timeLabels[index]}</span>` +
          `<span class="timeline-reading">` +
          `<span class="timeline-icon" aria-hidden="true">${weatherIcon(code)}</span>` +
          `<span class="timeline-temperature">${Math.round(temp)}°</span>` +
          `</span>`;
        return item;
      }));

      updated.textContent = `更新 ${new Intl.DateTimeFormat("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).format(new Date())}`;
    } catch (failure) {
      console.error("Weather update failed:", failure);
      icon.textContent = "!";
      temperature.textContent = "--°";
      timeline.replaceChildren();
      updated.textContent = "取得不能";
      error.hidden = false;
    } finally {
      card.removeAttribute("aria-busy");
      refreshButton.disabled = false;
    }
  }

  refreshButton.addEventListener("click", refresh);
  refresh();
  window.setInterval(refresh, 30 * 60 * 1000);
}
