import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import DashboardLayout from "../components/dashboard/DashboardLayout";

import RoleBadge from "../components/dashboard/RoleBadge";

import api from "../services/api";


const Dashboard = () => {

  const {
    user,
  } = useAuth();


  const role = user?.role;


  const firstName =
    user?.full_name
      ?.split(" ")[0] ||
    "there";


  const [
    farms,
    setFarms
  ] = useState([]);


  const [
    crops,
    setCrops
  ] = useState([]);


  const [
    monitoringRecords,
    setMonitoringRecords
  ] = useState([]);


  const [
    alerts,
    setAlerts
  ] = useState([]);


  const [
    users,
    setUsers
  ] = useState([]);


  const [
    weather,
    setWeather
  ] = useState(null);


  const [
    weatherLoading,
    setWeatherLoading
  ] = useState(true);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  useEffect(() => {

    const loadDashboard = async () => {

      try {

        setLoading(true);
        setError("");


        const requests = [
          api.get("/farms"),
          api.get("/crops"),
          api.get("/monitoring"),
          api.get("/alerts"),
        ];


        if (role === "admin") {

          requests.push(
            api.get("/admin/users")
          );

        }


        const responses =
          await Promise.all(requests);


        setFarms(
          extractArray(
            responses[0].data,
            [
              "farms",
              "data",
              "results"
            ]
          )
        );


        setCrops(
          extractArray(
            responses[1].data,
            [
              "crops",
              "data",
              "results"
            ]
          )
        );


        setMonitoringRecords(
          extractArray(
            responses[2].data,
            [
              "monitoring",
              "monitoring_records",
              "records",
              "data",
              "results"
            ]
          )
        );


        setAlerts(
          extractArray(
            responses[3].data,
            [
              "alerts",
              "data",
              "results"
            ]
          )
        );


        if (role === "admin") {

          setUsers(
            extractArray(
              responses[4].data,
              [
                "users",
                "data",
                "results"
              ]
            )
          );

        }

      } catch (err) {

        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Some dashboard information could not be loaded."
        );

      } finally {

        setLoading(false);

      }

    };


    if (role) {
      loadDashboard();
    }

  }, [role]);


  // =====================================================
  // WEATHER
  // =====================================================

  useEffect(() => {

    const loadWeather = async () => {

      try {

        setWeatherLoading(true);


        const farmLocation =
          farms?.[0]?.location;


        if (!farmLocation) {

          setWeather(
            await getWeather(
              "Manila, Philippines"
            )
          );

          return;

        }


        const coordinates =
          await geocodeLocation(
            farmLocation
          );


        if (!coordinates) {

          setWeather(
            await getWeather(
              "Manila, Philippines"
            )
          );

          return;

        }


        setWeather(
          await getWeather(
            null,
            coordinates.latitude,
            coordinates.longitude,
            coordinates.name
          )
        );

      } catch (err) {

        console.error(
          "Weather loading error:",
          err
        );

        setWeather(null);

      } finally {

        setWeatherLoading(false);

      }

    };


    loadWeather();

  }, [farms]);


  // =====================================================
  // LATEST MONITORING
  // =====================================================

  const latestMonitoring =
    useMemo(() => {

      if (
        !monitoringRecords.length
      ) {
        return null;
      }


      return [
        ...monitoringRecords
      ].sort(
        (a, b) =>
          new Date(
            b.recorded_at
          ) -
          new Date(
            a.recorded_at
          )
      )[0];

    }, [monitoringRecords]);


  // =====================================================
  // ACTIVE ALERTS
  // =====================================================

  const activeAlerts =
    useMemo(() => {

      return alerts.filter(
        (alert) =>
          !alert.is_resolved
      );

    }, [alerts]);


  const unreadAlerts =
    useMemo(() => {

      return alerts.filter(
        (alert) =>
          !alert.is_read &&
          !alert.is_resolved
      );

    }, [alerts]);


  const criticalAlerts =
    useMemo(() => {

      return activeAlerts.filter(
        (alert) =>
          String(
            alert.severity
          ).toLowerCase() ===
          "critical"
      );

    }, [activeAlerts]);


  // =====================================================
  // CROP HEALTH
  // =====================================================

  const healthyCrops =
    crops.filter(
      (crop) =>
        String(
          crop.status
        ).toLowerCase() ===
        "healthy"
    ).length;


  const attentionCrops =
    crops.filter(
      (crop) =>
        String(
          crop.status
        ).toLowerCase() ===
        "needs attention"
    ).length;


  const criticalCrops =
    crops.filter(
      (crop) =>
        String(
          crop.status
        ).toLowerCase() ===
        "critical"
    ).length;


  const healthPercentage =
    crops.length
      ? Math.round(
          (
            healthyCrops /
            crops.length
          ) * 100
        )
      : 0;


  // =====================================================
  // DETECTIONS
  // =====================================================

  const pestDetections =
    monitoringRecords.filter(
      (record) =>
        record.pest_detected
    ).length;


  const diseaseDetections =
    monitoringRecords.filter(
      (record) =>
        record.disease_detected
    ).length;


  const discolorationDetections =
    monitoringRecords.filter(
      (record) =>
        record.discoloration_detected
    ).length;


  // =====================================================
  // MONITORING TREND
  // =====================================================

  const chartData =
    useMemo(() => {

      return [
        ...monitoringRecords
      ]
        .sort(
          (a, b) =>
            new Date(
              a.recorded_at
            ) -
            new Date(
              b.recorded_at
            )
        )
        .slice(-7);

    }, [monitoringRecords]);


  const maxChartValue =
    Math.max(
      100,
      ...chartData.map(
        (item) =>
          Number(
            item.soil_moisture
          ) || 0
      ),
      ...chartData.map(
        (item) =>
          Number(
            item.crop_temperature
          ) || 0
      )
    );


  // =====================================================
  // RECENT ALERTS
  // =====================================================

  const recentAlerts =
    [...alerts]
      .sort(
        (a, b) =>
          new Date(
            b.created_at
          ) -
          new Date(
            a.created_at
          )
      )
      .slice(0, 4);


  // =====================================================
  // FARM STATUS
  // =====================================================

  const farmStatus =
    criticalAlerts.length > 0
      ? {
          label: "Critical",
          className: "status-critical",
          description:
            "Immediate attention required",
        }
      : activeAlerts.length > 0
        ? {
            label: "Needs Attention",
            className: "status-warning",
            description:
              "Some conditions need review",
          }
        : {
            label: "Good",
            className: "status-good",
            description:
              "All monitored conditions normal",
          };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <DashboardLayout>

      <section className="dashboard-page">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              {role === "admin"
                ? "SYSTEM OVERVIEW"
                : "CROP MONITORING"}
            </span>


            <h1>
              Good day, {firstName}.
            </h1>


            <p>
              {role === "admin"
                ? "Here's an overview of your AgriWatch system."
                : role === "viewer"
                  ? "Here's the latest crop monitoring information."
                  : "Here's the latest information about your crops."}
            </p>

          </div>


          <RoleBadge
            role={role}
          />

        </div>


        {error && (

          <div className="dashboard-error">
            {error}
          </div>

        )}


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="dashboard-stat-grid">


          <DashboardStat
            icon="🌱"
            label="Farm Status"
            value={farmStatus.label}
            description={farmStatus.description}
            className={farmStatus.className}
          />


          <DashboardStat
            icon="💧"
            label="Soil Moisture"
            value={
              latestMonitoring?.soil_moisture != null
                ? `${latestMonitoring.soil_moisture}%`
                : "—"
            }
            description={
              latestMonitoring
                ? getMoistureStatus(
                    latestMonitoring.soil_moisture
                  )
                : "No monitoring data"
            }
          />


          <DashboardStat
            icon="🌡️"
            label="Crop Temperature"
            value={
              latestMonitoring?.crop_temperature != null
                ? `${latestMonitoring.crop_temperature}°C`
                : "—"
            }
            description={
              latestMonitoring
                ? getTemperatureStatus(
                    latestMonitoring.crop_temperature
                  )
                : "No monitoring data"
            }
          />


          <DashboardStat
            icon="🔔"
            label="Active Alerts"
            value={activeAlerts.length}
            description={
              criticalAlerts.length
                ? `${criticalAlerts.length} critical`
                : `${unreadAlerts.length} unread`
            }
            className={
              criticalAlerts.length
                ? "stat-danger"
                : activeAlerts.length
                  ? "stat-warning"
                  : ""
            }
          />

        </section>


        {/* =================================================
            MAIN ROW
        ================================================= */}

        <section className="dashboard-two-column">


          {/* ===============================================
              MONITORING OVERVIEW
          =============================================== */}

          <div className="dashboard-panel monitoring-overview">

            <PanelHeader
              title="Monitoring Overview"
              subtitle="Recent soil moisture and crop temperature readings"
              link="/monitoring"
              linkText="View monitoring"
            />


            {loading ? (

              <DashboardLoading />

            ) : chartData.length === 0 ? (

              <EmptyState
                icon="📊"
                title="No monitoring data yet"
                text="Add a monitoring record to start seeing crop trends."
                link="/monitoring"
                linkText="Add monitoring"
              />

            ) : (

              <div className="monitoring-chart">

                <div className="chart-legend">

                  <span>
                    <i className="legend-dot soil-dot" />
                    Soil Moisture
                  </span>

                  <span>
                    <i className="legend-dot temp-dot" />
                    Temperature
                  </span>

                </div>


                <div className="chart-area">

                  <div className="chart-y-axis">

                    <span>
                      {maxChartValue}
                    </span>

                    <span>
                      {Math.round(
                        maxChartValue * 0.75
                      )}
                    </span>

                    <span>
                      {Math.round(
                        maxChartValue * 0.5
                      )}
                    </span>

                    <span>
                      {Math.round(
                        maxChartValue * 0.25
                      )}
                    </span>

                    <span>
                      0
                    </span>

                  </div>


                  <div className="chart-bars">

                    {chartData.map(
                      (
                        record,
                        index
                      ) => {

                        const moisture =
                          Number(
                            record.soil_moisture
                          ) || 0;


                        const temperature =
                          Number(
                            record.crop_temperature
                          ) || 0;


                        return (

                          <div
                            className="chart-column"
                            key={
                              record.id ||
                              index
                            }
                          >

                            <div className="chart-bars-area">

                              <div
                                className="chart-bar soil-bar"
                                style={{
                                  height: `${Math.min(
                                    100,
                                    (
                                      moisture /
                                      maxChartValue
                                    ) *
                                      100
                                  )}%`,
                                }}
                                title={`Soil moisture: ${moisture}%`}
                              />


                              <div
                                className="chart-bar temp-bar"
                                style={{
                                  height: `${Math.min(
                                    100,
                                    (
                                      temperature /
                                      maxChartValue
                                    ) *
                                      100
                                  )}%`,
                                }}
                                title={`Temperature: ${temperature}°C`}
                              />

                            </div>


                            <span className="chart-label">
                              {formatShortDate(
                                record.recorded_at
                              )}
                            </span>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>

              </div>

            )}

          </div>


          {/* ===============================================
              RECENT ALERTS
          =============================================== */}

          <div className="dashboard-panel recent-alerts-panel">

            <PanelHeader
              title="Recent Alerts"
              subtitle="Latest monitoring notifications"
              link="/alerts"
              linkText="View all"
            />


            {loading ? (

              <DashboardLoading />

            ) : recentAlerts.length === 0 ? (

              <EmptyState
                icon="✓"
                title="No active alerts"
                text="Your crops currently have no recorded alerts."
                link="/alerts"
                linkText="View alerts"
              />

            ) : (

              <div className="dashboard-alert-list">

                {recentAlerts.map(
                  (alert) => (

                    <div
                      className="dashboard-alert-item"
                      key={alert.id}
                    >

                      <div
                        className={`alert-severity-dot ${
                          getSeverityClass(
                            alert.severity
                          )
                        }`}
                      />


                      <div className="dashboard-alert-icon">
                        {getAlertIcon(
                          alert.alert_type
                        )}
                      </div>


                      <div className="dashboard-alert-content">

                        <strong>
                          {alert.alert_type}
                        </strong>


                        <span>
                          {alert.message}
                        </span>


                        <small>
                          {formatRelativeTime(
                            alert.created_at
                          )}
                        </small>

                      </div>


                      <span
                        className={`alert-severity-badge ${
                          getSeverityClass(
                            alert.severity
                          )
                        }`}
                      >
                        {alert.severity}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            SECOND ROW
        ================================================= */}

        <section className="dashboard-three-column">


          {/* ===============================================
              CROP HEALTH
          =============================================== */}

          <div className="dashboard-panel crop-health-panel">

            <PanelHeader
              title="Crop Health"
              subtitle="Current crop status"
              link="/crops"
              linkText="View crops"
            />


            <div className="health-content">

              <div
                className="health-ring"
                style={{
                  "--health": `${healthPercentage * 3.6}deg`,
                }}
              >

                <div className="health-ring-inner">

                  <strong>
                    {healthPercentage}%
                  </strong>

                  <span>
                    Healthy
                  </span>

                </div>

              </div>


              <div className="health-breakdown">

                <HealthRow
                  label="Healthy"
                  value={healthyCrops}
                  className="health-good"
                />

                <HealthRow
                  label="Needs Attention"
                  value={attentionCrops}
                  className="health-warning"
                />

                <HealthRow
                  label="Critical"
                  value={criticalCrops}
                  className="health-critical"
                />

              </div>

            </div>

          </div>


          {/* ===============================================
              WEATHER
          =============================================== */}

          <div className="dashboard-panel weather-panel">

            <PanelHeader
              title="Weather"
              subtitle={
                weather?.location ||
                "Farm area"
              }
              link="#"
              linkText="Current"
              hideLink
            />


            {weatherLoading ? (

              <div className="weather-loading">
                Loading weather...
              </div>

            ) : weather ? (

              <>

                <div className="weather-main">

                  <div className="weather-icon">
                    {getWeatherIcon(
                      weather.weatherCode
                    )}
                  </div>


                  <div>

                    <div className="weather-temperature">
                      {Math.round(
                        weather.temperature
                      )}°C
                    </div>


                    <div className="weather-description">
                      {getWeatherDescription(
                        weather.weatherCode
                      )}
                    </div>

                  </div>

                </div>


                <div className="weather-details">

                  <WeatherDetail
                    icon="💧"
                    label="Humidity"
                    value={`${Math.round(
                      weather.humidity
                    )}%`}
                  />


                  <WeatherDetail
                    icon="💨"
                    label="Wind"
                    value={`${Math.round(
                      weather.windSpeed
                    )} km/h`}
                  />


                  <WeatherDetail
                    icon="🌧️"
                    label="Rain"
                    value={`${weather.rain} mm`}
                  />

                </div>

              </>

            ) : (

              <EmptyState
                icon="☁️"
                title="Weather unavailable"
                text="Weather information could not be retrieved."
              />

            )}

          </div>


          {/* ===============================================
              DETECTION SUMMARY
          =============================================== */}

          <div className="dashboard-panel detection-panel">

            <PanelHeader
              title="Detection Summary"
              subtitle="Recorded crop detections"
              link="/monitoring"
              linkText="View details"
            />


            <div className="detection-list">

              <DetectionRow
                icon="🐛"
                label="Pest Detection"
                value={pestDetections}
                className="detection-warning"
              />


              <DetectionRow
                icon="🦠"
                label="Disease Detection"
                value={diseaseDetections}
                className="detection-critical"
              />


              <DetectionRow
                icon="🍃"
                label="Discoloration"
                value={discolorationDetections}
                className="detection-info"
              />

            </div>

          </div>

        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="dashboard-panel quick-actions-panel">

          <div className="panel-header">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Common AgriWatch functions
              </p>

            </div>

          </div>


          <div className="quick-actions">

            {role !== "viewer" && (

              <Link
                to="/monitoring"
                className="quick-action"
              >

                <span>
                  💧
                </span>

                <div>

                  <strong>
                    Add Monitoring
                  </strong>

                  <small>
                    Record crop conditions
                  </small>

                </div>

              </Link>

            )}


            <Link
              to="/alerts"
              className="quick-action"
            >

              <span>
                🔔
              </span>

              <div>

                <strong>
                  View Alerts
                </strong>

                <small>
                  Review crop warnings
                </small>

              </div>

            </Link>


            <Link
              to="/crops"
              className="quick-action"
            >

              <span>
                🍅
              </span>

              <div>

                <strong>
                  My Crops
                </strong>

                <small>
                  Manage tomato crops
                </small>

              </div>

            </Link>


            <Link
              to="/analytics"
              className="quick-action"
            >

              <span>
                📊
              </span>

              <div>

                <strong>
                  Analytics
                </strong>

                <small>
                  Review monitoring trends
                </small>

              </div>

            </Link>

          </div>

        </section>


        {/* =================================================
            ADMIN INFORMATION
        ================================================= */}

        {role === "admin" && (

          <section className="admin-dashboard-note">

            <div className="admin-dashboard-icon">
              🛡️
            </div>


            <div>

              <strong>
                Administrator access
              </strong>


              <p>
                {users.length} registered user
                {users.length !== 1 ? "s" : ""} in the
                AgriWatch system. You can manage
                accounts and system settings from
                the administration menu.
              </p>

            </div>

          </section>

        )}

      </section>

    </DashboardLayout>
  );
};


// =========================================================
// COMPONENTS
// =========================================================

const DashboardStat = ({
  icon,
  label,
  value,
  description,
  className = "",
}) => {

  return (

    <div
      className={`dashboard-stat-card ${className}`}
    >

      <div className="dashboard-stat-icon">
        {icon}
      </div>


      <div className="dashboard-stat-info">

        <span>
          {label}
        </span>


        <strong>
          {value}
        </strong>


        <small>
          {description}
        </small>

      </div>

    </div>

  );
};


const PanelHeader = ({
  title,
  subtitle,
  link,
  linkText,
  hideLink = false,
}) => {

  return (

    <div className="panel-header">

      <div>

        <h2>
          {title}
        </h2>


        <p>
          {subtitle}
        </p>

      </div>


      {!hideLink && link && (

        <Link
          to={link}
          className="panel-action"
        >
          {linkText}
        </Link>

      )}

    </div>

  );
};


const HealthRow = ({
  label,
  value,
  className,
}) => {

  return (

    <div className="health-row">

      <div>

        <i
          className={`health-dot ${className}`}
        />

        <span>
          {label}
        </span>

      </div>


      <strong>
        {value}
      </strong>

    </div>

  );
};


const DetectionRow = ({
  icon,
  label,
  value,
  className,
}) => {

  return (

    <div className="detection-row">

      <div
        className={`detection-icon ${className}`}
      >
        {icon}
      </div>


      <div>

        <strong>
          {label}
        </strong>

        <span>
          Recorded detections
        </span>

      </div>


      <b>
        {value}
      </b>

    </div>

  );
};


const WeatherDetail = ({
  icon,
  label,
  value,
}) => {

  return (

    <div className="weather-detail">

      <span>
        {icon}
      </span>

      <div>

        <small>
          {label}
        </small>

        <strong>
          {value}
        </strong>

      </div>

    </div>

  );
};


const DashboardLoading = () => {

  return (

    <div className="dashboard-loading">

      <div className="loading-spinner" />

      <span>
        Loading monitoring data...
      </span>

    </div>

  );

};


const EmptyState = ({
  icon,
  title,
  text,
  link,
  linkText,
}) => {

  return (

    <div className="dashboard-empty">

      <div className="empty-icon">
        {icon}
      </div>


      <strong>
        {title}
      </strong>


      <span>
        {text}
      </span>


      {link && (

        <Link
          to={link}
          className="empty-action"
        >
          {linkText}
        </Link>

      )}

    </div>

  );

};


// =========================================================
// HELPERS
// =========================================================

function extractArray(
  response,
  keys
) {

  if (Array.isArray(response)) {
    return response;
  }


  if (!response) {
    return [];
  }


  for (const key of keys) {

    if (
      Array.isArray(
        response[key]
      )
    ) {
      return response[key];
    }

  }


  return [];
}


function getMoistureStatus(
  value
) {

  const moisture =
    Number(value);


  if (moisture < 30) {
    return "Low moisture";
  }


  if (moisture < 45) {
    return "Monitor moisture";
  }


  return "Good moisture level";

}


function getTemperatureStatus(
  value
) {

  const temperature =
    Number(value);


  if (temperature > 35) {
    return "Critical temperature";
  }


  if (temperature >= 30) {
    return "Elevated temperature";
  }


  return "Normal temperature";

}


function getSeverityClass(
  severity
) {

  const value =
    String(
      severity || ""
    ).toLowerCase();


  if (value === "critical") {
    return "severity-critical";
  }


  if (value === "warning") {
    return "severity-warning";
  }


  return "severity-info";

}


function getAlertIcon(
  type
) {

  const value =
    String(
      type || ""
    ).toLowerCase();


  if (
    value.includes("soil") ||
    value.includes("moisture")
  ) {
    return "💧";
  }


  if (
    value.includes("temperature")
  ) {
    return "🌡️";
  }


  if (
    value.includes("pest")
  ) {
    return "🐛";
  }


  if (
    value.includes("disease")
  ) {
    return "🦠";
  }


  if (
    value.includes("discolor")
  ) {
    return "🍃";
  }


  return "⚠️";

}


function formatShortDate(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  return date.toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
    }
  );

}


function formatRelativeTime(
  value
) {

  if (!value) {
    return "Unknown time";
  }


  const date =
    new Date(value);


  const now =
    new Date();


  const difference =
    now.getTime() -
    date.getTime();


  const minutes =
    Math.floor(
      difference /
      (1000 * 60)
    );


  if (minutes < 1) {
    return "Just now";
  }


  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }


  const hours =
    Math.floor(
      minutes / 60
    );


  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }


  const days =
    Math.floor(
      hours / 24
    );


  return `${days} day${
    days === 1 ? "" : "s"
  } ago`;

}


// =========================================================
// WEATHER API
// =========================================================

async function geocodeLocation(
  location
) {

  const response =
    await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        location
      )}&count=1&language=en&format=json`
    );


  if (!response.ok) {
    throw new Error(
      "Unable to geocode location."
    );
  }


  const data =
    await response.json();


  if (
    !data.results ||
    !data.results.length
  ) {
    return null;
  }


  const result =
    data.results[0];


  return {
    latitude:
      result.latitude,

    longitude:
      result.longitude,

    name:
      [
        result.name,
        result.admin1,
        result.country,
      ]
        .filter(Boolean)
        .join(", "),
  };

}


async function getWeather(
  locationName = null,
  latitude = null,
  longitude = null,
  resolvedName = null
) {

  if (
    latitude === null ||
    longitude === null
  ) {

    const coordinates =
      await geocodeLocation(
        locationName
      );


    if (!coordinates) {
      throw new Error(
        "Weather location not found."
      );
    }


    latitude =
      coordinates.latitude;


    longitude =
      coordinates.longitude;


    resolvedName =
      coordinates.name;

  }


  const response =
    await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`
    );


  if (!response.ok) {
    throw new Error(
      "Unable to retrieve weather."
    );
  }


  const data =
    await response.json();


  return {

    location:
      resolvedName ||
      locationName ||
      "Farm area",

    temperature:
      data.current?.temperature_2m ??
      0,

    humidity:
      data.current?.relative_humidity_2m ??
      0,

    rain:
      data.current?.precipitation ??
      0,

    weatherCode:
      data.current?.weather_code ??
      0,

    windSpeed:
      data.current?.wind_speed_10m ??
      0,

  };

}


