const apiKey = "976800b7a483854c67d08857e3e74ca0";
const geoDbApiKey = "543bdf8ec9mshccb7ff8c4f200d8p1867bfjsnef0d616d633c";

let map, marker;
let useFahrenheit = JSON.parse(localStorage.getItem("useFahrenheit")) || false;
let debounceTimeout;
let selectedIndex = -1;

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

function debounceAutocomplete() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(autocompleteCity, 300);
}

async function autocompleteCity() {
  const input = document.getElementById("city");
  const list = document.getElementById("autocomplete-list");
  const query = input.value.trim();

  if (query.length < 2) {
    list.innerHTML = "";
    list.style.display = "none";
    return;
  }

  try {
    const res = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&namePrefix=${query}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": geoDbApiKey,
          "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
        },
      }
    );

    const data = await res.json();
    list.innerHTML = "";

    if (data.data.length === 0) {
      list.style.display = "none";
      return;
    }

    data.data.forEach((city) => {
      const li = document.createElement("li");
      li.textContent = `${city.city}, ${city.countryCode}`;
      li.onclick = () => {
        input.value = city.city;
        list.innerHTML = "";
        list.style.display = "none";
      };
      list.appendChild(li);
    });

    list.style.display = "block";
  } catch (err) {
    console.error("GeoDB Error:", err);
    list.innerHTML = "";
    list.style.display = "none";
  }
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
  const loader = document.getElementById("loader");
  forecastEl.innerHTML = `<h3>3-Day Forecast</h3><div id="forecast-items"></div>`;
  const container = document.getElementById("forecast-items");

  loader.style.display = "block";

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.style.display = "none";

    const items = data.list
      .filter((i) => {
        const hour = new Date(i.dt_txt).getHours();
        return hour >= 11 && hour <= 13; // closest to midday
      })
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
    loader.style.display = "none";
    forecastEl.innerHTML += "<p>Error loading forecast.</p>";
  }
}

async function fetchHourlyForecast(url) {
  const hourlyEl = document.getElementById("hourly-forecast");
  const loader = document.getElementById("loader");
  hourlyEl.innerHTML = "";
  loader.style.display = "block";

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.style.display = "none";
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
    loader.style.display = "none";
    hourlyEl.innerHTML = "<p>Error loading hourly forecast.</p>";
  }
}

function updateBackground() {
  // Background no longer changes dynamically.
}

function updateMap(lat, lon) {
  const unit = useFahrenheit ? "imperial" : "metric";

  if (!map) {
    map = L.map("map").setView([lat, lon], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    marker = L.marker([lat, lon]).addTo(map);

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      const wUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=${unit}&appid=${apiKey}`;
      const fUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=${unit}&appid=${apiKey}`;
      fetchWeather(wUrl);
      fetchForecast(fUrl);
      fetchHourlyForecast(fUrl);
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
    cities.unshift(city);
    if (cities.length > 20) cities = cities.slice(0, 20);
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

  isPinned ? list.prepend(li) : list.appendChild(li);
}

function exportPDF() {
  alert("To enable PDF export, integrate jsPDF or html2pdf.js.");
}

function shareWeather() {
  const city = document.getElementById("city").value.trim();
  const url = `https://www.google.com/search?q=weather+${encodeURIComponent(
    city
  )}`;

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Weather link copied to clipboard!");
      })
      .catch(() => {
        fallbackCopy(url);
      });
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    alert("Weather link copied to clipboard!");
  } catch {
    alert("Failed to copy link.");
  }
  document.body.removeChild(textarea);
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

window.onload = () => {
  document.getElementById("unit-toggle").checked = useFahrenheit;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const unit = useFahrenheit ? "imperial" : "metric";
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`;
        fetchWeather(currentUrl);
        fetchForecast(forecastUrl);
        fetchHourlyForecast(forecastUrl);
        updateMap(latitude, longitude);
      },
      (err) => {
        console.error("Geolocation error:", err);
        document.getElementById("city").value = "New York";
        getWeather();
      }
    );
  }

  initSwipeGesture();
  loadSavedCities();
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("✅ Service Worker Registered"))
      .catch((err) => console.log("❌ Service Worker Error:", err));
  });
}

function handleCityKeydown(e) {
  const items = document.querySelectorAll("#autocomplete-list li");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % items.length;
  } else if (e.key === "ArrowUp") {
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
  } else if (e.key === "Enter") {
    if (selectedIndex > -1) {
      items[selectedIndex].click();
      selectedIndex = -1;
    }
    return;
  } else {
    selectedIndex = -1;
    return;
  }

  items.forEach((item, index) =>
    item.classList.toggle("active", index === selectedIndex)
  );
}
