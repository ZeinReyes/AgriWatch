import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Cloud,
  Download,
  Droplets,
  FileBarChart,
  Leaf,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Wheat,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

import "./Reports.css";


const Reports = () => {

  const [
    report,
    setReport
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  const user =
    JSON.parse(
      localStorage.getItem(
        "agriwatch_user"
      ) || "null"
    );


  const role =
    user?.role;


  const isViewer =
    role === "viewer";


  useEffect(() => {
    loadReports();
  }, []);


  const loadReports = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/reports/summary"
        );

      setReport(
        response.data
      );

    } catch (err) {

      console.error(
        "Failed to load reports:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load reports."
      );

    } finally {

      setLoading(false);

    }
  };


  const formatNumber = (
    value,
    suffix = ""
  ) => {

    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return `${value}${suffix}`;
  };


  const formatDate = (
    value
  ) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleString(
      "en-PH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };


  const exportCsv = () => {

    if (!report) {
      return;
    }


    const summary =
      report.summary || {};


    const rows = [
      [
        "Metric",
        "Value",
      ],

      [
        "Farms",
        summary.farms ?? "",
      ],

      [
        "Crops",
        summary.crops ?? "",
      ],

      [
        "Crops With Monitoring",
        summary.crops_with_monitoring ?? "",
      ],

      [
        "Healthy Crops",
        summary.healthy_crops ?? "",
      ],

      [
        "Needs Attention Crops",
        summary.needs_attention_crops ?? "",
      ],

      [
        "Critical Crops",
        summary.critical_crops ?? "",
      ],

      [
        "Crop Health Percentage",
        summary.crop_health_percentage ?? "",
      ],

      [
        "Monitoring Records",
        summary.monitoring_records ?? "",
      ],

      [
        "Total Alerts",
        summary.alerts ?? "",
      ],

      [
        "Unresolved Alerts",
        summary.unresolved_alerts ?? "",
      ],

      [
        "Critical Alerts",
        summary.critical_alerts ?? "",
      ],

      [
        "Low Moisture Count",
        summary.low_moisture_count ?? "",
      ],

      [
        "High Temperature Count",
        summary.high_temperature_count ?? "",
      ],

      [
        "Pest Count",
        summary.pest_count ?? "",
      ],

      [
        "Disease Count",
        summary.disease_count ?? "",
      ],

      [
        "Discoloration Count",
        summary.discoloration_count ?? "",
      ],

      [
        "Average Moisture",
        summary.average_moisture ?? "",
      ],

      [
        "Average Temperature",
        summary.average_temperature ?? "",
      ],
    ];


    const csv =
      rows
        .map((row) =>
          row
            .map((value) => {

              const stringValue =
                String(value);

              return `"${stringValue.replace(
                /"/g,
                '""'
              )}"`;

            })
            .join(",")
        )
        .join("\n");


    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href = url;

    link.download =
      `agriwatch-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;


    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  };


  const summary =
    report?.summary || {};


  const overviewCards = [
    {
      label: "Farms",
      value: formatNumber(
        summary.farms
      ),
      icon: Wheat,
      className: "green",
    },

    {
      label: "Crops",
      value: formatNumber(
        summary.crops
      ),
      icon: Leaf,
      className: "green",
    },

    {
      label: "Crop Health",
      value: formatNumber(
        summary.crop_health_percentage,
        "%"
      ),
      icon: CheckCircle2,
      className: "success",
    },

    {
      label: "Monitoring Records",
      value: formatNumber(
        summary.monitoring_records
      ),
      icon: Activity,
      className: "blue",
    },

    {
      label: "Total Alerts",
      value: formatNumber(
        summary.alerts
      ),
      icon: AlertTriangle,
      className: "warning",
    },

    {
      label: "Unresolved Alerts",
      value: formatNumber(
        summary.unresolved_alerts
      ),
      icon: ShieldAlert,
      className: "danger",
    },
  ];


  const monitoringCards = [
    {
      label: "Average Soil Moisture",
      value: formatNumber(
        summary.average_moisture,
        "%"
      ),
      icon: Droplets,
    },

    {
      label: "Average Crop Temperature",
      value: formatNumber(
        summary.average_temperature,
        "°C"
      ),
      icon: Thermometer,
    },

    {
      label: "Low Moisture Records",
      value: formatNumber(
        summary.low_moisture_count
      ),
      icon: Droplets,
    },

    {
      label: "High Temperature Records",
      value: formatNumber(
        summary.high_temperature_count
      ),
      icon: Thermometer,
    },

    {
      label: "Pest Detections",
      value: formatNumber(
        summary.pest_count
      ),
      icon: CircleAlert,
    },

    {
      label: "Disease Detections",
      value: formatNumber(
        summary.disease_count
      ),
      icon: ShieldAlert,
    },

    {
      label: "Discoloration Records",
      value: formatNumber(
        summary.discoloration_count
      ),
      icon: Leaf,
    },
  ];


  return (

    <DashboardLayout>

      <div className="reports-page">

        {/* =========================================
            PAGE HEADER
        ========================================== */}

        <div className="reports-header">

          <div className="reports-header-content">

            <div className="reports-title-icon">

              <FileBarChart
                size={20}
                strokeWidth={2}
              />

            </div>


            <div>

              <span className="reports-eyebrow">
                ANALYTICS & REPORTING
              </span>

              <h1>
                Reports
              </h1>

              <p>
                Review summarized crop monitoring,
                environmental measurements, and
                alert activity across your farm.
              </p>

            </div>

          </div>


          <div className="reports-header-actions">

            {isViewer && (

              <span className="reports-view-only">

                <BarChart3
                  size={14}
                  strokeWidth={2}
                />

                View Only

              </span>

            )}


            <button
              type="button"
              className="reports-export-button"
              onClick={exportCsv}
              disabled={
                loading ||
                !report
              }
            >

              <Download
                size={16}
                strokeWidth={2}
              />

              Export CSV

            </button>

          </div>

        </div>


        {/* =========================================
            LOADING
        ========================================== */}

        {loading && (

          <div className="reports-state-card">

            <div className="reports-spinner"></div>

            <div className="reports-state-icon">

              <FileBarChart
                size={22}
                strokeWidth={2}
              />

            </div>

            <h3>
              Loading report
            </h3>

            <p>
              Preparing your latest monitoring summary.
            </p>

          </div>

        )}


        {/* =========================================
            ERROR
        ========================================== */}

        {!loading && error && (

          <div className="reports-state-card reports-error">

            <div className="reports-state-icon reports-state-icon-error">

              <AlertTriangle
                size={22}
                strokeWidth={2}
              />

            </div>

            <h3>
              Reports unavailable
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="reports-retry-button"
              onClick={loadReports}
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
            REPORT CONTENT
        ========================================== */}

        {!loading &&
          !error &&
          report && (

            <>

              {/* =========================================
                  OVERVIEW
              ========================================== */}

              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <span className="reports-section-label">
                      SNAPSHOT
                    </span>

                    <h2>
                      Overview
                    </h2>

                    <p>
                      A high-level view of the current
                      farm monitoring environment.
                    </p>

                  </div>

                </div>


                <div className="reports-overview-grid">

                  {overviewCards.map(
                    (card) => {

                      const Icon =
                        card.icon;


                      return (

                        <div
                          className="report-stat-card"
                          key={card.label}
                        >

                          <div className="report-stat-top">

                            <span>
                              {card.label}
                            </span>


                            <div
                              className={`report-stat-icon ${card.className}`}
                            >

                              <Icon
                                size={17}
                                strokeWidth={2}
                              />

                            </div>

                          </div>


                          <strong>
                            {card.value}
                          </strong>

                        </div>

                      );

                    }
                  )}

                </div>

              </section>


              {/* =========================================
                  CROP HEALTH
              ========================================== */}

              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <span className="reports-section-label">
                      CROP CONDITION
                    </span>

                    <h2>
                      Crop Health
                    </h2>

                    <p>
                      Latest recorded condition across
                      monitored crops.
                    </p>

                  </div>

                </div>


                <div className="crop-health-grid">

                  <div className="health-card healthy">

                    <div className="health-card-main">

                      <div className="health-icon">

                        <CheckCircle2
                          size={18}
                          strokeWidth={2}
                        />

                      </div>

                      <div>

                        <span>
                          Healthy
                        </span>

                        <small>
                          Stable condition
                        </small>

                      </div>

                    </div>


                    <strong>
                      {
                        summary.healthy_crops ??
                        0
                      }
                    </strong>

                  </div>


                  <div className="health-card attention">

                    <div className="health-card-main">

                      <div className="health-icon">

                        <CircleAlert
                          size={18}
                          strokeWidth={2}
                        />

                      </div>

                      <div>

                        <span>
                          Needs Attention
                        </span>

                        <small>
                          Requires review
                        </small>

                      </div>

                    </div>


                    <strong>
                      {
                        summary.needs_attention_crops ??
                        0
                      }
                    </strong>

                  </div>


                  <div className="health-card critical">

                    <div className="health-card-main">

                      <div className="health-icon">

                        <ShieldAlert
                          size={18}
                          strokeWidth={2}
                        />

                      </div>

                      <div>

                        <span>
                          Critical
                        </span>

                        <small>
                          Immediate attention
                        </small>

                      </div>

                    </div>


                    <strong>
                      {
                        summary.critical_crops ??
                        0
                      }
                    </strong>

                  </div>


                  <div className="health-card monitored">

                    <div className="health-card-main">

                      <div className="health-icon">

                        <Activity
                          size={18}
                          strokeWidth={2}
                        />

                      </div>

                      <div>

                        <span>
                          With Monitoring
                        </span>

                        <small>
                          Active data coverage
                        </small>

                      </div>

                    </div>


                    <strong>
                      {
                        summary.crops_with_monitoring ??
                        0
                      }
                    </strong>

                  </div>

                </div>

              </section>


              {/* =========================================
                  MONITORING STATISTICS
              ========================================== */}

              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <span className="reports-section-label">
                      ENVIRONMENTAL DATA
                    </span>

                    <h2>
                      Monitoring Statistics
                    </h2>

                    <p>
                      Recorded environmental and crop
                      condition measurements.
                    </p>

                  </div>

                </div>


                <div className="monitoring-stat-grid">

                  {monitoringCards.map(
                    (card) => {

                      const Icon =
                        card.icon;


                      return (

                        <div
                          className="monitoring-stat-card"
                          key={card.label}
                        >

                          <div className="monitoring-stat-icon">

                            <Icon
                              size={17}
                              strokeWidth={2}
                            />

                          </div>


                          <div>

                            <span>
                              {card.label}
                            </span>

                            <strong>
                              {card.value}
                            </strong>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </section>


              {/* =========================================
                  ALERT BREAKDOWN
              ========================================== */}

              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <span className="reports-section-label">
                      ALERT ANALYSIS
                    </span>

                    <h2>
                      Alert Breakdown
                    </h2>

                    <p>
                      Distribution of monitoring alerts
                      recorded by condition.
                    </p>

                  </div>

                </div>


                <div className="alert-breakdown-card">

                  {report.alert_breakdown?.length > 0 ? (

                    report.alert_breakdown.map(
                      (item) => (

                        <div
                          className="alert-breakdown-row"
                          key={item.alert_type}
                        >

                          <div className="alert-breakdown-name">

                            <div className="alert-breakdown-icon">

                              <AlertTriangle
                                size={15}
                                strokeWidth={2}
                              />

                            </div>

                            <span>
                              {item.alert_type}
                            </span>

                          </div>


                          <strong>
                            {item.count}
                          </strong>

                        </div>

                      )
                    )

                  ) : (

                    <div className="reports-empty">

                      <Cloud
                        size={19}
                        strokeWidth={1.8}
                      />

                      <span>
                        No alerts recorded.
                      </span>

                    </div>

                  )}

                </div>

              </section>


              {/* =========================================
                  RECENT MONITORING
              ========================================== */}

              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <span className="reports-section-label">
                      RECENT ACTIVITY
                    </span>

                    <h2>
                      Recent Monitoring
                    </h2>

                    <p>
                      Latest monitoring records from
                      the registered crops.
                    </p>

                  </div>

                </div>


                <div className="reports-table-card">

                  {report.recent_monitoring?.length > 0 ? (

                    <div className="reports-table-wrapper">

                      <table className="reports-table">

                        <thead>

                          <tr>

                            <th>
                              Crop
                            </th>

                            <th>
                              Farm
                            </th>

                            <th>
                              Soil Moisture
                            </th>

                            <th>
                              Temperature
                            </th>

                            <th>
                              Condition
                            </th>

                            <th>
                              Recorded
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {report.recent_monitoring.map(
                            (record) => (

                              <tr
                                key={record.id}
                              >

                                <td>

                                  <div className="table-primary">

                                    <Leaf
                                      size={14}
                                      strokeWidth={2}
                                    />

                                    <span>
                                      {record.crop_name ||
                                        "—"}
                                    </span>

                                  </div>

                                </td>


                                <td>
                                  {record.farm_name ||
                                    "—"}
                                </td>


                                <td>
                                  {formatNumber(
                                    record.soil_moisture,
                                    "%"
                                  )}
                                </td>


                                <td>
                                  {formatNumber(
                                    record.crop_temperature,
                                    "°C"
                                  )}
                                </td>


                                <td>

                                  <span
                                    className={
                                      `condition-badge condition-${(
                                        record.plant_condition ||
                                        "healthy"
                                      )
                                        .toLowerCase()
                                        .replace(
                                          /\s+/g,
                                          "-"
                                        )}`
                                    }
                                  >

                                    {
                                      record.plant_condition ||
                                      "Healthy"
                                    }

                                  </span>

                                </td>


                                <td>
                                  {formatDate(
                                    record.recorded_at
                                  )}
                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  ) : (

                    <div className="reports-empty">

                      <Activity
                        size={19}
                        strokeWidth={1.8}
                      />

                      <span>
                        No monitoring records available.
                      </span>

                    </div>

                  )}

                </div>

              </section>


              {/* =========================================
                  RECENT ALERTS
              ========================================== */}

              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <span className="reports-section-label">
                      ALERT ACTIVITY
                    </span>

                    <h2>
                      Recent Alerts
                    </h2>

                    <p>
                      Latest alerts generated by crop
                      monitoring activity.
                    </p>

                  </div>

                </div>


                <div className="reports-table-card">

                  {report.recent_alerts?.length > 0 ? (

                    <div className="reports-table-wrapper">

                      <table className="reports-table">

                        <thead>

                          <tr>

                            <th>
                              Alert
                            </th>

                            <th>
                              Crop
                            </th>

                            <th>
                              Severity
                            </th>

                            <th>
                              Status
                            </th>

                            <th>
                              Created
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {report.recent_alerts.map(
                            (alert) => (

                              <tr
                                key={alert.id}
                              >

                                <td>

                                  <div className="alert-cell">

                                    <div className="alert-cell-title">

                                      <AlertTriangle
                                        size={14}
                                        strokeWidth={2}
                                      />

                                      <strong>
                                        {alert.alert_type}
                                      </strong>

                                    </div>

                                    <span>
                                      {alert.message}
                                    </span>

                                  </div>

                                </td>


                                <td>
                                  {alert.crop_name ||
                                    "—"}
                                </td>


                                <td>

                                  <span
                                    className={
                                      `severity-badge severity-${(
                                        alert.severity ||
                                        "warning"
                                      ).toLowerCase()}`
                                    }
                                  >
                                    {
                                      alert.severity ||
                                      "Warning"
                                    }
                                  </span>

                                </td>


                                <td>

                                  <span
                                    className={
                                      alert.is_resolved
                                        ? "alert-status resolved"
                                        : "alert-status unresolved"
                                    }
                                  >

                                    {alert.is_resolved ? (

                                      <CheckCircle2
                                        size={13}
                                        strokeWidth={2}
                                      />

                                    ) : (

                                      <CircleAlert
                                        size={13}
                                        strokeWidth={2}
                                      />

                                    )}

                                    {
                                      alert.is_resolved
                                        ? "Resolved"
                                        : "Unresolved"
                                    }

                                  </span>

                                </td>


                                <td>
                                  {formatDate(
                                    alert.created_at
                                  )}
                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  ) : (

                    <div className="reports-empty">

                      <CheckCircle2
                        size={19}
                        strokeWidth={1.8}
                      />

                      <span>
                        No alerts available.
                      </span>

                    </div>

                  )}

                </div>

              </section>


              {/* =========================================
                  REPORT FOOTER
              ========================================== */}

              <div className="reports-generated">

                <div className="reports-generated-label">

                  <FileBarChart
                    size={13}
                    strokeWidth={2}
                  />

                  <span>
                    Report generated
                  </span>

                </div>


                <span>
                  {formatDate(
                    report.generated_at
                  )}
                </span>

              </div>

            </>

          )}

      </div>

    </DashboardLayout>

  );
};


export default Reports;