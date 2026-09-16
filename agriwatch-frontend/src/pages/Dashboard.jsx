import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Leaf,
  Thermometer,
  Droplet,
  Droplets,
  Clock,
  LayoutGrid,
  CheckCircle2,
  Activity,
  Bug,
  Microscope,
  AlertTriangle,
  Bell,
  BarChart3,
  Shield,
  CloudOff,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Wind,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import RoleBadge from "../components/dashboard/RoleBadge";
import api from "../services/api";

import "./Dashboard.css";

// =========================================================
// DASHBOARD
// =========================================================

const Dashboard = () => {
  const { user } = useAuth();

  const role = user?.role;

  const firstName =
    user?.full_name?.split(" ")[0] || "there";

  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [monitoringRecords, setMonitoringRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          requests.push(api.get("/admin/users"));
        }

        const responses = await Promise.all(requests);

        setFarms(
          extractArray(responses[0].data, [
            "farms",
            "data",
            "results",
          ])
        );

        setCrops(
          extractArray(responses[1].data, [
            "crops",
            "data",
            "results",
          ])
        );

        setMonitoringRecords(
          extractArray(responses[2].data, [
            "monitoring",
            "monitoring_records",
            "records",
            "data",
            "results",
          ])
        );

        setAlerts(
          extractArray(responses[3].data, [
            "alerts",
            "data",
            "results",
          ])
        );

        if (role === "admin") {
          setUsers(
            extractArray(responses[4].data, [
              "users",
              "data",
              "results",
            ])
          );
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);
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
        setWeather(null);

        const farm = farms?.[0];

        if (!farm) {
          return;
        }

        const latitude = Number(farm.latitude);
        const longitude = Number(farm.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return;
        }

        const farmWeather = await getWeather(
          latitude,
          longitude
        );

        setWeather({
          ...farmWeather,
          location: farm.location || "Farm area",
        });
      } catch (err) {
        console.error("Weather loading error:", err);
        setWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    };

    if (!loading) {
      loadWeather();
    }
  }, [farms, loading]);

  // =====================================================
  // DERIVED DATA
  // =====================================================

  const latestMonitoring = useMemo(() => {
    if (!monitoringRecords.length) {
      return null;
    }

    return [...monitoringRecords].sort(
      (a, b) =>
        new Date(b.recorded_at) -
        new Date(a.recorded_at)
    )[0];
  }, [monitoringRecords]);

  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) => !alert.is_resolved
      ),
    [alerts]
  );

  const unreadAlerts = useMemo(
    () =>
      activeAlerts.filter(
        (alert) => !alert.is_read
      ),
    [activeAlerts]
  );

  const criticalAlerts = useMemo(
    () =>
      activeAlerts.filter(
        (alert) =>
          String(alert.severity).toLowerCase() ===
          "critical"
      ),
    [activeAlerts]
  );

  const healthyCrops = crops.filter(
    (crop) =>
      String(crop.status).toLowerCase() ===
      "healthy"
  ).length;

  const attentionCrops = crops.filter(
    (crop) =>
      String(crop.status).toLowerCase() ===
      "needs attention"
  ).length;

  const criticalCrops = crops.filter(
    (crop) =>
      String(crop.status).toLowerCase() ===
      "critical"
  ).length;

  const harvestedCrops = crops.filter(
    (crop) =>
      String(crop.status).toLowerCase() ===
      "harvested"
  ).length;

  const healthPercentages = useMemo(() => {
    if (!crops.length) {
      return {
        healthy: 0,
        moderate: 0,
        poor: 0,
      };
    }

    return {
      healthy: Math.round(
        (healthyCrops / crops.length) * 100
      ),
      moderate: Math.round(
        (attentionCrops / crops.length) * 100
      ),
      poor: Math.round(
        (criticalCrops / crops.length) * 100
      ),
    };
  }, [
    crops.length,
    healthyCrops,
    attentionCrops,
    criticalCrops,
  ]);

  const pestDetections = monitoringRecords.filter(
    (record) => Boolean(record.pest_detected)
  ).length;

  const diseaseDetections =
    monitoringRecords.filter(
      (record) => Boolean(record.disease_detected)
    ).length;

  const discolorationDetections =
    monitoringRecords.filter(
      (record) =>
        Boolean(record.discoloration_detected)
    ).length;

  const chartData = useMemo(() => {
    const sorted = [...monitoringRecords].sort(
      (a, b) =>
        new Date(a.recorded_at) -
        new Date(b.recorded_at)
    );

    return sorted.slice(-7).map((record) => ({
      ...record,
      shortDate: formatShortDate(
        record.recorded_at
      ),
      temperature:
        Number(record.crop_temperature) || 0,
      moisture:
        Number(record.soil_moisture) || 0,
      humidity:
        record.humidity != null
          ? Number(record.humidity)
          : null,
    }));
  }, [monitoringRecords]);

  // Historical humidity as actually logged on monitoring records.
  const hasHistoricalHumidity = chartData.some(
    (item) => item.humidity != null
  );

  // Live humidity pulled from the weather API for the farm, used as a
  // fallback reference whenever monitoring records don't carry a
  // historical humidity reading of their own.
  const currentWeatherHumidity =
    weather?.humidity != null
      ? Number(weather.humidity)
      : null;

  const showHumidityInTrend =
    hasHistoricalHumidity || currentWeatherHumidity != null;

  const recentAlerts = useMemo(
    () =>
      [...alerts]
        .sort(
          (a, b) =>
            new Date(b.created_at) -
            new Date(a.created_at)
        )
        .slice(0, 4),
    [alerts]
  );

  const recentDetection = useMemo(() => {
    return [...monitoringRecords]
      .sort(
        (a, b) =>
          new Date(b.recorded_at) -
          new Date(a.recorded_at)
      )
      .find(
        (record) =>
          record.pest_detected ||
          record.disease_detected ||
          record.discoloration_detected ||
          String(
            record.plant_condition || ""
          ).toLowerCase() !== "healthy"
      );
  }, [monitoringRecords]);

  const farmStatus =
    criticalAlerts.length > 0 ||
    criticalCrops > 0
      ? {
          label: "Critical",
          className: "status-critical",
          description:
            "Immediate attention required",
        }
      : activeAlerts.length > 0 ||
        attentionCrops > 0
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

  const lastUpdated =
    latestMonitoring?.recorded_at ||
    farms?.[0]?.updated_at ||
    null;

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

            <h1>Good day, {firstName}.</h1>

            <p>
              {role === "admin"
                ? "Here's an overview of your AgriWatch system."
                : role === "viewer"
                ? "Here's the latest crop monitoring information."
                : "Here's the latest information about your crops."}
            </p>
          </div>

          <RoleBadge role={role} />
        </div>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="dashboard-stat-grid dashboard-stat-grid-five">
          <DashboardStat
            icon={<Sprout size={20} strokeWidth={1.75} />}
            label="Farm Status"
            value={farmStatus.label}
            description={farmStatus.description}
            className={farmStatus.className}
          />

          <DashboardStat
            icon={<Thermometer size={20} strokeWidth={1.75} />}
            label="Temperature"
            value={
              latestMonitoring?.crop_temperature != null
                ? `${formatNumber(
                    latestMonitoring.crop_temperature
                  )}°C`
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
            icon={<Droplet size={20} strokeWidth={1.75} />}
            label="Humidity"
            value={
              weather
                ? `${Math.round(weather.humidity)}%`
                : "—"
            }
            description="Current farm humidity"
          />

          <DashboardStat
            icon={<Droplets size={20} strokeWidth={1.75} />}
            label="Soil Moisture"
            value={
              latestMonitoring?.soil_moisture != null
                ? `${formatNumber(
                    latestMonitoring.soil_moisture
                  )}%`
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
            icon={<Clock size={20} strokeWidth={1.75} />}
            label="Last Updated"
            value={
              lastUpdated
                ? formatTime(lastUpdated)
                : "—"
            }
            description={
              lastUpdated
                ? formatDate(lastUpdated)
                : "No recent reading"
            }
          />
        </section>

        {/* =================================================
            MAIN ROW
        ================================================= */}

        <section className="dashboard-two-column">
          {/* FIELD OVERVIEW */}

          <div className="dashboard-panel field-overview-panel">
            <PanelHeader
              title="Field Overview"
              subtitle="Current status of your monitored crops"
              link="/crops"
              linkText="View crops"
            />

            <div className="field-overview-content">
              {crops.length === 0 ? (
                <EmptyState
                  icon={<LayoutGrid size={22} strokeWidth={1.75} />}
                  title="No crops yet"
                  text="Add a tomato crop to start monitoring field status."
                  link="/crops"
                  linkText="Manage crops"
                />
              ) : (
                <>
                  <div className="field-map-grid">
                    {getFieldBlocks(crops).map(
                      (field, index) => (
                        <div
                          className={`field-block ${
                            getStatusClass(field.status)
                          }`}
                          key={
                            field.id ||
                            `${field.name}-${index}`
                          }
                        >
                          <span>
                            {field.name}
                          </span>
                          <small>
                            {field.status}
                          </small>
                          {field.variety && (
                            <em>{field.variety}</em>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  <div className="field-legend">
                    <FieldLegend
                      status="Good"
                      className="status-good"
                    />
                    <FieldLegend
                      status="Watch"
                      className="status-warning"
                    />
                    <FieldLegend
                      status="Alert"
                      className="status-critical"
                    />
                    <FieldLegend
                      status="Offline"
                      className="status-offline"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RECENT ALERTS */}

          <div className="dashboard-panel recent-alerts-panel">
            <PanelHeader
              title="Recent Alerts"
              subtitle="Latest warnings and monitoring events"
              link="/alerts"
              linkText="View all"
            />

            {loading ? (
              <DashboardLoading />
            ) : recentAlerts.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={22} strokeWidth={1.75} />}
                title="No alerts"
                text="Your crops currently have no recorded alerts."
                link="/alerts"
                linkText="View alerts"
              />
            ) : (
              <div className="dashboard-alert-list">
                {recentAlerts.map((alert) => (
                  <div
                    className="dashboard-alert-item"
                    key={alert.id}
                  >
                    <div
                      className={`alert-severity-dot ${getSeverityClass(
                        alert.severity
                      )}`}
                    />

                    <div
                      className={`dashboard-alert-icon ${getSeverityClass(
                        alert.severity
                      )}`}
                    >
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
                      className={`alert-severity-badge ${getSeverityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            ENVIRONMENTAL TRENDS / CROP HEALTH / WEATHER
        ================================================= */}

        <section className="dashboard-three-column dashboard-middle-grid">
          <div className="dashboard-panel environmental-panel">
            <PanelHeader
              title="Environmental Trends"
              subtitle="Recent readings from crop monitoring"
              link="/monitoring"
              linkText="View monitoring"
            />

            {loading ? (
              <DashboardLoading />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<Activity size={22} strokeWidth={1.75} />}
                title="No trend data yet"
                text="Add monitoring records to start seeing environmental trends."
                link="/monitoring"
                linkText="Add monitoring"
              />
            ) : (
              <EnvironmentalTrendChart
                data={chartData}
                showHumidity={showHumidityInTrend}
                hasHistoricalHumidity={hasHistoricalHumidity}
                currentHumidity={currentWeatherHumidity}
              />
            )}
          </div>

          <div className="dashboard-panel crop-health-panel">
            <PanelHeader
              title="Crop Health"
              subtitle="Overall health of monitored crops"
              link="/crops"
              linkText="View crops"
            />

            <div className="health-content">
              <div
                className="health-ring"
                style={{
                  "--healthy-angle": `${healthPercentages.healthy * 3.6}deg`,
                  "--moderate-angle": `${healthPercentages.moderate * 3.6}deg`,
                  "--poor-angle": `${healthPercentages.poor * 3.6}deg`,
                }}
              >
                <div className="health-ring-inner">
                  <strong>{healthPercentages.healthy}%</strong>
                  <span>Healthy</span>
                </div>
              </div>

              <div className="health-breakdown">
                <HealthRow
                  label="Healthy"
                  value={`${healthPercentages.healthy}%`}
                  count={healthyCrops}
                  className="health-good"
                />
                <HealthRow
                  label="Moderate"
                  value={`${healthPercentages.moderate}%`}
                  count={attentionCrops}
                  className="health-warning"
                />
                <HealthRow
                  label="Poor"
                  value={`${healthPercentages.poor}%`}
                  count={criticalCrops}
                  className="health-critical"
                />
              </div>
            </div>

            <div className="health-footer">
              <span>
                {crops.length} total crop
                {crops.length !== 1 ? "s" : ""}
              </span>

              {harvestedCrops > 0 && (
                <span>
                  {harvestedCrops} harvested
                </span>
              )}
            </div>
          </div>

          <div className="dashboard-panel weather-panel">
            <PanelHeader
              title="Weather Forecast"
              subtitle={
                weather?.location ||
                farms?.[0]?.location ||
                "Farm area"
              }
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
                    icon={<Droplet size={16} strokeWidth={1.75} />}
                    label="Humidity"
                    value={`${Math.round(
                      weather.humidity
                    )}%`}
                  />

                  <WeatherDetail
                    icon={<Wind size={16} strokeWidth={1.75} />}
                    label="Wind"
                    value={`${Math.round(
                      weather.windSpeed
                    )} km/h`}
                  />

                  <WeatherDetail
                    icon={<CloudRain size={16} strokeWidth={1.75} />}
                    label="Rain"
                    value={`${weather.rain} mm`}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                icon={<CloudOff size={22} strokeWidth={1.75} />}
                title="Weather unavailable"
                text={
                  farms?.[0]
                    ? "Weather information could not be retrieved for this farm."
                    : "Add a farm with coordinates to display weather."
                }
              />
            )}
          </div>
        </section>

        {/* =================================================
            CROP MONITORING / PEST & DISEASE / ALERT SUMMARY
        ================================================= */}

        <section className="dashboard-three-column dashboard-lower-grid">
          <div className="dashboard-panel crop-monitoring-panel">
            <PanelHeader
              title="Crop Monitoring"
              subtitle="Current status by monitored crop"
              link="/monitoring"
              linkText="View details"
            />

            {crops.length === 0 ? (
              <EmptyState
                icon={<Sprout size={22} strokeWidth={1.75} />}
                title="No monitored crops"
                text="Add a crop and record monitoring data to populate this section."
                link="/crops"
                linkText="Manage crops"
              />
            ) : (
              <div className="crop-monitoring-list">
                {crops.slice(0, 5).map((crop) => (
                  <div
                    className="crop-monitoring-row"
                    key={crop.id}
                  >
                    <div className="crop-monitoring-thumb">
                      <Leaf size={17} strokeWidth={1.75} />
                    </div>

                    <div className="crop-monitoring-info">
                      <strong>
                        {crop.crop_name ||
                          "Tomato Crop"}
                      </strong>

                      <span>
                        {crop.variety ||
                          "Tomato"}
                      </span>
                    </div>

                    <span
                      className={`status-pill ${getStatusClass(
                        crop.status
                      )}`}
                    >
                      {crop.status ||
                        "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {crops.length > 5 && (
              <Link
                className="panel-bottom-link"
                to="/crops"
              >
                View all {crops.length} crops
              </Link>
            )}
          </div>

          <div className="dashboard-panel detection-panel">
            <PanelHeader
              title="Pest & Disease Detection"
              subtitle="Latest condition findings"
              link="/monitoring"
              linkText="View details"
            />

            {recentDetection ? (
              <div className="detection-feature">
                <div className="detection-feature-visual">
                  <div className="detection-leaf" />

                  <span
                    className={`detection-status-chip ${
                      recentDetection.disease_detected
                        ? "critical"
                        : recentDetection.pest_detected ||
                          recentDetection.discoloration_detected
                        ? "warning"
                        : "good"
                    }`}
                  >
                    {getDetectionLabel(
                      recentDetection
                    )}
                  </span>
                </div>

                <div className="detection-feature-copy">
                  <strong>
                    {getDetectionTitle(
                      recentDetection
                    )}
                  </strong>

                  <span>
                    Recorded{" "}
                    {formatRelativeTime(
                      recentDetection.recorded_at
                    )}
                  </span>

                  <div className="detection-count-grid">
                    <DetectionMini
                      label="Pest"
                      value={pestDetections}
                      className="detection-warning"
                    />

                    <DetectionMini
                      label="Disease"
                      value={diseaseDetections}
                      className="detection-critical"
                    />

                    <DetectionMini
                      label="Discoloration"
                      value={
                        discolorationDetections
                      }
                      className="detection-info"
                    />
                  </div>

                  <p>
                    {getDetectionRecommendation(
                      recentDetection
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 size={22} strokeWidth={1.75} />}
                title="No detections recorded"
                text="Detection results will appear here when monitoring data is available."
                link="/monitoring"
                linkText="Add monitoring"
              />
            )}
          </div>

          <div className="dashboard-panel alert-summary-panel">
            <PanelHeader
              title="Alerts"
              subtitle="Current notification overview"
              link="/alerts"
              linkText="View all alerts"
            />

            <div className="alert-summary-tabs">
              <span className="active">
                All
              </span>
              <span>
                Unread {unreadAlerts.length}
              </span>
              <span>
                Critical {criticalAlerts.length}
              </span>
            </div>

            <div className="alert-summary-list">
              {recentAlerts.slice(0, 4).map(
                (alert) => (
                  <div
                    className="alert-summary-row"
                    key={alert.id}
                  >
                    <div
                      className={`alert-summary-icon ${getSeverityClass(
                        alert.severity
                      )}`}
                    >
                      {getAlertIcon(
                        alert.alert_type
                      )}
                    </div>

                    <div>
                      <strong>
                        {alert.alert_type}
                      </strong>
                      <span>
                        {alert.message}
                      </span>
                    </div>

                    <small>
                      {formatTime(
                        alert.created_at
                      )}
                    </small>
                  </div>
                )
              )}

              {recentAlerts.length === 0 && (
                <div className="alert-summary-empty">
                  No recent alerts.
                </div>
              )}
            </div>

            <Link
              className="panel-bottom-link centered"
              to="/alerts"
            >
              View all alerts
            </Link>
          </div>
        </section>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="dashboard-panel quick-actions-panel">
          <div className="panel-header">
            <div>
              <h2>Quick Actions</h2>
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
                  <Droplet size={17} strokeWidth={1.75} />
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
                <Bell size={17} strokeWidth={1.75} />
              </span>
              <div>
                <strong>View Alerts</strong>
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
                <Leaf size={17} strokeWidth={1.75} />
              </span>
              <div>
                <strong>My Crops</strong>
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
                <BarChart3 size={17} strokeWidth={1.75} />
              </span>
              <div>
                <strong>Analytics</strong>
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
              <Shield size={19} strokeWidth={1.75} />
            </div>

            <div>
              <strong>
                Administrator access
              </strong>

              <p>
                {users.length} registered user
                {users.length !== 1 ? "s" : ""} in
                the AgriWatch system. You can manage
                accounts and system settings from the
                administration menu.
              </p>
            </div>
          </section>
        )}
      </section>
    </DashboardLayout>
  );
};

// =========================================================
// CHART
// =========================================================

const EnvironmentalTrendChart = ({
  data,
  showHumidity,
  hasHistoricalHumidity,
  currentHumidity,
}) => {
  const chartWidth = 820;
  const chartHeight = 255;
  const left = 42;
  const right = 22;
  const top = 18;
  const bottom = 38;

  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;

  const xFor = (index) =>
    data.length === 1
      ? left + plotWidth / 2
      : left +
        (index / (data.length - 1)) * plotWidth;

  const clamp = (value) =>
    Math.max(0, Math.min(100, Number(value) || 0));

  const yFor = (value) =>
    top +
    plotHeight -
    (clamp(value) / 100) * plotHeight;

  const buildPoints = (key) =>
    data
      .filter((item) => item[key] != null)
      .map((item) => {
        const index = data.indexOf(item);
        return `${xFor(index)},${yFor(item[key])}`;
      })
      .join(" ");

  const temperaturePoints = buildPoints("temperature");
  const humidityPoints = hasHistoricalHumidity
    ? buildPoints("humidity")
    : "";
  const soilPoints = buildPoints("moisture");

  const showLiveHumidityReference =
    showHumidity &&
    !hasHistoricalHumidity &&
    currentHumidity != null;

  return (
    <div className="trend-chart">
      <div className="chart-heading-row">
        <div className="chart-legend">
          <span>
            <i className="legend-dot temp-dot" />
            Temperature (°C)
          </span>
          {showHumidity && (
            <span>
              <i className="legend-dot humidity-dot" />
              {hasHistoricalHumidity
                ? "Humidity (%)"
                : "Humidity (live weather, %)"}
            </span>
          )}
          <span>
            <i className="legend-dot soil-dot" />
            Soil Moisture (%)
          </span>
        </div>
        <span className="chart-period">Last 7 readings</span>
      </div>

      <div className="svg-chart-wrap">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label="Environmental trends chart"
          preserveAspectRatio="none"
        >
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yFor(tick);

            return (
              <g key={tick}>
                <line
                  x1={left}
                  x2={chartWidth - right}
                  y1={y}
                  y2={y}
                  className="chart-grid-line"
                />
                <text
                  x={left - 10}
                  y={y + 4}
                  className="chart-axis-label"
                  textAnchor="end"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <polyline
            points={temperaturePoints}
            className="trend-line trend-temperature"
            fill="none"
          />

          {showHumidity && hasHistoricalHumidity && (
            <polyline
              points={humidityPoints}
              className="trend-line trend-humidity"
              fill="none"
            />
          )}

          {showLiveHumidityReference && (
            <g>
              <line
                x1={left}
                x2={chartWidth - right}
                y1={yFor(currentHumidity)}
                y2={yFor(currentHumidity)}
                className="trend-line trend-humidity trend-humidity-reference"
              />
              <text
                x={chartWidth - right}
                y={yFor(currentHumidity) - 7}
                textAnchor="end"
                className="chart-reference-label"
              >
                Current humidity — {Math.round(currentHumidity)}%
              </text>
            </g>
          )}

          <polyline
            points={soilPoints}
            className="trend-line trend-soil"
            fill="none"
          />

          {data.map((item, index) => (
            <g key={`point-${item.id || index}`}>
              {item.temperature != null && (
                <circle
                  cx={xFor(index)}
                  cy={yFor(item.temperature)}
                  r="3.2"
                  className="trend-point temperature-point"
                />
              )}

              {hasHistoricalHumidity && item.humidity != null && (
                <circle
                  cx={xFor(index)}
                  cy={yFor(item.humidity)}
                  r="3.2"
                  className="trend-point humidity-point"
                />
              )}

              {item.moisture != null && (
                <circle
                  cx={xFor(index)}
                  cy={yFor(item.moisture)}
                  r="3.2"
                  className="trend-point soil-point"
                />
              )}

              <text
                x={xFor(index)}
                y={chartHeight - 11}
                className="chart-x-label"
                textAnchor="middle"
              >
                {item.shortDate}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {!hasHistoricalHumidity && (
        <p className="chart-note">
          {currentHumidity != null
            ? "Monitoring records don't log historical humidity, so the dashed line shows the current humidity reading pulled from live weather data for this farm."
            : "Humidity trend isn't available — monitoring records don't log humidity and live weather data couldn't be retrieved for this farm."}
        </p>
      )}
    </div>
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
}) => (
  <div
    className={`dashboard-stat-card ${className}`}
  >
    <div className="dashboard-stat-icon">
      {icon}
    </div>

    <div className="dashboard-stat-info">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  </div>
);

const PanelHeader = ({
  title,
  subtitle,
  link,
  linkText,
  hideLink = false,
}) => (
  <div className="panel-header">
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
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

const HealthRow = ({
  label,
  value,
  count,
  className,
}) => (
  <div className="health-row">
    <div>
      <i className={`health-dot ${className}`} />
      <span>{label}</span>
    </div>

    <div className="health-row-values">
      <strong>{value}</strong>
      <small>{count}</small>
    </div>
  </div>
);

const FieldLegend = ({
  status,
  className,
}) => (
  <span>
    <i
      className={`field-legend-dot ${className}`}
    />
    {status}
  </span>
);

const DetectionMini = ({
  label,
  value,
  className,
}) => (
  <div className="detection-mini">
    <i
      className={`detection-mini-dot ${className}`}
    />
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const WeatherDetail = ({
  icon,
  label,
  value,
}) => (
  <div className="weather-detail">
    <span>{icon}</span>

    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  </div>
);

const DashboardLoading = () => (
  <div className="dashboard-loading">
    <div className="loading-spinner" />
    <span>
      Loading monitoring data...
    </span>
  </div>
);

const EmptyState = ({
  icon,
  title,
  text,
  link,
  linkText,
}) => (
  <div className="dashboard-empty">
    <div className="empty-icon">{icon}</div>
    <strong>{title}</strong>
    <span>{text}</span>

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

// =========================================================
// HELPERS
// =========================================================

function extractArray(response, keys) {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response) {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  return [];
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const now = new Date();

  const difference = Math.max(
    0,
    now.getTime() - date.getTime()
  );

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${
    days === 1 ? "" : "s"
  } ago`;
}

function getMoistureStatus(value) {
  const moisture = Number(value);

  if (!Number.isFinite(moisture)) {
    return "No reading";
  }

  if (moisture < 30) {
    return "Low moisture";
  }

  if (moisture < 45) {
    return "Monitor moisture";
  }

  return "Good moisture level";
}

function getTemperatureStatus(value) {
  const temperature = Number(value);

  if (!Number.isFinite(temperature)) {
    return "No reading";
  }

  if (temperature > 35) {
    return "Critical temperature";
  }

  if (temperature >= 30) {
    return "Elevated temperature";
  }

  return "Normal temperature";
}

function getSeverityClass(severity) {
  const value = String(
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

function getAlertIcon(type) {
  const value = String(
    type || ""
  ).toLowerCase();

  const iconProps = { size: 15, strokeWidth: 1.85 };

  if (
    value.includes("soil") ||
    value.includes("moisture")
  ) {
    return <Droplet {...iconProps} />;
  }

  if (value.includes("temperature")) {
    return <Thermometer {...iconProps} />;
  }

  if (value.includes("pest")) {
    return <Bug {...iconProps} />;
  }

  if (value.includes("disease")) {
    return <Microscope {...iconProps} />;
  }

  if (value.includes("discolor")) {
    return <Leaf {...iconProps} />;
  }

  return <AlertTriangle {...iconProps} />;
}

function getStatusClass(status) {
  const value = String(
    status || ""
  ).toLowerCase();

  if (value === "healthy" || value === "good") {
    return "status-good";
  }

  if (
    value === "needs attention" ||
    value === "watch"
  ) {
    return "status-warning";
  }

  if (value === "critical" || value === "alert") {
    return "status-critical";
  }

  if (value === "offline") {
    return "status-offline";
  }

  if (value === "harvested") {
    return "status-harvested";
  }

  return "status-warning";
}

function getFieldBlocks(crops) {
  return crops.slice(0, 9).map(
    (crop, index) => {
      const letter = String.fromCharCode(
        65 + index
      );

      return {
        id: crop.id,
        name:
          crop.crop_name ||
          `Block ${letter}`,
        variety: crop.variety,
        status:
          String(
            crop.status || "Healthy"
          ).toLowerCase() ===
          "needs attention"
            ? "Watch"
            : String(
                crop.status || "Healthy"
              ).toLowerCase() ===
              "critical"
            ? "Alert"
            : String(
                crop.status || "Healthy"
              ).toLowerCase() ===
              "harvested"
            ? "Harvested"
            : "Good",
      };
    }
  );
}

function getDetectionLabel(record) {
  if (record.disease_detected) {
    return "Alert";
  }

  if (
    record.pest_detected ||
    record.discoloration_detected
  ) {
    return "Watch";
  }

  return "Good";
}

function getDetectionTitle(record) {
  if (record.disease_detected) {
    return "Possible crop disease detected";
  }

  if (record.pest_detected) {
    return "Possible pest infestation detected";
  }

  if (record.discoloration_detected) {
    return "Possible crop discoloration detected";
  }

  if (
    String(
      record.plant_condition || ""
    ).toLowerCase() !== "healthy"
  ) {
    return `Plant condition: ${record.plant_condition}`;
  }

  return "No abnormal detection";
}

function getDetectionRecommendation(record) {
  if (record.disease_detected) {
    return "Review the affected crop and open the monitoring record for further assessment.";
  }

  if (record.pest_detected) {
    return "Inspect the plant for visible pests and monitor the affected area closely.";
  }

  if (record.discoloration_detected) {
    return "Inspect leaves and fruit for visible discoloration and record the next monitoring result.";
  }

  return "Continue regular monitoring and compare the latest readings with previous records.";
}

// =========================================================
// WEATHER API
// =========================================================

async function getWeather(latitude, longitude) {
  if (
    latitude === null ||
    longitude === null ||
    latitude === undefined ||
    longitude === undefined
  ) {
    throw new Error(
      "Farm coordinates are required."
    );
  }

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      latitude
    )}&longitude=${encodeURIComponent(
      longitude
    )}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`
  );

  if (!response.ok) {
    throw new Error(
      "Unable to retrieve weather."
    );
  }

  const data = await response.json();

  return {
    temperature:
      data.current?.temperature_2m ?? 0,
    humidity:
      data.current?.relative_humidity_2m ?? 0,
    rain:
      data.current?.precipitation ?? 0,
    weatherCode:
      data.current?.weather_code ?? 0,
    windSpeed:
      data.current?.wind_speed_10m ?? 0,
  };
}

function getWeatherIcon(code) {
  const iconProps = { size: 38, strokeWidth: 1.6 };

  if (code === 0) {
    return <Sun {...iconProps} />;
  }

  if (code === 1 || code === 2) {
    return <CloudSun {...iconProps} />;
  }

  if (code === 3) {
    return <Cloud {...iconProps} />;
  }

  if (code >= 45 && code <= 48) {
    return <CloudFog {...iconProps} />;
  }

  if (code >= 51 && code <= 67) {
    return code <= 57 ? (
      <CloudDrizzle {...iconProps} />
    ) : (
      <CloudRain {...iconProps} />
    );
  }

  if (code >= 71 && code <= 77) {
    return <CloudSnow {...iconProps} />;
  }

  if (code >= 80 && code <= 82) {
    return <CloudRain {...iconProps} />;
  }

  if (code >= 95) {
    return <CloudLightning {...iconProps} />;
  }

  return <CloudSun {...iconProps} />;
}

function getWeatherDescription(code) {
  if (code === 0) {
    return "Clear sky";
  }

  if (code === 1 || code === 2) {
    return "Partly cloudy";
  }

  if (code === 3) {
    return "Overcast";
  }

  if (code >= 45 && code <= 48) {
    return "Foggy";
  }

  if (code >= 51 && code <= 67) {
    return "Rain";
  }

  if (code >= 71 && code <= 77) {
    return "Snow";
  }

  if (code >= 80 && code <= 82) {
    return "Rain showers";
  }

  if (code >= 95) {
    return "Thunderstorm";
  }

  return "Variable conditions";
}

export default Dashboard;