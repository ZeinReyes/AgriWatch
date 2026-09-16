import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Info,
  MapPin,
  RefreshCw,
  Thermometer,
  Wind,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

import "./Weather.css";


const WEATHER_API =
  "https://api.open-meteo.com/v1/forecast";


const weatherCodeMap = {
  0: {
    label: "Clear sky",
    icon: CloudSun,
  },

  1: {
    label: "Mainly clear",
    icon: CloudSun,
  },

  2: {
    label: "Partly cloudy",
    icon: CloudSun,
  },

  3: {
    label: "Overcast",
    icon: Cloud,
  },

  45: {
    label: "Fog",
    icon: CloudFog,
  },

  48: {
    label: "Depositing rime fog",
    icon: CloudFog,
  },

  51: {
    label: "Light drizzle",
    icon: CloudRain,
  },

  53: {
    label: "Moderate drizzle",
    icon: CloudRain,
  },

  55: {
    label: "Dense drizzle",
    icon: CloudRain,
  },

  61: {
    label: "Slight rain",
    icon: CloudRain,
  },

  63: {
    label: "Moderate rain",
    icon: CloudRain,
  },

  65: {
    label: "Heavy rain",
    icon: CloudRain,
  },

  71: {
    label: "Slight snow",
    icon: Cloud,
  },

  73: {
    label: "Moderate snow",
    icon: Cloud,
  },

  75: {
    label: "Heavy snow",
    icon: Cloud,
  },

  80: {
    label: "Slight rain showers",
    icon: CloudRain,
  },

  81: {
    label: "Moderate rain showers",
    icon: CloudRain,
  },

  82: {
    label: "Violent rain showers",
    icon: CloudRain,
  },

  95: {
    label: "Thunderstorm",
    icon: CloudLightning,
  },

  96: {
    label: "Thunderstorm with slight hail",
    icon: CloudLightning,
  },

  99: {
    label: "Thunderstorm with heavy hail",
    icon: CloudLightning,
  },
};


