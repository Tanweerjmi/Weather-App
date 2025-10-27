let isCelsius = true; // default

// Clock & Date
function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2,'0');
  const minutes = now.getMinutes().toString().padStart(2,'0');
  const seconds = now.getSeconds().toString().padStart(2,'0');
  document.getElementById('currentTime').textContent = `${hours}:${minutes}:${seconds}`;
  const options = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString(undefined, options);
}
setInterval(updateClock, 1000);
updateClock();

// Weather code mapping
function getWeatherDescriptionAndIcon(code){
  const mapping = {
    0: { desc:'Clear sky', icon:'☀️', type:'sunny' },
    1: { desc:'Mainly clear', icon:'🌤️', type:'sunny' },
    2: { desc:'Partly cloudy', icon:'⛅', type:'cloudy' },
    3: { desc:'Overcast', icon:'☁️', type:'cloudy' },
    45: { desc:'Fog', icon:'🌫️', type:'foggy' },
    48: { desc:'Depositing rime fog', icon:'🌫️', type:'foggy' },
    51: { desc:'Light drizzle', icon:'🌦️', type:'rainy' },
    53: { desc:'Moderate drizzle', icon:'🌦️', type:'rainy' },
    55: { desc:'Dense drizzle', icon:'🌧️', type:'rainy' },
    56: { desc:'Light freezing drizzle', icon:'🌧️❄️', type:'snowy' },
    57: { desc:'Dense freezing drizzle', icon:'🌧️❄️', type:'snowy' },
    61: { desc:'Showers of rain', icon:'🌧️', type:'rainy' },
    63: { desc:'Moderate showers of rain', icon:'🌧️', type:'rainy' },
    65: { desc:'Heavy showers of rain', icon:'⛈️', type:'thunder' },
    66: { desc:'Light freezing rain', icon:'🌧️❄️', type:'snowy' },
    67: { desc:'Heavy freezing rain', icon:'⛈️❄️', type:'snowy' },
    71: { desc:'Light snow fall', icon:'🌨️', type:'snowy' },
    73: { desc:'Moderate snow fall', icon:'🌨️', type:'snowy' },
    75: { desc:'Heavy snow fall', icon:'❄️🌨️', type:'snowy' },
    77: { desc:'Snow grains', icon:'❄️', type:'snowy' },
    80: { desc:'Showers of rain', icon:'🌧️', type:'rainy' },
    81: { desc:'Moderate showers of rain', icon:'🌧️', type:'rainy' },
    82: { desc:'Heavy showers of rain', icon:'⛈️', type:'thunder' },
    85: { desc:'Light snow fall', icon:'🌨️', type:'snowy' },
    86: { desc:'Heavy snow fall', icon:'❄️🌨️', type:'snowy' },
    95: { desc:'Thunderstorm', icon:'⛈️', type:'thunder' },
    96: { desc:'Thunderstorm with light hail', icon:'⛈️❄️', type:'thunder' },
    99: { desc:'Thunderstorm with heavy hail', icon:'⛈️❄️', type:'thunder' },
  };
  return mapping[code] || { desc:'Unknown', icon:'❓', type:'sunny' };
}

function getDayName(dateStr){
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
}

// Smooth background change
function setWeatherBackground(type){
  document.body.classList.remove('sunny','cloudy','rainy','snowy','foggy','thunder');
  void document.body.offsetWidth;
  document.body.classList.add(type);
}

// Display current weather
function displayCurrentWeather(location, data){
  const { temperature, windspeed, winddirection, weathercode } = data;
  const { desc, icon, type } = getWeatherDescriptionAndIcon(weathercode);
  setWeatherBackground(type);

  document.getElementById("weatherResult").innerHTML = `
    <h2>${location}</h2>
    <p class="weather-icon">${icon} ${desc}</p>
    <p>🌡 Temperature: ${temperature}°C</p>
    <p>💨 Wind: ${windspeed} m/s, direction ${winddirection}°</p>
  `;
}

// Display 7-day forecast
function display7DayForecast(daily){
  const forecastDiv = document.getElementById("forecast");
  forecastDiv.innerHTML = "";
  for(let i=0;i<daily.time.length;i++){
    const day = getDayName(daily.time[i]);
    const max = daily.temperature_2m_max[i];
    const min = daily.temperature_2m_min[i];
    const code = daily.weathercode[i];
    const { desc, icon, type } = getWeatherDescriptionAndIcon(code);

    forecastDiv.innerHTML += `
      <div class="forecast-card ${type}">
        <h4>${day}</h4>
        <div class="weather-icon">${icon}</div>
        <p>${desc}</p>
        <p>🌡 Max ${max}°C | Min ${min}°C</p>
      </div>
    `;
  }
}

// Fetch weather data
async function getWeather(location){
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if(!geoData || geoData.length === 0){
      document.getElementById("weatherResult").innerHTML = `<p>❌ Location not found.</p>`;
      document.getElementById("forecast").innerHTML = "";
      return;
    }
    const { lat, lon, display_name } = geoData[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const res = await fetch(weatherUrl);
    const data = await res.json();
    if(data.current_weather){
      displayCurrentWeather(display_name,data.current_weather);
      display7DayForecast(data.daily);
    } else {
      document.getElementById("weatherResult").innerHTML = `<p>❌ Weather data not available</p>`;
      document.getElementById("forecast").innerHTML = "";
    }
  } catch(err){
    document.getElementById("weatherResult").innerHTML = `<p>⚠️ Error fetching data</p>`;
    document.getElementById("forecast").innerHTML = "";
    console.error(err);
  }
}

// Event listeners
document.getElementById("searchBtn").addEventListener("click",()=>{
  const input = document.getElementById("cityInput").value.trim();
  if(!input) return alert("Please enter a location");
  getWeather(input);
});
// ------------------ Load Current Location ------------------
window.addEventListener('load', async ()=>{
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async (position)=>{
            try{
                const { latitude, longitude } = position.coords;
                const data = await fetchWeatherData(latitude, longitude);
                if(data.current_weather){
                    displayCurrentWeather("Current Location", data.current_weather);
                    display7DayForecast(data.daily);
                }
            } catch(e){
                console.error(e);
                getWeather("New York, USA"); // fallback location
            }
        }, ()=>{
            getWeather("New York, USA"); // fallback if permission denied
        });
    } else {
        getWeather("New York, USA"); // fallback if no geolocation
    }
});