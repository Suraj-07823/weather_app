const apiKey = "976800b7a483854c67d08857e3e74ca0";
let map, marker;
let useFahrenheit = JSON.parse(localStorage.getItem("useFahrenheit")) || false;

function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Enter a city name!");

  const unit = useFahrenheit ? "imperial" : "metric";
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`;

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
        <p class="temp">🌡️ ${data.main.temp}°${useFahrenheit ? "F" : "C"}</p>
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

function toggleUnit() {
  useFahrenheit = !useFahrenheit;
  localStorage.setItem("useFahrenheit", JSON.stringify(useFahrenheit));
  const city = document.getElementById("city").value.trim();
  if (city) getWeather();
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
          <p>${item.main.temp}°${useFahrenheit ? "F" : "C"}</p>
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
          <p>${item.main.temp}°${useFahrenheit ? "F" : "C"}</p>
        </div>`;
    });
  } catch {
    hourlyEl.innerHTML = "<p>Error loading hourly forecast.</p>";
  }
}

function updateBackground(condition, dt, sunrise, sunset) {
  const bg = document.getElementById("weather-bg");
  const hour = new Date(dt * 1000).getHours();
  const isNight = dt < sunrise || dt > sunset;

  // Reset all background classes
  bg.className = "weather-bg";

  // Determine time block
  let timeBlock = "day";
  if (hour >= 5 && hour < 7) timeBlock = "sunrise";
  else if (hour >= 18 && hour < 20) timeBlock = "sunset";
  else if (hour >= 20 || hour < 5) timeBlock = "night";

  // Apply time-based class
  bg.classList.add(timeBlock);

  // Map condition to background + animation
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

  const weatherClass = mapping[condition] || "clear";
  bg.classList.add(weatherClass);

  // Set animation visibility
  document.querySelectorAll(".weather-anim").forEach((el) => {
    el.style.display = "none";
  });
  const animMap = {
    clear: "sun",
    clouds: "clouds",
    rain: "rain",
    drizzle: "rain",
    thunderstorm: "lightning",
    snow: "snow",
  };
  const animClass = animMap[condition] || "sun";
  document
    .querySelector(".weather-anim." + animClass)
    ?.style.setProperty("display", "block");

  // TEXT COLOR UPDATE
  document.body.classList.remove(
    "day-text",
    "night-text",
    "sunrise-text",
    "sunset-text"
  );

  switch (timeBlock) {
    case "day":
      document.body.classList.add("day-text");
      break;
    case "night":
      document.body.classList.add("night-text");
      break;
    case "sunrise":
      document.body.classList.add("sunrise-text");
      break;
    case "sunset":
      document.body.classList.add("sunset-text");
      break;
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

  let cities = JSON.parse(localStorage.getItem("cities")) || [];

  if (!cities.includes(city)) {
    cities.unshift(city); // Newest at top
    localStorage.setItem("cities", JSON.stringify(cities));
    addCityToSidebar(city);
  }
}

function loadSavedCities() {
  const cities = JSON.parse(localStorage.getItem("cities")) || [];
  cities.forEach((city) => addCityToSidebar(city));
}

function removeCityFromStorage(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || [];
  cities = cities.filter((c) => c !== city);
  localStorage.setItem("cities", JSON.stringify(cities));
}

function addCityToSidebar(city, isPinned = false) {
  const list = document.getElementById("saved-list");

  // Avoid duplicates
  if ([...list.children].some((li) => li.dataset.city === city)) return;

  const li = document.createElement("li");
  li.dataset.city = city;

  const cityLabel = document.createElement("span");
  cityLabel.className = "city-name";
  cityLabel.innerHTML = `🌆 ${city}`;
  cityLabel.onclick = () => {
    document.getElementById("city").value = city;
    getWeather();
    toggleSidebar();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "❌";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    li.remove();
    removeCityFromStorage(city);
  };

  li.appendChild(cityLabel);
  li.appendChild(deleteBtn);

  if (isPinned) {
    list.prepend(li);
  } else {
    list.appendChild(li);
  }
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
  document.getElementById("unit-toggle").checked = useFahrenheit; // ← set toggle state

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const unit = useFahrenheit ? "imperial" : "metric"; // ← use saved unit
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`;
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