const Weather = () => {

  const [
    farms,
    setFarms
  ] = useState([]);

  const [
    weather,
    setWeather
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {
    loadWeather();
  }, []);


  const loadWeather = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get("/farms");


      const farmData =
        Array.isArray(
          response.data
        )
          ? response.data
          : response.data?.farms ||
            response.data?.data ||
            [];


      setFarms(
        farmData
      );


      if (!farmData.length) {

        setWeather(null);

        return;
      }


      const farm =
        farmData[0];


      const latitude =
        Number(
          farm.latitude
        );

      const longitude =
        Number(
          farm.longitude
        );


      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {

        setWeather(null);

        setError(
          "Your farm does not have valid coordinates. Please update the farm location."
        );

        return;
      }


      const url =
        `${WEATHER_API}` +
        `?latitude=${encodeURIComponent(latitude)}` +
        `&longitude=${encodeURIComponent(longitude)}` +
        `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
        `&timezone=auto`;


      const weatherResponse =
        await fetch(
          url
        );


      if (!weatherResponse.ok) {

        throw new Error(
          "Weather request failed."
        );

      }


      const data =
        await weatherResponse.json();


      const currentWeather =
        data.current || {};


      const weatherCode =
        currentWeather.weather_code;


      const weatherInfo =
        weatherCodeMap[
          weatherCode
        ] || {
          label: "Unknown conditions",
          icon: Cloud,
        };


      setWeather({

        farmName:
          farm.farm_name,

        location:
          farm.location,

        latitude,

        longitude,

        temperature:
          currentWeather.temperature_2m,

        humidity:
          currentWeather.relative_humidity_2m,

        precipitation:
          currentWeather.precipitation,

        windSpeed:
          currentWeather.wind_speed_10m,

        weatherCode,

        condition:
          weatherInfo.label,

        weatherIcon:
          weatherInfo.icon,

      });

    } catch (err) {

      console.error(
        "Failed to load weather:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load weather information."
      );

    } finally {

      setLoading(false);

    }

  };


  const WeatherIcon =
    weather?.weatherIcon ||
    Cloud;


  return (

    <DashboardLayout>

      <div className="weather-page">

        {/* =========================================
            HEADER
        ========================================== */}

        <div className="weather-page-header">

          <div className="weather-header-content">

            <div className="weather-title-icon">

              <CloudSun
                size={20}
                strokeWidth={2}
              />

            </div>


            <div>

              <span className="weather-eyebrow">
                ENVIRONMENTAL CONDITIONS
              </span>

              <h1>
                Weather
              </h1>

              <p>
                Monitor current weather conditions
                at your registered farm location.
              </p>

            </div>

          </div>

        </div>


        {/* =========================================
            LOADING
        ========================================== */}

        {loading && (

          <div className="weather-state-card">

            <div className="weather-spinner">
            </div>


            <div className="weather-state-icon">

              <Cloud
                size={22}
                strokeWidth={2}
              />

            </div>


            <h3>
              Loading weather
            </h3>

            <p>
              Retrieving the latest weather
              conditions for your farm.
            </p>

          </div>

        )}


        {/* =========================================
            ERROR
        ========================================== */}

        {!loading && error && (

          <div className="weather-state-card weather-error">

            <div className="weather-state-icon weather-state-icon-error">

              <AlertTriangle
                size={22}
                strokeWidth={2}
              />

            </div>


            <h3>
              Weather unavailable
            </h3>

            <p>
              {error}
            </p>


            <button
              type="button"
              className="weather-retry-button"
              onClick={loadWeather}
            >

              <RefreshCw
                size={15}
                strokeWidth={2}
              />

              Try Again

            </button>

          </div>

        )}


        {/* =========================================
            NO FARM
        ========================================== */}

        {!loading &&
          !error &&
          !farms.length && (

            <div className="weather-state-card">

              <div className="weather-state-icon">

                <MapPin
                  size={21}
                  strokeWidth={2}
                />

              </div>


              <h3>
                No farm available
              </h3>

              <p>
                Add a farm with a valid
                location to view weather
                information.
              </p>

            </div>

          )}


        {/* =========================================
            NO WEATHER DATA
        ========================================== */}

        {!loading &&
          !error &&
          farms.length > 0 &&
          !weather && (

            <div className="weather-state-card">

              <div className="weather-state-icon">

                <Cloud
                  size={21}
                  strokeWidth={2}
                />

              </div>


              <h3>
                No weather data
              </h3>

              <p>
                Weather information is
                currently unavailable.
              </p>

              <button
                type="button"
                className="weather-retry-button"
                onClick={loadWeather}
              >

                <RefreshCw
                  size={15}
                  strokeWidth={2}
                />

                Refresh

              </button>

            </div>

          )}


        {/* =========================================
            WEATHER CONTENT
        ========================================== */}

        {!loading &&
          !error &&
          weather && (

            <>

              {/* =========================================
                  FARM LOCATION + CURRENT WEATHER
              ========================================== */}

              <section className="weather-location-card">

                <div className="weather-location-info">

                  <div className="weather-section-heading">

                    <div className="weather-section-icon">

                      <MapPin
                        size={16}
                        strokeWidth={2}
                      />

                    </div>

                    <span className="weather-section-label">
                      FARM LOCATION
                    </span>

                  </div>


                  <h2>
                    {weather.farmName}
                  </h2>


                  <p>
                    {weather.location}
                  </p>


                  <div className="weather-coordinates">

                    <span>
                      Latitude
                    </span>

                    <strong>
                      {weather.latitude.toFixed(6)}
                    </strong>


                    <span>
                      Longitude
                    </span>

                    <strong>
                      {weather.longitude.toFixed(6)}
                    </strong>

                  </div>

                </div>


                <div className="weather-current">

                  <div className="weather-current-icon">

                    <WeatherIcon
                      size={34}
                      strokeWidth={1.8}
                    />

                  </div>


                  <div className="weather-current-details">

                    <span className="weather-current-label">
                      CURRENT CONDITIONS
                    </span>


                    <strong>
                      {weather.temperature}°C
                    </strong>


                    <span className="weather-current-condition">
                      {weather.condition}
                    </span>

                  </div>

                </div>

              </section>


              {/* =========================================
                  WEATHER METRICS
              ========================================== */}

              <section className="weather-metrics">

                <div className="weather-metric-card">

                  <div className="weather-metric-icon">

                    <Droplets
                      size={18}
                      strokeWidth={2}
                    />

                  </div>


                  <div>

                    <span>
                      Humidity
                    </span>

                    <strong>
                      {weather.humidity}%
                    </strong>

                  </div>

                </div>


                <div className="weather-metric-card">

                  <div className="weather-metric-icon">

                    <CloudRain
                      size={18}
                      strokeWidth={2}
                    />

                  </div>


                  <div>

                    <span>
                      Precipitation
                    </span>

                    <strong>
                      {weather.precipitation} mm
                    </strong>

                  </div>

                </div>


                <div className="weather-metric-card">

                  <div className="weather-metric-icon">

                    <Wind
                      size={18}
                      strokeWidth={2}
                    />

                  </div>


                  <div>

                    <span>
                      Wind Speed
                    </span>

                    <strong>
                      {weather.windSpeed} km/h
                    </strong>

                  </div>

                </div>


                <div className="weather-metric-card">

                  <div className="weather-metric-icon">

                    <Thermometer
                      size={18}
                      strokeWidth={2}
                    />

                  </div>


                  <div>

                    <span>
                      Temperature
                    </span>

                    <strong>
                      {weather.temperature}°C
                    </strong>

                  </div>

                </div>

              </section>


              {/* =========================================
                  INFORMATION
              ========================================== */}

              <section className="weather-information-card">

                <div className="weather-information-icon">

                  <Info
                    size={18}
                    strokeWidth={2}
                  />

                </div>


                <div>

                  <span className="weather-information-label">
                    INFORMATION
                  </span>

                  <h3>
                    Farm Weather Monitoring
                  </h3>

                  <p>
                    Weather information is based
                    on the saved coordinates of your
                    farm. These conditions provide
                    supporting environmental context
                    for crop monitoring and farm
                    management decisions.
                  </p>

                </div>

              </section>


              {/* =========================================
                  DATA SOURCE
              ========================================== */}

              <div className="weather-data-source">

                <Activity
                  size={13}
                  strokeWidth={2}
                />

                <span>
                  Current weather data retrieved
                  from the configured farm location.
                </span>

              </div>

            </>

          )}

      </div>

    </DashboardLayout>

  );
};


export default Weather;