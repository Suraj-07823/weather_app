const apiKey = '976800b7a483854c67d08857e3e74ca0';
let currentCity = "";
let lastWeatherData = null;

// Get weather by city
function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return;
  currentCity = city;

  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  fetchWeather(weatherURL);
  fetchForecast(forecastURL);
}

// Use geolocation
function useMyLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetchWeatherCoords(latitude, longitude);
    fetchForecastCoords(latitude, longitude);
  });
}

function fetchWeatherCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  fetchWeather(url);
}
function fetchForecastCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  fetchForecast(url);
}

// Fetch current weather
async function fetchWeather(url) {
  const info = document.getElementById("weather-info");
  const extra = document.getElementById("extra-details");
  const loader = document.getElementById("loader");
  const lastUpdated = document.getElementById("last-updated");

  loader.style.display = "block";
  info.innerHTML = "";
  extra.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.style.display = "none";

    if (data.cod === 200) {
      lastWeatherData = data;
      currentCity = data.name;

      const iconHTML = getAnimatedIcon(data.weather[0].main.toLowerCase());
      document.body.className = data.weather[0].main.toLowerCase();

      info.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        ${iconHTML}
        <p class="temp">🌡️ ${data.main.temp}°C</p>
        <p>${data.weather[0].description}</p>
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <p>🌬️ Wind: ${data.wind.speed} m/s</p>
      `;

      extra.innerHTML = `
        <h3>Details</h3>
        <p>Feels like: ${data.main.feels_like}°C</p>
        <p>Pressure: ${data.main.pressure} hPa</p>
      `;

      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
      updateMap(data.coord.lat, data.coord.lon);
    } else {
      info.innerHTML = `<p>${data.message}</p>`;
    }
  } catch {
    loader.style.display = "none";
    info.innerHTML = "<p>Error fetching weather data.</p>";
  }
}

// Fetch 3-day + hourly forecast
async function fetchForecast(url) {
  const forecastEl = document.getElementById("forecast");
  const hourlyEl = document.getElementById("hourly");
  forecastEl.innerHTML = "<h3>3-Day Forecast</h3>";
  hourlyEl.innerHTML = "<h3>Next 6 Hours Forecast</h3>";

  try {
    const res = await fetch(url);
    const data = await res.json();

    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 3);
    const hourly = data.list.slice(0, 6);

    daily.forEach(item => {
      const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
      const date = new Date(item.dt_txt).toLocaleDateString();
      forecastEl.innerHTML += `
        <div class="forecast-item">
          <p>${date}</p>
          <img src="${icon}" />
          <p>${item.main.temp}°C</p>
        </div>
      `;
    });

    hourly.forEach(item => {
      const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
      const hour = new Date(item.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const tooltip = `${hour} - ${item.weather[0].description}`;
      const hourCard = document.createElement("div");
      hourCard.className = "hour-item";
      hourCard.title = tooltip;
      hourCard.innerHTML = `
        <p>${hour}</p>
        <img src="${icon}" alt="icon" />
        <p>${item.main.temp}°C</p>
      `;
      hourlyEl.appendChild(hourCard);
    });
  } catch {
    forecastEl.innerHTML = "<p>Error loading forecast.</p>";
  }
}

// Map
function updateMap(lat, lon) {
  document.getElementById("map-frame").src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.03},${lat - 0.03},${lon + 0.03},${lat + 0.03}&layer=mapnik&marker=${lat},${lon}`;
}

// Favorites
function saveToFavorites() {
  if (!currentCity) return;
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!favs.includes(currentCity)) {
    favs.push(currentCity);
    localStorage.setItem("favorites", JSON.stringify(favs));
    renderFavorites();
  }
}

function renderFavorites() {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const container = document.getElementById("favorites");
  container.innerHTML = "";
  favs.forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.onclick = () => {
      document.getElementById("city").value = city;
      getWeather();
    };
    container.appendChild(btn);
  });
}

// Export as PDF
function exportPDF() {
  if (!lastWeatherData) return alert("No weather data to export.");
  const doc = new window.jspdf.jsPDF();
  doc.text(`Weather Report - ${lastWeatherData.name}`, 20, 20);
  doc.text(`Temp: ${lastWeatherData.main.temp}°C`, 20, 30);
  doc.text(`Condition: ${lastWeatherData.weather[0].description}`, 20, 40);
  doc.text(`Humidity: ${lastWeatherData.main.humidity}%`, 20, 50);
  doc.save(`${lastWeatherData.name}_weather.pdf`);
}

// Share link
function shareLink() {
  if (!currentCity) return alert("Get weather first.");
  const url = `${location.origin}${location.pathname}?city=${encodeURIComponent(currentCity)}`;
  navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
}

// Full map
let map;
function openMapModal() {
  const modal = document.getElementById("mapModal");
  modal.style.display = "flex";
  if (!map) {
    map = L.map('full-map').setView([20.59, 78.96], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    let marker;
    map.on('click', function (e) {
      if (marker) map.removeLayer(marker);
      marker = L.marker(e.latlng).addTo(map);
      fetchWeatherCoords(e.latlng.lat, e.latlng.lng);
      fetchForecastCoords(e.latlng.lat, e.latlng.lng);
      closeMapModal();
    });
  }
}
function closeMapModal() {
  document.getElementById("mapModal").style.display = "none";
}

// Utility to get animated icons
function getAnimatedIcon(condition) {
  switch (condition) {
    case "clear":
      return `<lord-icon src="https://cdn.lordicon.com/rbuxsqbr.json" trigger="loop" delay="1000" style="width:100px;height:100px"></lord-icon>`;
    case "clouds":
      return `<lord-icon src="https://cdn.lordicon.com/etqbfrgp.json" trigger="loop" delay="1000" style="width:100px;height:100px"></lord-icon>`;
    case "rain":
      return `<lord-icon src="https://cdn.lordicon.com/wxnxiano.json" trigger="loop" delay="1000" style="width:100px;height:100px"></lord-icon>`;
    case "snow":
      return `<lord-icon src="https://cdn.lordicon.com/cnpvyndp.json" trigger="loop" delay="1000" style="width:100px;height:100px"></lord-icon>`;
    case "thunderstorm":
      return `<lord-icon src="https://cdn.lordicon.com/slkvcfos.json" trigger="loop" delay="1000" style="width:100px;height:100px"></lord-icon>`;
    default:
      return `<lord-icon src="https://cdn.lordicon.com/gqzfzudq.json" trigger="loop" delay="1000" style="width:100px;height:100px"></lord-icon>`;
  }
}

// On load
window.onload = () => {
  renderFavorites();
  const urlParams = new URLSearchParams(window.location.search);
  const city = urlParams.get('city');
  if (city) {
    document.getElementById("city").value = city;
    getWeather();
  } else {
    useMyLocation();
  }
};

document.getElementById("city").addEventListener("keyup", (e) => {
  if (e.key === "Enter") getWeather();
});
