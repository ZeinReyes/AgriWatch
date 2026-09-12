import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(decimals);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
};

const getConditionClass = (condition) => {
  if (condition === "Critical") {
    return "critical";
  }

  if (condition === "Needs Attention") {
    return "warning";
  }

  return "healthy";
};

const getSeverityClass = (severity) => {
  if (String(severity).toLowerCase() === "critical") {
    return "critical";
  }

  if (String(severity).toLowerCase() === "warning") {
    return "warning";
  }

  return "info";
};

const downloadCsv = (report) => {
  const summary = report?.summary || {};
  const recentMonitoring = report?.recent_monitoring || [];
  const recentAlerts = report?.recent_alerts || [];

  const rows = [
    ["AgriWatch Report"],
    ["Generated At", report?.generated_at || ""],
    [],
    ["SUMMARY"],
    ["Farms", summary.farms ?? ""],
    ["Crops", summary.crops ?? ""],
    [
      "Crops With Monitoring",
      summary.crops_with_monitoring ?? ""
    ],
    ["Healthy Crops", summary.healthy_crops ?? ""],
    [
      "Needs Attention Crops",
      summary.needs_attention_crops ?? ""
    ],
    ["Critical Crops", summary.critical_crops ?? ""],
    [
      "Crop Health Percentage",
      summary.crop_health_percentage ?? ""
    ],
    [
      "Monitoring Records",
      summary.monitoring_records ?? ""
    ],
    ["Alerts", summary.alerts ?? ""],
    [
      "Unresolved Alerts",
      summary.unresolved_alerts ?? ""
    ],
    [
      "Critical Alerts",
      summary.critical_alerts ?? ""
    ],
    [
      "Average Soil Moisture",
      summary.average_moisture ?? ""
    ],
    [
      "Average Crop Temperature",
      summary.average_temperature ?? ""
    ],
    [
      "Low Moisture Detections",
      summary.low_moisture_count ?? ""
    ],
    [
      "High Temperature Detections",
      summary.high_temperature_count ?? ""
    ],
    ["Pest Detections", summary.pest_count ?? ""],
    ["Disease Detections", summary.disease_count ?? ""],
    [
      "Discoloration Detections",
      summary.discoloration_count ?? ""
    ],
    [],
    ["RECENT MONITORING"],
    [
      "Crop",
      "Farm",
      "Soil Moisture",
      "Crop Temperature",
      "Pest",
      "Disease",
      "Discoloration",
      "Plant Condition",
      "Recorded At"
    ]
  ];

  recentMonitoring.forEach((record) => {
    rows.push([
      record.crop_name || "",
      record.farm_name || "",
      record.soil_moisture ?? "",
      record.crop_temperature ?? "",
      record.pest_detected ? "Yes" : "No",
      record.disease_detected ? "Yes" : "No",
      record.discoloration_detected ? "Yes" : "No",
      record.plant_condition || "",
      record.recorded_at || ""
    ]);
  });

  rows.push([]);
  rows.push(["RECENT ALERTS"]);
  rows.push([
    "Crop",
    "Farm",
    "Alert Type",
    "Severity",
    "Message",
    "Resolved",
    "Created At"
  ]);

  recentAlerts.forEach((alert) => {
    rows.push([
      alert.crop_name || "",
      alert.farm_name || "",
      alert.alert_type || "",
      alert.severity || "",
      alert.message || "",
      alert.is_resolved ? "Yes" : "No",
      alert.created_at || ""
    ]);
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `agriwatch-report-${
    new Date().toISOString().slice(0, 10)
  }.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export default function Reports() {
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/reports/summary");

      setReport(response.data);
    } catch (err) {
      console.error("Failed to load report:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to load report data.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const summary = report?.summary || {};

  const alertBreakdown = report?.alert_breakdown || [];
  const recentMonitoring = report?.recent_monitoring || [];
  const recentAlerts = report?.recent_alerts || [];

  const healthPercentage = Number(
    summary.crop_health_percentage || 0
  );

  const healthLabel = useMemo(() => {
    if (healthPercentage >= 80) {
      return "Good";
    }

    if (healthPercentage >= 50) {
      return "Needs Attention";
    }

    if (healthPercentage > 0) {
      return "Critical";
    }

    return "No Data";
  }, [healthPercentage]);

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <p className="reports-eyebrow">AGRIWATCH</p>
            <h1>Reports</h1>
            <p>
              Review farm, crop, monitoring, and alert
              information.
            </p>
          </div>
        </div>

        <div className="reports-loading">
          <div className="reports-spinner" />
          <p>Generating report...</p>
        </div>

        <ReportsStyles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <p className="reports-eyebrow">AGRIWATCH</p>
            <h1>Reports</h1>
            <p>
              Review farm, crop, monitoring, and alert
              information.
            </p>
          </div>
        </div>

        <div className="reports-error">
          <div className="reports-error-icon">!</div>

          <div>
            <h3>Unable to load reports</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={loadReport}
              className="reports-retry-button"
            >
              Try Again
            </button>
          </div>
        </div>

        <ReportsStyles />
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="reports-header">
        <div>
          <p className="reports-eyebrow">AGRIWATCH</p>

          <h1>Reports</h1>

          <p>
            Review farm, crop, monitoring, and alert
            information.
          </p>

          {user?.role === "viewer" && (
            <span className="viewer-badge">
              View Only
            </span>
          )}
        </div>

        <div className="reports-header-actions">
          <span className="generated-date">
            Generated{" "}
            {formatDateTime(report?.generated_at)}
          </span>

          <button
            type="button"
            className="download-button"
            onClick={() => downloadCsv(report)}
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Overview</h2>
            <p>
              Summary of currently stored AgriWatch data.
            </p>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-icon">🌱</span>

            <div>
              <span className="summary-label">Farms</span>
              <strong>{summary.farms ?? 0}</strong>
            </div>
          </div>

          <div className="summary-card">
            <span className="summary-icon">🍅</span>

            <div>
              <span className="summary-label">Crops</span>
              <strong>{summary.crops ?? 0}</strong>
            </div>
          </div>

          <div className="summary-card">
            <span className="summary-icon">◉</span>

            <div>
              <span className="summary-label">
                Monitoring Records
              </span>
              <strong>
                {summary.monitoring_records ?? 0}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <span className="summary-icon">⚠</span>

            <div>
              <span className="summary-label">
                Total Alerts
              </span>
              <strong>{summary.alerts ?? 0}</strong>
            </div>
          </div>

          <div className="summary-card">
            <span className="summary-icon">!</span>

            <div>
              <span className="summary-label">
                Unresolved Alerts
              </span>
              <strong>
                {summary.unresolved_alerts ?? 0}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <span className="summary-icon">✓</span>

            <div>
              <span className="summary-label">
                Crop Health
              </span>
              <strong>
                {formatNumber(
                  summary.crop_health_percentage
                )}
                %
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CROP HEALTH
      ===================================================== */}

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Crop Health</h2>
            <p>
              Health classification based on the latest
              monitoring record for each crop.
            </p>
          </div>
        </div>

        <div className="health-layout">
          <div className="health-card">
            <div className="health-circle">
              <span>{formatNumber(healthPercentage)}%</span>
              <small>Healthy</small>
            </div>

            <div className="health-info">
              <span className="health-status">
                {healthLabel}
              </span>

              <p>
                {summary.crops_with_monitoring ?? 0} of{" "}
                {summary.crops ?? 0} crops have monitoring
                records.
              </p>
            </div>
          </div>

          <div className="condition-grid">
            <div className="condition-card healthy">
              <span>Healthy</span>
              <strong>
                {summary.healthy_crops ?? 0}
              </strong>
            </div>

            <div className="condition-card warning">
              <span>Needs Attention</span>
              <strong>
                {summary.needs_attention_crops ?? 0}
              </strong>
            </div>

            <div className="condition-card critical">
              <span>Critical</span>
              <strong>
                {summary.critical_crops ?? 0}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MONITORING STATISTICS
      ===================================================== */}

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Monitoring Statistics</h2>
            <p>
              Recorded environmental and crop-condition
              measurements.
            </p>
          </div>
        </div>

        <div className="monitoring-stat-grid">
          <div className="monitoring-stat-card">
            <span>Average Soil Moisture</span>

            <strong>
              {formatNumber(
                summary.average_moisture,
                1
              )}
              {summary.average_moisture !== null
                ? "%"
                : ""}
            </strong>

            <small>
              Threshold: below 30%
            </small>
          </div>

          <div className="monitoring-stat-card">
            <span>Average Crop Temperature</span>

            <strong>
              {formatNumber(
                summary.average_temperature,
                1
              )}
              {summary.average_temperature !== null
                ? "°C"
                : ""}
            </strong>

            <small>
              Threshold: above 35°C
            </small>
          </div>

          <div className="monitoring-stat-card">
            <span>Low Moisture Detections</span>

            <strong>
              {summary.low_moisture_count ?? 0}
            </strong>
          </div>

          <div className="monitoring-stat-card">
            <span>High Temperature Detections</span>

            <strong>
              {summary.high_temperature_count ?? 0}
            </strong>
          </div>

          <div className="monitoring-stat-card">
            <span>Pest Detections</span>

            <strong>
              {summary.pest_count ?? 0}
            </strong>
          </div>

          <div className="monitoring-stat-card">
            <span>Disease Detections</span>

            <strong>
              {summary.disease_count ?? 0}
            </strong>
          </div>

          <div className="monitoring-stat-card">
            <span>Discoloration Detections</span>

            <strong>
              {summary.discoloration_count ?? 0}
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          ALERT BREAKDOWN
      ===================================================== */}

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Alert Breakdown</h2>
            <p>
              Distribution of alerts recorded by the system.
            </p>
          </div>
        </div>

        {alertBreakdown.length === 0 ? (
          <div className="empty-report-card">
            <span>✓</span>
            <h3>No alerts recorded</h3>
            <p>
              There are currently no alerts in the report
              data.
            </p>
          </div>
        ) : (
          <div className="alert-breakdown-list">
            {alertBreakdown.map((item) => (
              <div
                className="alert-breakdown-item"
                key={item.alert_type}
              >
                <span>{item.alert_type}</span>

                <div className="alert-breakdown-bar">
                  <div
                    style={{
                      width: `${
                        summary.alerts
                          ? (item.count /
                              summary.alerts) *
                            100
                          : 0
                      }%`
                    }}
                  />
                </div>

                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          RECENT MONITORING
      ===================================================== */}

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Recent Monitoring</h2>
            <p>
              The latest recorded monitoring observations.
            </p>
          </div>
        </div>

        {recentMonitoring.length === 0 ? (
          <div className="empty-report-card">
            <span>◉</span>
            <h3>No monitoring records</h3>
            <p>
              Monitoring data will appear here once records
              are available.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Farm</th>
                  <th>Moisture</th>
                  <th>Temperature</th>
                  <th>Condition</th>
                  <th>Recorded</th>
                </tr>
              </thead>

              <tbody>
                {recentMonitoring.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>
                        {record.crop_name || "—"}
                      </strong>
                    </td>

                    <td>
                      {record.farm_name || "—"}
                    </td>

                    <td>
                      {record.soil_moisture !== null &&
                      record.soil_moisture !== undefined
                        ? `${formatNumber(
                            record.soil_moisture,
                            1
                          )}%`
                        : "—"}
                    </td>

                    <td>
                      {record.crop_temperature !== null &&
                      record.crop_temperature !==
                        undefined
                        ? `${formatNumber(
                            record.crop_temperature,
                            1
                          )}°C`
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`condition-badge ${getConditionClass(
                          record.plant_condition
                        )}`}
                      >
                        {record.plant_condition ||
                          "Healthy"}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        record.recorded_at
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          RECENT ALERTS
      ===================================================== */}

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Recent Alerts</h2>
            <p>
              Latest alerts generated by crop monitoring.
            </p>
          </div>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="empty-report-card">
            <span>✓</span>
            <h3>No recent alerts</h3>
            <p>
              No alert records are currently available.
            </p>
          </div>
        ) : (
          <div className="alerts-report-list">
            {recentAlerts.map((alert) => (
              <div
                className="report-alert-card"
                key={alert.id}
              >
                <div className="report-alert-main">
                  <div className="report-alert-title">
                    <strong>
                      {alert.alert_type}
                    </strong>

                    <span
                      className={`severity-badge ${getSeverityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p>{alert.message}</p>

                  <span className="report-alert-meta">
                    {alert.crop_name || "Unknown crop"}
                    {" • "}
                    {alert.farm_name || "Unknown farm"}
                    {" • "}
                    {formatDateTime(
                      alert.created_at
                    )}
                  </span>
                </div>

                <span
                  className={`resolution-badge ${
                    alert.is_resolved
                      ? "resolved"
                      : "unresolved"
                  }`}
                >
                  {alert.is_resolved
                    ? "Resolved"
                    : "Unresolved"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ReportsStyles />
    </div>
  );
}


/* =========================================================
   STYLES
========================================================= */

function ReportsStyles() {
  return (
    <style>{`
      .reports-page {
        padding: 30px;
        color: #18392b;
      }

      .reports-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 30px;
      }

      .reports-eyebrow {
        margin: 0 0 6px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: #4d8066;
      }

      .reports-header h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
      }

      .reports-header p {
        margin: 8px 0 0;
        color: #718278;
        font-size: 14px;
      }

      .reports-header-actions {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      .generated-date {
        color: #718278;
        font-size: 12px;
      }

      .download-button,
      .reports-retry-button {
        border: none;
        background: #276749;
        color: white;
        padding: 11px 16px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
      }

      .download-button:hover,
      .reports-retry-button:hover {
        background: #1f573d;
      }

      .viewer-badge {
        display: inline-block;
        margin-top: 12px;
        padding: 5px 10px;
        border-radius: 999px;
        background: #eef5f0;
        color: #3d7658;
        font-size: 12px;
        font-weight: 600;
      }

      .report-section {
        margin-bottom: 30px;
      }

      .section-heading {
        margin-bottom: 15px;
      }

      .section-heading h2 {
        margin: 0;
        font-size: 19px;
      }

      .section-heading p {
        margin: 5px 0 0;
        color: #7b887f;
        font-size: 13px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(180px, 1fr)
        );
        gap: 14px;
      }

      .summary-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 19px;
        background: white;
        border: 1px solid #e7ece8;
        border-radius: 15px;
        box-shadow: 0 3px 14px rgba(27, 64, 45, 0.04);
      }

      .summary-icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: #eef6f0;
        font-size: 18px;
      }

      .summary-label {
        display: block;
        margin-bottom: 4px;
        color: #7a887f;
        font-size: 12px;
      }

      .summary-card strong {
        display: block;
        font-size: 23px;
      }

      .health-layout {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 16px;
      }

      .health-card,
      .condition-card,
      .monitoring-stat-card,
      .empty-report-card,
      .alert-breakdown-list,
      .table-wrapper,
      .alerts-report-list {
        background: white;
        border: 1px solid #e7ece8;
        border-radius: 15px;
        box-shadow: 0 3px 14px rgba(27, 64, 45, 0.04);
      }

      .health-card {
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .health-circle {
        width: 125px;
        height: 125px;
        min-width: 125px;
        border-radius: 50%;
        border: 10px solid #dceee1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .health-circle span {
        font-size: 25px;
        font-weight: 700;
      }

      .health-circle small {
        color: #7a887f;
        font-size: 11px;
      }

      .health-status {
        font-size: 20px;
        font-weight: 700;
      }

      .health-info p {
        color: #7a887f;
        font-size: 13px;
        line-height: 1.5;
      }

      .condition-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }

      .condition-card {
        padding: 22px;
      }

      .condition-card span {
        display: block;
        font-size: 13px;
        color: #718078;
        margin-bottom: 8px;
      }

      .condition-card strong {
        font-size: 28px;
      }

      .condition-card.healthy {
        border-left: 4px solid #4d9568;
      }

      .condition-card.warning {
        border-left: 4px solid #d69e2e;
      }

      .condition-card.critical {
        border-left: 4px solid #d9534f;
      }

      .monitoring-stat-grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(180px, 1fr)
        );
        gap: 14px;
      }

      .monitoring-stat-card {
        padding: 20px;
      }

      .monitoring-stat-card span {
        display: block;
        color: #718078;
        font-size: 12px;
        margin-bottom: 9px;
      }

      .monitoring-stat-card strong {
        display: block;
        font-size: 25px;
      }

      .monitoring-stat-card small {
        display: block;
        margin-top: 7px;
        color: #98a39c;
        font-size: 11px;
      }

      .alert-breakdown-list {
        padding: 20px;
      }

      .alert-breakdown-item {
        display: grid;
        grid-template-columns: 180px 1fr 40px;
        align-items: center;
        gap: 15px;
        padding: 10px 0;
      }

      .alert-breakdown-item > span {
        font-size: 13px;
      }

      .alert-breakdown-bar {
        height: 8px;
        background: #edf1ee;
        border-radius: 99px;
        overflow: hidden;
      }

      .alert-breakdown-bar div {
        height: 100%;
        background: #4d8066;
        border-radius: inherit;
      }

      .alert-breakdown-item strong {
        text-align: right;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .reports-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 750px;
      }

      .reports-table th,
      .reports-table td {
        padding: 14px 16px;
        text-align: left;
        border-bottom: 1px solid #edf0ed;
        font-size: 12px;
      }

      .reports-table th {
        background: #f8faf8;
        color: #6f7e75;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .reports-table tr:last-child td {
        border-bottom: none;
      }

      .condition-badge,
      .severity-badge,
      .resolution-badge {
        display: inline-flex;
        align-items: center;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
      }

      .condition-badge.healthy {
        background: #eaf5ed;
        color: #3f7d55;
      }

      .condition-badge.warning,
      .severity-badge.warning {
        background: #fff5df;
        color: #9a6a15;
      }

      .condition-badge.critical,
      .severity-badge.critical {
        background: #fdebea;
        color: #b8423e;
      }

      .severity-badge.info {
        background: #edf4f1;
        color: #4a7562;
      }

      .alerts-report-list {
        overflow: hidden;
      }

      .report-alert-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 18px 20px;
        border-bottom: 1px solid #edf0ed;
      }

      .report-alert-card:last-child {
        border-bottom: none;
      }

      .report-alert-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 7px;
      }

      .report-alert-title strong {
        font-size: 14px;
      }

      .report-alert-main p {
        margin: 0 0 7px;
        color: #59675f;
        font-size: 13px;
      }

      .report-alert-meta {
        color: #98a39c;
        font-size: 11px;
      }

      .resolution-badge.resolved {
        background: #eaf5ed;
        color: #3f7d55;
      }

      .resolution-badge.unresolved {
        background: #fff5df;
        color: #9a6a15;
      }

      .empty-report-card {
        padding: 35px;
        text-align: center;
      }

      .empty-report-card > span {
        display: block;
        font-size: 28px;
        margin-bottom: 10px;
      }

      .empty-report-card h3 {
        margin: 0 0 6px;
        font-size: 16px;
      }

      .empty-report-card p {
        margin: 0;
        color: #7b887f;
        font-size: 13px;
      }

      .reports-loading {
        min-height: 300px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #718078;
      }

      .reports-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #dce8df;
        border-top-color: #3f7658;
        border-radius: 50%;
        animation: reports-spin 0.8s linear infinite;
        margin-bottom: 12px;
      }

      @keyframes reports-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .reports-error {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        padding: 22px;
        background: #fffafa;
        border: 1px solid #f1d8d7;
        border-radius: 15px;
      }

      .reports-error-icon {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fdebea;
        color: #b8423e;
        border-radius: 50%;
        font-weight: 700;
      }

      .reports-error h3 {
        margin: 0 0 5px;
      }

      .reports-error p {
        margin: 0 0 15px;
        color: #7d6968;
        font-size: 13px;
      }

      @media (max-width: 900px) {
        .health-layout {
          grid-template-columns: 1fr;
        }

        .reports-header {
          flex-direction: column;
        }
      }

      @media (max-width: 600px) {
        .reports-page {
          padding: 20px 15px;
        }

        .condition-grid {
          grid-template-columns: 1fr;
        }

        .health-card {
          flex-direction: column;
          text-align: center;
        }

        .alert-breakdown-item {
          grid-template-columns: 1fr 50px;
        }

        .alert-breakdown-bar {
          grid-column: 1 / 2;
        }

        .alert-breakdown-item strong {
          grid-column: 2;
          grid-row: 1;
        }

        .report-alert-card {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `}</style>
  );
}