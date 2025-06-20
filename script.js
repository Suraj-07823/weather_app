const apiKey = '976800b7a483854c67d08857e3e74ca0';

function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    document.getElementById("weather-info").innerHTML = "<p>Please enter a city name!</p>";
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  fetchWeather(url);
  fetchForecast(forecastUrl);
}

async function fetchWeather(url) {
  const info = document.getElementById("weather-info");
  const extra = document.getElementById("extra-details");
  const loader = document.getElementById("loader");

  loader.style.display = "block";
  info.innerHTML = "";
  extra.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.style.display = "none";

    if (data.cod === 200) {
      const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      const condition = data.weather[0].main.toLowerCase();
      document.body.className = "";
      document.body.classList.add(condition);

      const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      info.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="${icon}" alt="Weather Icon" />
        <p class="temp">🌡️ ${data.main.temp}°C</p>
        <p>${data.weather[0].description}</p>
      `;

      extra.innerHTML = `
        <h3>Additional Details</h3>
        <p>🤒 Feels like: ${data.main.feels_like}°C</p>
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <p>🌬️ Wind: ${data.wind.speed} m/s</p>
        <p>🔽 Pressure: ${data.main.pressure} hPa</p>
        <p>🌅 Sunrise: ${sunrise}</p>
        <p>🌇 Sunset: ${sunset}</p>
        <p>📍 Location: ${data.name}, ${data.sys.country}</p>
      `;
    } else {
      info.innerHTML = `<p class="error">${data.message}</p>`;
    }
  } catch {
    loader.style.display = "none";
    info.innerHTML = "<p class='error'>Error fetching weather data.</p>";
  }
}

async function fetchForecast(url) {
  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod === "200") {
      let filtered = data.list.filter(item => item.dt_txt.includes("12:00:00"));
      forecastEl.innerHTML = `<h3>5-Day Forecast</h3>`;
      filtered.forEach(item => {
        const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
        const date = new Date(item.dt_txt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        forecastEl.innerHTML += `
          <div class="forecast-item">
            <p>${date}</p>
            <img src="${icon}" alt="" />
            <p>${item.main.temp}°C</p>
          </div>
        `;
      });
    } else {
      forecastEl.innerHTML = "<p>Could not fetch forecast data.</p>";
    }
  } catch {
    forecastEl.innerHTML = "<p>Error loading forecast.</p>";
  }
}

// Trigger getWeather on Enter key
document.getElementById("city").addEventListener("keyup", (e) => {
  if (e.key === "Enter") getWeather();
});

// Auto-fetch based on geolocation
window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      fetchWeather(url);
      fetchForecast(forecastUrl);
    });
  }
};
