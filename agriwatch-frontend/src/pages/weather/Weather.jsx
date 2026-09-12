import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";


const WEATHER_CODES = {
  0: {
    label: "Clear sky",
    icon: "☀️",
  },
  1: {
    label: "Mainly clear",
    icon: "🌤️",
  },
  2: {
    label: "Partly cloudy",
    icon: "⛅",
  },
  3: {
    label: "Overcast",
    icon: "☁️",
  },
  45: {
    label: "Fog",
    icon: "🌫️",
  },
  48: {
    label: "Depositing rime fog",
    icon: "🌫️",
  },
  51: {
    label: "Light drizzle",
    icon: "🌦️",
  },
  53: {
    label: "Moderate drizzle",
    icon: "🌦️",
  },
  55: {
    label: "Dense drizzle",
    icon: "🌧️",
  },
  56: {
    label: "Light freezing drizzle",
    icon: "🌧️",
  },
  57: {
    label: "Dense freezing drizzle",
    icon: "🌧️",
  },
  61: {
    label: "Slight rain",
    icon: "🌦️",
  },
  63: {
    label: "Moderate rain",
    icon: "🌧️",
  },
  65: {
    label: "Heavy rain",
    icon: "🌧️",
  },
  66: {
    label: "Light freezing rain",
    icon: "🌧️",
  },
  67: {
    label: "Heavy freezing rain",
    icon: "🌧️",
  },
  71: {
    label: "Slight snow",
    icon: "🌨️",
  },
  73: {
    label: "Moderate snow",
    icon: "🌨️",
  },
  75: {
    label: "Heavy snow",
    icon: "❄️",
  },
  77: {
    label: "Snow grains",
    icon: "🌨️",
  },
  80: {
    label: "Slight rain showers",
    icon: "🌦️",
  },
  81: {
    label: "Moderate rain showers",
    icon: "🌧️",
  },
  82: {
    label: "Violent rain showers",
    icon: "⛈️",
  },
  85: {
    label: "Slight snow showers",
    icon: "🌨️",
  },
  86: {
    label: "Heavy snow showers",
    icon: "❄️",
  },
  95: {
    label: "Thunderstorm",
    icon: "⛈️",
  },
  96: {
    label: "Thunderstorm with slight hail",
    icon: "⛈️",
  },
  99: {
    label: "Thunderstorm with heavy hail",
    icon: "⛈️",
  },
};


const getWeatherInfo = (code) => {
  return (
    WEATHER_CODES[code] || {
      label: "Unknown condition",
      icon: "🌤️",
    }
  );
};


