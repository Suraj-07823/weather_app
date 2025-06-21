const apiKey = '976800b7a483854c67d08857e3e74ca0';
let currentCity = "";
let lastWeatherData = null;

function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return;
  currentCity = city;
  fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
  fetchForecast(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
}

function useMyLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeatherCoords(pos.coords.latitude, pos.coords.longitude);
    fetchForecastCoords(pos.coords.latitude, pos.coords.longitude);
  });
}
function fetchWeatherCoords(lat, lon) {
  fetchWeather(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
}
function fetchForecastCoords(lat, lon) {
  fetchForecast(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
}

async function fetchWeather(url) {
  const info = document.getElementById("weather-info"),
        extra = document.getElementById("extra-details"),
        loader = document.getElementById("loader"),
        lastUpdated = document.getElementById("last-updated");
  loader.style.display = "block";
  info.innerHTML = "";
  extra.innerHTML = "";
  try {
    const res = await fetch(url),
          data = await res.json();
    loader.style.display = "none";
    if (data.cod === 200) {
      lastWeatherData = data;
      const isDay = Date.now() >= data.sys.sunrise*1000 && Date.now() < data.sys.sunset*1000;
      updateBackground(data.weather[0].main.toLowerCase(), isDay);
      currentCity = data.name;
      info.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        ${getAnimatedIcon(data.weather[0].main.toLowerCase())}
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
    } else info.innerHTML = `<p>${data.message}</p>`;
  } catch {
    loader.style.display = "none";
    info.innerHTML = "<p>Error fetching weather data.</p>";
  }
}

async function fetchForecast(url) {
  const forecastEl = document.getElementById("forecast"),
        hourlyEl = document.getElementById("hourly");
  forecastEl.innerHTML = "<h3>3-Day Forecast</h3>";
  hourlyEl.innerHTML = "<h3>Next 6 Hours Forecast</h3>";
  try {
    const res = await fetch(url),
          data = await res.json(),
          daily = data.list.filter(i => i.dt_txt.includes("12:00:00")).slice(0,3),
          hourly = data.list.slice(0,6);
    daily.forEach(i => {
      forecastEl.innerHTML += `
        <div class="forecast-item">
          <p>${new Date(i.dt_txt).toLocaleDateString()}</p>
          <img src="https://openweathermap.org/img/wn/${i.weather[0].icon}.png" />
          <p>${i.main.temp}°C</p>
        </div>`;
    });
    hourly.forEach(i => {
      const hour = new Date(i.dt_txt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      const card = document.createElement("div");
      card.className = "hour-item";
      card.title = `${hour} - ${i.weather[0].description}`;
      card.innerHTML = `
        <p>${hour}</p>
        <img src="https://openweathermap.org/img/wn/${i.weather[0].icon}.png" />
        <p>${i.main.temp}°C</p>`;
      hourlyEl.appendChild(card);
    });
  } catch {
    forecastEl.innerHTML = "<p>Error loading forecast.</p>";
  }
}

function updateMap(lat, lon) {
  document.getElementById("map-frame").src = 
    `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.03},${lat-0.03},${lon+0.03},${lat+0.03}&layer=mapnik&marker=${lat},${lon}`;
}

function saveToFavorites() {
  if (!currentCity) return;
  const favs = JSON.parse(localStorage.getItem("favorites")||"[]");
  if (!favs.includes(currentCity)) {
    favs.push(currentCity);
    localStorage.setItem("favorites", JSON.stringify(favs));
    renderFavorites();
  }
}
function renderFavorites() {
  const favs = JSON.parse(localStorage.getItem("favorites")||"[]"),
        ctr = document.getElementById("favorites");
  ctr.innerHTML = "";
  favs.forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.onclick = () => { document.getElementById("city").value = city; getWeather(); };
    ctr.appendChild(btn);
  });
}

function exportPDF() {
  if (!lastWeatherData) return alert("No data to export.");
  const doc = new window.jspdf.jsPDF();
  doc.text(`Weather Report - ${lastWeatherData.name}`,20,20);
  doc.text(`Temp: ${lastWeatherData.main.temp}°C`,20,30);
  doc.text(`Condition: ${lastWeatherData.weather[0].description}`,20,40);
  doc.text(`Humidity: ${lastWeatherData.main.humidity}%`,20,50);
  doc.save(`${lastWeatherData.name}_weather.pdf`);
}

function shareLink() {
  if (!currentCity) return alert("Get weather first.");
  const url = `${location.origin}${location.pathname}?city=${encodeURIComponent(currentCity)}`;
  navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
}

let map;
function openMapModal() {
  const modal = document.getElementById("mapModal");
  modal.style.display = "flex";
  if (!map) {
    map = L.map('full-map').setView([20.59,78.96],5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(map);
    let marker;
    map.on('click', e => {
      if (marker) map.removeLayer(marker);
      marker = L.marker(e.latlng).addTo(map);
      fetchWeatherCoords(e.latlng.lat,e.latlng.lng);
      fetchForecastCoords(e.latlng.lat,e.latlng.lng);
      closeMapModal();
    });
  }
}
function closeMapModal() {
  document.getElementById("mapModal").style.display = "none";
}

function getAnimatedIcon(condition) {
  const icons = {
    clear:`<lord-icon src="https://cdn.lordicon.com/rbuxsqbr.json" trigger="loop" style="width:100px;height:100px"></lord-icon>`,
    clouds:`<lord-icon src="https://cdn.lordicon.com/etqbfrgp.json" trigger="loop" style="width:100px;height:100px"></lord-icon>`,
    rain:`<lord-icon src="https://cdn.lordicon.com/wxnxiano.json" trigger="loop" style="width:100px;height:100px"></lord-icon>`,
    snow:`<lord-icon src="https://cdn.lordicon.com/cnpvyndp.json" trigger="loop" style="width:100px;height:100px"></lord-icon>`,
    thunderstorm:`<lord-icon src="https://cdn.lordicon.com/slkvcfos.json" trigger="loop" style="width:100px;height:100px"></lord-icon>`,
    default:`<lord-icon src="https://cdn.lordicon.com/gqzfzudq.json" trigger="loop" style="width:100px;height:100px"></lord-icon>`
  };
  return icons[condition] || icons.default;
}

function updateBackground(condition, isDay) {
  const bg = document.getElementById("weather-bg");
  bg.className = "weather-bg";
  if (condition === "clear") bg.classList.add(isDay?"clear-day-bg":"clear-night-bg");
  else if (condition === "rain") bg.classList.add("rain-bg");
  else if (condition === "snow") bg.classList.add("snow-bg");
  else if (condition === "thunderstorm") bg.classList.add("thunderstorm-bg");
  else bg.classList.add("clouds-bg");
}

window.onload = () => {
  renderFavorites();
  const params = new URLSearchParams(window.location.search).get('city');
  if (params) {
    document.getElementById("city").value = params;
    getWeather();
  } else {
    useMyLocation();
  }
};

document.getElementById("city").addEventListener("keyup", e => {
  if (e.key === "Enter") getWeather();
});
