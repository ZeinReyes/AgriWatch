import {
  useEffect,
  useState,
} from "react";

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

      setReport(response.data);

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


  return (

    <DashboardLayout>

      <div className="reports-page">

        <div className="reports-header">

          <div>

            <span className="reports-eyebrow">
              FARM REPORTS
            </span>

            <h1>
              Reports
            </h1>

            <p>
              View summarized crop monitoring,
              sensor, and alert information.
            </p>

          </div>


          <div className="reports-header-actions">

            {isViewer && (
              <span className="reports-view-only">
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
              Export CSV
            </button>

          </div>

        </div>


        {loading && (

          <div className="reports-state-card">

            <div className="reports-spinner"></div>

            <h3>
              Loading reports
            </h3>

            <p>
              Preparing your farm report.
            </p>

          </div>

        )}


        {!loading && error && (

          <div className="reports-state-card reports-error">

            <div className="reports-state-icon">
              !
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
              Try Again
            </button>

          </div>

        )}


        {!loading &&
          !error &&
          report && (

            <>

              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <h2>
                      Overview
                    </h2>

                    <p>
                      Current summary of your
                      farm monitoring data.
                    </p>

                  </div>

                </div>


                <div className="reports-overview-grid">

                  <div className="report-stat-card">

                    <span>
                      Farms
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary?.farms
                      )}
                    </strong>

                  </div>


                  <div className="report-stat-card">

                    <span>
                      Crops
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary?.crops
                      )}
                    </strong>

                  </div>


                  <div className="report-stat-card">

                    <span>
                      Crop Health
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.crop_health_percentage,
                        "%"
                      )}
                    </strong>

                  </div>


                  <div className="report-stat-card">

                    <span>
                      Monitoring Records
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.monitoring_records
                      )}
                    </strong>

                  </div>


                  <div className="report-stat-card">

                    <span>
                      Total Alerts
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary?.alerts
                      )}
                    </strong>

                  </div>


                  <div className="report-stat-card">

                    <span>
                      Unresolved Alerts
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.unresolved_alerts
                      )}
                    </strong>

                  </div>

                </div>

              </section>


              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <h2>
                      Crop Health
                    </h2>

                    <p>
                      Latest condition recorded
                      for each monitored crop.
                    </p>

                  </div>

                </div>


                <div className="crop-health-grid">

                  <div className="health-card healthy">

                    <span>
                      Healthy
                    </span>

                    <strong>
                      {
                        report.summary
                          ?.healthy_crops ?? 0
                      }
                    </strong>

                  </div>


                  <div className="health-card attention">

                    <span>
                      Needs Attention
                    </span>

                    <strong>
                      {
                        report.summary
                          ?.needs_attention_crops ?? 0
                      }
                    </strong>

                  </div>


                  <div className="health-card critical">

                    <span>
                      Critical
                    </span>

                    <strong>
                      {
                        report.summary
                          ?.critical_crops ?? 0
                      }
                    </strong>

                  </div>


                  <div className="health-card monitored">

                    <span>
                      With Monitoring
                    </span>

                    <strong>
                      {
                        report.summary
                          ?.crops_with_monitoring ?? 0
                      }
                    </strong>

                  </div>

                </div>

              </section>


              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <h2>
                      Monitoring Statistics
                    </h2>

                    <p>
                      Recorded environmental and
                      crop condition measurements.
                    </p>

                  </div>

                </div>


                <div className="monitoring-stat-grid">

                  <div className="monitoring-stat-card">

                    <span>
                      Average Soil Moisture
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.average_moisture,
                        "%"
                      )}
                    </strong>

                  </div>


                  <div className="monitoring-stat-card">

                    <span>
                      Average Crop Temperature
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.average_temperature,
                        "°C"
                      )}
                    </strong>

                  </div>


                  <div className="monitoring-stat-card">

                    <span>
                      Low Moisture Records
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.low_moisture_count
                      )}
                    </strong>

                  </div>


                  <div className="monitoring-stat-card">

                    <span>
                      High Temperature Records
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.high_temperature_count
                      )}
                    </strong>

                  </div>


                  <div className="monitoring-stat-card">

                    <span>
                      Pest Detections
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.pest_count
                      )}
                    </strong>

                  </div>


                  <div className="monitoring-stat-card">

                    <span>
                      Disease Detections
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.disease_count
                      )}
                    </strong>

                  </div>


                  <div className="monitoring-stat-card">

                    <span>
                      Discoloration Records
                    </span>

                    <strong>
                      {formatNumber(
                        report.summary
                          ?.discoloration_count
                      )}
                    </strong>

                  </div>

                </div>

              </section>


              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <h2>
                      Alert Breakdown
                    </h2>

                    <p>
                      Distribution of generated
                      monitoring alerts.
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

                          <div>

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
                      No alerts recorded.
                    </div>

                  )}

                </div>

              </section>


              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <h2>
                      Recent Monitoring
                    </h2>

                    <p>
                      Latest monitoring records
                      from your crops.
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
                              Moisture
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
                                  {record.crop_name ||
                                    "—"}
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
                      No monitoring records available.
                    </div>

                  )}

                </div>

              </section>


              <section className="reports-section">

                <div className="reports-section-header">

                  <div>

                    <h2>
                      Recent Alerts
                    </h2>

                    <p>
                      Latest alerts generated by
                      crop monitoring.
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

                                    <strong>
                                      {alert.alert_type}
                                    </strong>

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
                      No alerts available.
                    </div>

                  )}

                </div>

              </section>


              <div className="reports-generated">

                Report generated:
                {" "}
                {formatDate(
                  report.generated_at
                )}

              </div>

            </>

          )}

      </div>

    </DashboardLayout>

  );
};


export default Reports;