const formatDate = (dateString) => {
  if (!dateString) {
    return "—";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};


const formatTime = (dateString) => {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};


const Weather = () => {
  const [farms, setFarms] = useState([]);

  const [weather, setWeather] = useState(null);

  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const [error, setError] = useState("");


  // =====================================================
  // LOAD FARMS
  // =====================================================

  useEffect(() => {
    let mounted = true;


    const loadFarms = async () => {
      setLoadingFarms(true);
      setError("");


      try {
        const response = await api.get("/farms");

        const data = response?.data;


        let farmList = [];


        if (Array.isArray(data)) {
          farmList = data;
        } else if (Array.isArray(data?.farms)) {
          farmList = data.farms;
        } else if (Array.isArray(data?.data)) {
          farmList = data.data;
        }


        if (mounted) {
          setFarms(farmList);
        }

      } catch (err) {
        console.error(
          "Failed to load farms:",
          err
        );


        if (mounted) {
          setError(
            err?.response?.data?.message ||
              "Unable to load your farm information."
          );
        }

      } finally {
        if (mounted) {
          setLoadingFarms(false);
        }
      }
    };


    loadFarms();


    return () => {
      mounted = false;
    };
  }, []);


  // =====================================================
  // SELECT FARM
  // =====================================================

  const farm = useMemo(() => {
    return farms?.[0] || null;
  }, [farms]);


  // =====================================================
  // FARM COORDINATES
  // =====================================================

  const latitude = Number(farm?.latitude);
  const longitude = Number(farm?.longitude);


  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);


  // =====================================================
  // LOAD WEATHER
  // =====================================================

  useEffect(() => {
    if (!hasCoordinates) {
      setWeather(null);
      return;
    }


    let mounted = true;


    const loadWeather = async () => {
      setLoadingWeather(true);
      setError("");


      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${encodeURIComponent(latitude)}` +
          `&longitude=${encodeURIComponent(longitude)}` +
          `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
          `&timezone=auto` +
          `&forecast_days=7`;


        const response = await fetch(url);


        if (!response.ok) {
          throw new Error(
            "Weather service returned an error."
          );
        }


        const data = await response.json();


        if (mounted) {
          setWeather(data);
        }

      } catch (err) {
        console.error(
          "Failed to load weather:",
          err
        );


        if (mounted) {
          setWeather(null);

          setError(
            "Unable to load weather data right now."
          );
        }

      } finally {
        if (mounted) {
          setLoadingWeather(false);
        }
      }
    };


    loadWeather();


    return () => {
      mounted = false;
    };
  }, [
    latitude,
    longitude,
    hasCoordinates,
  ]);


  // =====================================================
  // CURRENT WEATHER
  // =====================================================

  const currentWeather = weather?.current;

  const currentWeatherInfo =
    getWeatherInfo(
      currentWeather?.weather_code
    );


  // =====================================================
  // FORECAST
  // =====================================================

  const forecastDates =
    weather?.daily?.time || [];

  const forecastCodes =
    weather?.daily?.weather_code || [];

  const forecastMax =
    weather?.daily?.temperature_2m_max || [];

  const forecastMin =
    weather?.daily?.temperature_2m_min || [];

  const forecastRain =
    weather?.daily?.precipitation_sum || [];


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="weather-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-header">

        <div>

          <div className="page-header-eyebrow">
            Farm Environment
          </div>

          <h1 className="page-title">
            Weather
          </h1>

          <p className="page-description">
            Monitor current weather conditions
            around your farm.
          </p>

        </div>

      </div>


      {/* =================================================
          LOADING FARMS
      ================================================= */}

      {loadingFarms && (
        <div className="weather-state-card">

          <div className="weather-spinner">
            ⟳
          </div>

          <h3>
            Loading farm location
          </h3>

          <p>
            Getting your saved farm coordinates...
          </p>

        </div>
      )}


      {/* =================================================
          NO FARM
      ================================================= */}

      {!loadingFarms &&
        !farm &&
        !error && (
          <div className="weather-state-card">

            <div className="weather-state-icon">
              🌱
            </div>

            <h3>
              No farm available
            </h3>

            <p>
              Add a farm first so AgriWatch
              can retrieve weather conditions
              for your farm location.
            </p>

          </div>
        )}


      {/* =================================================
          NO COORDINATES
      ================================================= */}

      {!loadingFarms &&
        farm &&
        !hasCoordinates &&
        !error && (
          <div className="weather-state-card">

            <div className="weather-state-icon">
              📍
            </div>

            <h3>
              Farm coordinates unavailable
            </h3>

            <p>
              Your farm does not have valid
              latitude and longitude coordinates.
              Edit your farm and select its
              location on the map.
            </p>

          </div>
        )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="weather-error-card">

          <div className="weather-error-icon">
            ⚠
          </div>

          <div>

            <strong>
              Weather unavailable
            </strong>

            <p>
              {error}
            </p>

          </div>

        </div>
      )}


      {/* =================================================
          WEATHER CONTENT
      ================================================= */}

      {!loadingFarms &&
        farm &&
        hasCoordinates && (

          <>

            {/* ===========================================
                LOCATION CARD
            =========================================== */}

            <div className="weather-location-card">

              <div className="weather-location-icon">
                📍
              </div>


              <div className="weather-location-content">

                <div className="weather-location-label">
                  Monitoring location
                </div>

                <div className="weather-location-name">
                  {farm.farm_name ||
                    "Your Farm"}
                </div>

                <div className="weather-location-address">
                  {farm.location ||
                    "Farm location"}
                </div>

                <div className="weather-coordinates">

                  {latitude.toFixed(6)}
                  {" , "}
                  {longitude.toFixed(6)}

                </div>

              </div>

            </div>


            {/* ===========================================
                CURRENT WEATHER
            =========================================== */}

            <section className="weather-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Current Conditions
                  </h2>

                  <p>
                    Weather conditions at your
                    farm location.
                  </p>

                </div>

              </div>


              {loadingWeather && (
                <div className="weather-loading-card">

                  <div className="weather-spinner">
                    ⟳
                  </div>

                  <span>
                    Loading current weather...
                  </span>

                </div>
              )}


              {!loadingWeather &&
                weather &&
                currentWeather && (

                  <div className="current-weather-grid">

                    {/* Temperature */}

                    <div className="current-weather-main">

                      <div className="weather-main-icon">
                        {currentWeatherInfo.icon}
                      </div>


                      <div>

                        <div className="weather-main-label">
                          Current temperature
                        </div>

                        <div className="weather-temperature">

                          {Math.round(
                            currentWeather.temperature_2m
                          )}

                          <span>
                            {weather.current_units
                              ?.temperature_2m ||
                              "°C"}
                          </span>

                        </div>

                        <div className="weather-condition">
                          {currentWeatherInfo.label}
                        </div>

                      </div>

                    </div>


                    {/* Humidity */}

                    <div className="weather-metric-card">

                      <div className="weather-metric-icon">
                        💧
                      </div>

                      <div>

                        <div className="weather-metric-label">
                          Humidity
                        </div>

                        <div className="weather-metric-value">

                          {Math.round(
                            currentWeather.relative_humidity_2m
                          )}

                          <span>
                            %
                          </span>

                        </div>

                      </div>

                    </div>


                    {/* Precipitation */}

                    <div className="weather-metric-card">

                      <div className="weather-metric-icon">
                        🌧️
                      </div>

                      <div>

                        <div className="weather-metric-label">
                          Precipitation
                        </div>

                        <div className="weather-metric-value">

                          {Number(
                            currentWeather.precipitation || 0
                          ).toFixed(1)}

                          <span>
                            {weather.current_units
                              ?.precipitation ||
                              "mm"}
                          </span>

                        </div>

                      </div>

                    </div>


                    {/* Wind */}

                    <div className="weather-metric-card">

                      <div className="weather-metric-icon">
                        💨
                      </div>

                      <div>

                        <div className="weather-metric-label">
                          Wind speed
                        </div>

                        <div className="weather-metric-value">

                          {Math.round(
                            currentWeather.wind_speed_10m
                          )}

                          <span>
                            {weather.current_units
                              ?.wind_speed_10m ||
                              "km/h"}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>
                )}

            </section>


            {/* ===========================================
                FORECAST
            =========================================== */}

            {weather?.daily && (
              <section className="weather-section">

                <div className="section-heading">

                  <div>

                    <h2>
                      7-Day Forecast
                    </h2>

                    <p>
                      Expected weather conditions
                      around your farm.
                    </p>

                  </div>

                </div>


                <div className="forecast-grid">

                  {forecastDates.map(
                    (date, index) => {

                      const info =
                        getWeatherInfo(
                          forecastCodes[index]
                        );


                      return (
                        <div
                          className="forecast-card"
                          key={date}
                        >

                          <div className="forecast-date">
                            {formatDate(date)}
                          </div>

                          <div className="forecast-icon">
                            {info.icon}
                          </div>

                          <div className="forecast-condition">
                            {info.label}
                          </div>


                          <div className="forecast-temperature">

                            <strong>
                              {Math.round(
                                forecastMax[index]
                              )}°
                            </strong>

                            <span>
                              {Math.round(
                                forecastMin[index]
                              )}°
                            </span>

                          </div>


                          <div className="forecast-rain">

                            🌧️{" "}

                            {Number(
                              forecastRain[index] || 0
                            ).toFixed(1)}

                            {" mm"}

                          </div>

                        </div>
                      );

                    }
                  )}

                </div>

              </section>
            )}


            {/* ===========================================
                DATA INFORMATION
            =========================================== */}

            {weather && (
              <div className="weather-data-info">

                <div>
                  Weather data is based on the
                  coordinates saved for this farm.
                </div>

                <div>

                  Last updated:{" "}

                  {formatTime(
                    currentWeather?.time
                  )}

                </div>

              </div>
            )}

          </>
        )}

    </div>
  );
};


export default Weather;