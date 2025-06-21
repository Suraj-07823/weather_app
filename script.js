const apiKey = '976800b7a483854c67d08857e3e74ca0';
let map, marker;

function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    alert("Please enter a city name!");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  fetchWeather(url);
  fetchForecast(forecastUrl);
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

      if (map) {
        updateMap(data.coord.lat, data.coord.lon);
      }
      updateTime();
    } else {
      info.innerHTML = `<p>${data.message}</p>`;
    }
  } catch {
    loader.style.display = "none";
    info.innerHTML = "<p>Error fetching weather data.</p>";
  }
}

async function fetchForecast(url) {
  const forecastEl = document.getElementById("forecast");
  const hourlyEl = document.getElementById("hourly-forecast");
  forecastEl.innerHTML = `<h3>3-Day Forecast</h3>`;
  hourlyEl.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod === "200") {
      // 3-Day Forecast
      const daily = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 3);
      daily.forEach(item => {
        const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
        const date = new Date(item.dt_txt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
        forecastEl.innerHTML += `
          <div class="forecast-item">
            <p>${date}</p>
            <img src="${icon}" alt="" />
            <p>${item.main.temp}°C</p>
          </div>`;
      });

      // Next 6 Hours
      const nextHours = data.list.slice(0, 6);
      nextHours.forEach(hour => {
        const icon = `https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;
        const time = new Date(hour.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        hourlyEl.innerHTML += `
          <div class="hourly-card">
            <p>${time}</p>
            <img src="${icon}" />
            <p>${hour.main.temp.toFixed(1)}°C</p>
          </div>`;
      });
    } else {
      forecastEl.innerHTML += "<p>Could not fetch forecast data.</p>";
    }
  } catch {
    forecastEl.innerHTML += "<p>Error loading forecast.</p>";
  }
}

function updateBackground(condition, currentTime, sunrise, sunset) {
  document.body.className = '';
  if (currentTime >= sunset || currentTime <= sunrise) {
    document.body.classList.add('night');
  } else {
    document.body.classList.add(condition);
  }
}

function updateMap(lat, lon) {
  if (!map) {
    map = L.map('map').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([lat, lon]).addTo(map);

    map.on('click', function (e) {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
      fetchWeather(weatherUrl);
      fetchForecast(forecastUrl);
    });
  } else {
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]);
  }
}

function updateTime() {
  const now = new Date();
  document.getElementById("last-updated").textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

function saveCity() {
  const city = document.getElementById("city").value.trim();
  if (city) alert(`Saved ${city} to favorites!`);
}

function exportPDF() {
  alert("Exporting to PDF (requires PDF library like jsPDF to implement).");
}

function shareWeather() {
  const city = document.getElementById("city").value.trim();
  const url = `https://www.google.com/search?q=weather+${encodeURIComponent(city)}`;
  navigator.clipboard.writeText(url);
  alert("Weather link copied to clipboard!");
}

window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      fetchWeather(url);
      fetchForecast(forecastUrl);
      updateMap(latitude, longitude);
    });
  }
};
