const apiKey = '976800b7a483854c67d08857e3e74ca0';

let currentCity = "";

function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return;

  currentCity = city;
  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  fetchWeather(weatherURL);
  fetchForecast(forecastURL);
}

function useMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      fetchWeather(weatherURL);
      fetchForecast(forecastURL);
    }, () => alert("Unable to access your location."));
  } else alert("Geolocation not supported.");
}

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
      currentCity = data.name;
      document.body.className = data.weather[0].main.toLowerCase();

      const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
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
        <p>Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</p>
        <p>Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}</p>
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

async function fetchForecast(url) {
  const forecastEl = document.getElementById("forecast");
  const hourlyEl = document.getElementById("hourly");

  forecastEl.innerHTML = "<h3>3-Day Forecast</h3>";
  hourlyEl.innerHTML = "<h3>Next 6 Hours</h3>";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod === "200") {
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
        hourlyEl.innerHTML += `
          <div class="hour-item">
            <p>${hour}</p>
            <img src="${icon}" />
            <p>${item.main.temp}°C</p>
          </div>
        `;
      });
    }
  } catch {
    forecastEl.innerHTML = "<p>Error loading forecast.</p>";
  }
}

function updateMap(lat, lon) {
  document.getElementById("map-frame").src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.03},${lat - 0.03},${lon + 0.03},${lat + 0.03}&layer=mapnik&marker=${lat},${lon}`;
}

// ★ Save & Load Favorites ★
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

window.onload = () => {
  renderFavorites();
  useMyLocation();
};

document.getElementById("city").addEventListener("keyup", (e) => {
  if (e.key === "Enter") getWeather();
});
