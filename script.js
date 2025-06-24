const apiKey = "976800b7a483854c67d08857e3e74ca0";
let map, marker;

function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Enter a city name!");

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  fetchWeather(currentUrl);
  fetchForecast(forecastUrl);
  fetchHourlyForecast(forecastUrl);
}

async function fetchWeather(url) {
  const info = document.getElementById("weather-info");
  const loader = document.getElementById("loader");
  loader.style.display = "block";
  info.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.style.display = "none";

    if (data.cod === 200) {
      const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      const condition = data.weather[0].main.toLowerCase();

      updateBackground(condition, data.dt, data.sys.sunrise, data.sys.sunset);

      info.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="${icon}" alt="Weather Icon" />
        <p class="temp">🌡️ ${data.main.temp}°C</p>
        <p>${data.weather[0].description}</p>
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <p>🌬️ Wind: ${data.wind.speed} m/s</p>
      `;

      updateMap(data.coord.lat, data.coord.lon);
      updateTime();
    } else {
      info.innerHTML = `<p>${data.message}</p>`;
    }
  } catch (error) {
    loader.style.display = "none";
    info.innerHTML = "<p>Error fetching data.</p>";
  }
}

async function fetchForecast(url) {
  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = `<h3>3-Day Forecast</h3><div id="forecast-items"></div>`;
  const container = document.getElementById("forecast-items");

  try {
    const res = await fetch(url);
    const data = await res.json();
    const items = data.list
      .filter((i) => i.dt_txt.includes("12:00:00"))
      .slice(0, 3);

    items.forEach((item) => {
      const date = new Date(item.dt_txt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

      container.innerHTML += `
        <div class="forecast-item">
          <p>${date}</p>
          <img src="${icon}" />
          <p>${item.main.temp}°C</p>
        </div>`;
    });
  } catch {
    forecastEl.innerHTML += "<p>Error loading forecast.</p>";
  }
}

async function fetchHourlyForecast(url) {
  const hourlyEl = document.getElementById("hourly-forecast");
  hourlyEl.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();
    const next6 = data.list.slice(0, 6);

    next6.forEach((item) => {
      const time = new Date(item.dt_txt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

      hourlyEl.innerHTML += `
        <div class="forecast-item">
          <p>${time}</p>
          <img src="${icon}" />
          <p>${item.main.temp}°C</p>
        </div>`;
    });
  } catch {
    hourlyEl.innerHTML = "<p>Error loading hourly forecast.</p>";
  }
}

function updateBackground(condition, dt, sunrise, sunset) {
  const bg = document.getElementById("weather-bg");
  bg.className = "weather-bg";

  const isNight = dt < sunrise || dt > sunset;
  if (isNight) {
    bg.classList.add("night");
  } else {
    const mapping = {
      clear: "clear",
      clouds: "clouds",
      rain: "rain",
      drizzle: "rain",
      thunderstorm: "thunderstorm",
      snow: "snow",
      mist: "clouds",
      haze: "clouds",
    };
    bg.classList.add(mapping[condition] || "clear");
  }
}

function updateMap(lat, lon) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    marker = L.marker([lat, lon]).addTo(map);

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      const wUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
      const fUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
      fetchWeather(wUrl);
      fetchForecast(fUrl);
    });
  } else {
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]);
  }
}

function updateTime() {
  document.getElementById(
    "last-updated"
  ).textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

function saveCity() {
  const city = document.getElementById("city").value.trim();
  if (!city) return;

  let savedCities = JSON.parse(localStorage.getItem("cities")) || [];

  if (!savedCities.includes(city)) {
    savedCities.push(city);
    localStorage.setItem("cities", JSON.stringify(savedCities));
    addCityToSidebar(city);
  }
}

function loadSavedCities() {
  const savedCities = JSON.parse(localStorage.getItem("cities")) || [];
  savedCities.forEach(addCityToSidebar);
}

function addCityToSidebar(city) {
  const list = document.getElementById("saved-list");
  const li = document.createElement("li");
  li.textContent = city;
  li.onclick = () => {
    document.getElementById("city").value = city;
    getWeather();
    toggleSidebar();
  };
  list.appendChild(li);
}


function exportPDF() {
  alert("To enable PDF export, integrate jsPDF or html2pdf.js.");
}

function shareWeather() {
  const city = document.getElementById("city").value.trim();
  const url = `https://www.google.com/search?q=weather+${encodeURIComponent(
    city
  )}`;
  navigator.clipboard.writeText(url);
  alert("Weather link copied to clipboard!");
}

// Sidebar animation and blur control
function disableWeatherBackground() {
  const bg = document.getElementById("weather-bg");
  bg.classList.add("dimmed", "no-transition");
}

function enableWeatherBackground() {
  const bg = document.getElementById("weather-bg");
  bg.classList.remove("dimmed", "no-transition");
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const main = document.getElementById("main-content");
  const overlay = document.getElementById("overlay");
  const isClosed = sidebar.classList.contains("collapsed");

  sidebar.classList.toggle("collapsed");
  main.classList.toggle("collapsed");
  overlay.classList.toggle("active", isClosed);

  const bg = document.getElementById("weather-bg");
  bg.classList.toggle("dimmed", isClosed);
  bg.classList.toggle("no-transition", isClosed);
}

// Mobile swipe gesture
function initSwipeGesture() {
  let startX = 0;

  document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  document.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    const sidebar = document.getElementById("sidebar");

    if (diff > 80 && sidebar.classList.contains("collapsed")) {
      toggleSidebar();
    }
    if (diff < -80 && !sidebar.classList.contains("collapsed")) {
      toggleSidebar();
    }
  });
}

// Geolocation + Initialization
window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      fetchWeather(currentUrl);
      fetchForecast(forecastUrl);
      fetchHourlyForecast(forecastUrl);
      updateMap(latitude, longitude);
    });
  }
  initSwipeGesture();
  loadSavedCities();

};

// Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("✅ Service Worker Registered"))
      .catch((err) => console.log("❌ Service Worker Error:", err));
  });
}