function getWeatherIcon(
  code
) {

  if (code === 0) {
    return "☀️";
  }


  if (
    code === 1 ||
    code === 2
  ) {
    return "⛅";
  }


  if (code === 3) {
    return "☁️";
  }


  if (
    code >= 45 &&
    code <= 48
  ) {
    return "🌫️";
  }


  if (
    code >= 51 &&
    code <= 67
  ) {
    return "🌧️";
  }


  if (
    code >= 71 &&
    code <= 77
  ) {
    return "🌨️";
  }


  if (
    code >= 80 &&
    code <= 82
  ) {
    return "🌦️";
  }


  if (
    code >= 95
  ) {
    return "⛈️";
  }


  return "🌤️";

}


function getWeatherDescription(
  code
) {

  if (code === 0) {
    return "Clear sky";
  }


  if (
    code === 1 ||
    code === 2
  ) {
    return "Partly cloudy";
  }


  if (code === 3) {
    return "Overcast";
  }


  if (
    code >= 45 &&
    code <= 48
  ) {
    return "Foggy";
  }


  if (
    code >= 51 &&
    code <= 67
  ) {
    return "Rain";
  }


  if (
    code >= 71 &&
    code <= 77
  ) {
    return "Snow";
  }


  if (
    code >= 80 &&
    code <= 82
  ) {
    return "Rain showers";
  }


  if (code >= 95) {
    return "Thunderstorm";
  }


  return "Variable conditions";

}


export default Dashboard;