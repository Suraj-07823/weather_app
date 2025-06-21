const apiKey = '976800b7a483854c67d08857e3e74ca0';
let currentCity = "";
let lastWeatherData = null;
let lastForecastData = null;

// Get weather by city name
function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return;
  currentCity = city;

  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  fetchWeather(weatherURL);
  fetchForecast(forecastURL);
}

// Get weather using geolocation
function useMyLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetchWeatherCoords(latitude, longitude);
    fetchForecastCoords(latitude, longitude);
  });
}

// Fetch weather by coordinates
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

      const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      document.body.className = data.weather[0].main.toLowerCase();

      info.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="${icon}" />
        <p class="temp">🌡️ ${data.main.temp}°C</p>
        <p>${data.weather[0].description}</p>
      `;
      extra.innerHTML = `
        <h3>Details</h3>
        <p>Feels like: ${data.main.feels_like}°C</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind: ${data.wind.speed} m/s</p>
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

// Fetch forecast data
async function fetchForecast(url) {
  const forecastEl = document.getElementById("forecast");
  const hourlyEl = document.getElementById("hourly");
  forecastEl.innerHTML = "<h3>3-Day Forecast</h3>";
  hourlyEl.innerHTML = "<h3>Next 6 Hours Forecast</h3>";

  try {
    const res = await fetch(url);
    const data = await res.json();

    lastForecastData = data;

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

// Update mini map
function updateMap(lat, lon) {
  document.getElementById("map-frame").src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.03},${lat - 0.03},${lon + 0.03},${lat + 0.03}&layer=mapnik&marker=${lat},${lon}`;
}

// Save city to favorites
function saveToFavorites() {
  if (!currentCity) return;
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!favs.includes(currentCity)) {
    favs.push(currentCity);
    localStorage.setItem("favorites", JSON.stringify(favs));
    renderFavorites();
  }
}

// Render favorite buttons
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

// Export weather as PDF
function exportPDF() {
  if (!lastWeatherData) {
    alert("No weather data available to export.");
    return;
  }

  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(18);
  doc.text("Weather Report", 20, 20);
  doc.setFontSize(12);
  doc.text(`City: ${lastWeatherData.name}, ${lastWeatherData.sys.country}`, 20, 30);
  doc.text(`Temperature: ${lastWeatherData.main.temp}°C`, 20, 40);
  doc.text(`Condition: ${lastWeatherData.weather[0].description}`, 20, 50);
  doc.text(`Feels like: ${lastWeatherData.main.feels_like}°C`, 20, 60);
  doc.text(`Humidity: ${lastWeatherData.main.humidity}%`, 20, 70);
  doc.text(`Wind: ${lastWeatherData.wind.speed} m/s`, 20, 80);
  doc.text(`Pressure: ${lastWeatherData.main.pressure} hPa`, 20, 90);
  doc.save(`${lastWeatherData.name}_weather.pdf`);
}

// Share link for current weather
function shareLink() {
  if (!currentCity) return alert("Please get weather for a city first.");
  const url = `${location.origin}${location.pathname}?city=${encodeURIComponent(currentCity)}`;

  if (navigator.share) {
    navigator.share({ title: `Weather for ${currentCity}`, url });
  } else {
    navigator.clipboard.writeText(url)
      .then(() => alert("Link copied to clipboard!"))
      .catch(() => alert("Could not copy link."));
  }
}

// Fullscreen map modal
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

// Load favorites and auto-load location
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

// Enter key triggers getWeather
document.getElementById("city").addEventListener("keyup", (e) => {
  if (e.key === "Enter") getWeather();
});
