import {
  useEffect,
  useState,
} from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";

import "./Weather.css";


const WEATHER_API =
  "https://api.open-meteo.com/v1/forecast";


const weatherCodeMap = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
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
        Array.isArray(response.data)
          ? response.data
          : response.data?.farms ||
            response.data?.data ||
            [];


      setFarms(farmData);


      if (!farmData.length) {

        setWeather(null);

        return;
      }


      const farm =
        farmData[0];


      const latitude =
        Number(farm.latitude);

      const longitude =
        Number(farm.longitude);


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
        await fetch(url);


      if (!weatherResponse.ok) {
        throw new Error(
          "Weather request failed."
        );
      }


      const data =
        await weatherResponse.json();


      setWeather({

        farmName:
          farm.farm_name,

        location:
          farm.location,

        latitude,

        longitude,

        temperature:
          data.current?.temperature_2m,

        humidity:
          data.current?.relative_humidity_2m,

        precipitation:
          data.current?.precipitation,

        windSpeed:
          data.current?.wind_speed_10m,

        weatherCode:
          data.current?.weather_code,

        condition:
          weatherCodeMap[
            data.current?.weather_code
          ] ||
          "Unknown conditions",

      });

    } catch (err) {

      console.error(
        "Failed to load weather:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load weather information."
      );

    } finally {

      setLoading(false);

    }
  };


  return (

    <DashboardLayout>

      <div className="weather-page">

        <div className="weather-page-header">

          <div>

            <span className="weather-eyebrow">
              FARM WEATHER
            </span>

            <h1>
              Weather
            </h1>

            <p>
              Current weather conditions
              for your farm.
            </p>

          </div>

        </div>


        {loading && (

          <div className="weather-state-card">

            <div className="weather-spinner"></div>

            <h3>
              Loading weather
            </h3>

            <p>
              Retrieving the latest weather
              conditions for your farm.
            </p>

          </div>

        )}


        {!loading && error && (

          <div className="weather-state-card weather-error">

            <div className="weather-state-icon">
              !
            </div>

            <h3>
              Weather unavailable
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {!loading &&
          !error &&
          !farms.length && (

            <div className="weather-state-card">

              <div className="weather-state-icon">
                +
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


        {!loading &&
          !error &&
          farms.length > 0 &&
          !weather && (

            <div className="weather-state-card">

              <div className="weather-state-icon">
                ?
              </div>

              <h3>
                No weather data
              </h3>

              <p>
                Weather information is
                currently unavailable.
              </p>

            </div>

          )}


        {!loading &&
          !error &&
          weather && (

            <>

              <section className="weather-location-card">

                <div className="weather-location-info">

                  <span className="weather-section-label">
                    FARM LOCATION
                  </span>

                  <h2>
                    {weather.farmName}
                  </h2>

                  <p>
                    {weather.location}
                  </p>

                  <span className="weather-coordinates">
                    {weather.latitude.toFixed(6)}
                    {", "}
                    {weather.longitude.toFixed(6)}
                  </span>

                </div>


                <div className="weather-current">

                  <div className="weather-current-icon">
                    ☁
                  </div>

                  <div className="weather-current-details">

                    <strong>
                      {weather.temperature}°C
                    </strong>

                    <span>
                      {weather.condition}
                    </span>

                  </div>

                </div>

              </section>


              <section className="weather-metrics">

                <div className="weather-metric-card">

                  <div className="weather-metric-icon">
                    %
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
                    R
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
                    W
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
                    T
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


              <section className="weather-information-card">

                <div className="weather-information-icon">
                  i
                </div>

                <div>

                  <h3>
                    Farm Weather Monitoring
                  </h3>

                  <p>
                    Weather information is
                    based on the saved
                    coordinates of your farm.
                    These conditions can serve
                    as supporting information
                    for crop monitoring and
                    farm management.
                  </p>

                </div>

              </section>

            </>

          )}

      </div>

    </DashboardLayout>

  );
};


export default Weather;