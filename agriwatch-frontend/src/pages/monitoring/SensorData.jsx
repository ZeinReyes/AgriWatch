import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import api from "../../services/api";

import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Droplets,
  RefreshCw,
  Search,
  Thermometer,
  Waves,
  Clock3,
} from "lucide-react";

import "./SensorData.css";


// =========================================================
// HELPERS
// =========================================================

const extractMonitoring = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  return (
    data?.monitoring ||
    data?.monitoring_records ||
    data?.records ||
    data?.data ||
    data?.results ||
    []
  );
};


const formatNumber = (value, decimals = 1) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(decimals);
};


const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};


const getMoistureStatus = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return {
      label: "No reading",
      className: "sensor-status neutral",
    };
  }

  if (number < 30) {
    return {
      label: "Low",
      className: "sensor-status warning",
    };
  }

  return {
    label: "Normal",
    className: "sensor-status good",
  };
};


const getTemperatureStatus = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return {
      label: "No reading",
      className: "sensor-status neutral",
    };
  }

  if (number > 35) {
    return {
      label: "High",
      className: "sensor-status critical",
    };
  }

  return {
    label: "Normal",
    className: "sensor-status good",
  };
};


// =========================================================
// SENSOR DATA
// =========================================================

const SensorData = () => {
  const [monitoringRecords, setMonitoringRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [cropFilter, setCropFilter] =
    useState("All");

  // =======================================================
  // LOAD DATA
  // =======================================================

  const loadMonitoring = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get(
          "/monitoring"
        );

      setMonitoringRecords(
        extractMonitoring(
          response.data
        )
      );

    } catch (err) {
      console.error(
        "Unable to load sensor data:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load sensor data. Please try again."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadMonitoring();
  }, []);


  // =======================================================
  // SORTED DATA
  // =======================================================

  const sortedRecords = useMemo(() => {
    return [...monitoringRecords].sort(
      (a, b) =>
        new Date(
          b.recorded_at
        ) -
        new Date(
          a.recorded_at
        )
    );
  }, [monitoringRecords]);


  // =======================================================
  // CROPS
  // =======================================================

  const cropOptions = useMemo(() => {
    const names =
      monitoringRecords
        .map(
          (record) =>
            record.crop_name
        )
        .filter(Boolean);

    return [
      ...new Set(names),
    ];
  }, [monitoringRecords]);


  // =======================================================
  // FILTERED DATA
  // =======================================================

  const filteredRecords = useMemo(() => {
    const searchValue =
      search
        .trim()
        .toLowerCase();

    return sortedRecords.filter(
      (record) => {
        const matchesSearch =
          !searchValue ||
          record.crop_name
            ?.toLowerCase()
            .includes(searchValue) ||
          record.farm_name
            ?.toLowerCase()
            .includes(searchValue);

        const matchesCrop =
          cropFilter === "All" ||
          record.crop_name === cropFilter;

        return (
          matchesSearch &&
          matchesCrop
        );
      }
    );
  }, [
    sortedRecords,
    search,
    cropFilter,
  ]);


  // =======================================================
  // LATEST RECORD
  // =======================================================

  const latestRecord =
    sortedRecords[0] || null;


  // =======================================================
  // SUMMARY VALUES
  // =======================================================

  const averageMoisture =
    monitoringRecords.length
      ? monitoringRecords.reduce(
          (sum, record) =>
            sum +
            (Number(
              record.soil_moisture
            ) || 0),
          0
        ) /
        monitoringRecords.filter(
          (record) =>
            record.soil_moisture !==
              null &&
            record.soil_moisture !==
              undefined
        ).length || 0
      : 0;


  const averageTemperature =
    monitoringRecords.filter(
      (record) =>
        record.crop_temperature !==
          null &&
        record.crop_temperature !==
          undefined
    ).length
      ? monitoringRecords.reduce(
          (sum, record) =>
            sum +
            (Number(
              record.crop_temperature
            ) || 0),
          0
        ) /
        monitoringRecords.filter(
          (record) =>
            record.crop_temperature !==
              null &&
            record.crop_temperature !==
              undefined
        ).length
      : 0;


  const lowMoistureReadings =
    monitoringRecords.filter(
      (record) =>
        Number(
          record.soil_moisture
        ) < 30
    ).length;


  const highTemperatureReadings =
    monitoringRecords.filter(
      (record) =>
        Number(
          record.crop_temperature
        ) > 35
    ).length;


  return (
    <DashboardLayout>

      <div className="sensor-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="sensor-page-header">

          <div>

            <span className="page-eyebrow">
              MONITORING
            </span>

            <h1>
              Sensor Data
            </h1>

            <p>
              Review environmental readings
              collected from your monitored
              tomato crops.
            </p>

          </div>

          <button
            type="button"
            className="sensor-refresh-button"
            onClick={() =>
              loadMonitoring(true)
            }
            disabled={
              loading ||
              refreshing
            }
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "sensor-spin"
                  : ""
              }
              aria-hidden="true"
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh data"}
            </span>

          </button>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="sensor-alert error">

            <CircleAlert
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="sensor-stat-grid">

          <div className="sensor-stat-card">

            <div className="sensor-stat-icon temperature">

              <Thermometer
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Latest Temperature
              </span>

              <strong>
                {latestRecord
                  ? `${formatNumber(
                      latestRecord.crop_temperature
                    )}°C`
                  : "—"}
              </strong>

              {latestRecord && (
                <small>
                  {
                    getTemperatureStatus(
                      latestRecord.crop_temperature
                    ).label
                  }
                </small>
              )}

            </div>

          </div>


          <div className="sensor-stat-card">

            <div className="sensor-stat-icon moisture">

              <Droplets
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Latest Soil Moisture
              </span>

              <strong>
                {latestRecord
                  ? `${formatNumber(
                      latestRecord.soil_moisture
                    )}%`
                  : "—"}
              </strong>

              {latestRecord && (
                <small>
                  {
                    getMoistureStatus(
                      latestRecord.soil_moisture
                    ).label
                  }
                </small>
              )}

            </div>

          </div>


          <div className="sensor-stat-card">

            <div className="sensor-stat-icon activity">

              <Activity
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Monitoring Records
              </span>

              <strong>
                {monitoringRecords.length}
              </strong>

              <small>
                Recorded observations
              </small>

            </div>

          </div>


          <div className="sensor-stat-card">

            <div className="sensor-stat-icon warning">

              <CircleAlert
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Readings Requiring Review
              </span>

              <strong>
                {
                  lowMoistureReadings +
                  highTemperatureReadings
                }
              </strong>

              <small>
                Low moisture / high temperature
              </small>

            </div>

          </div>

        </div>


        {/* =================================================
            LATEST READING
        ================================================= */}

        {!loading &&
          latestRecord && (

          <div className="sensor-latest-card">

            <div className="sensor-section-heading">

              <div>

                <div className="sensor-heading-title">

                  <Activity
                    size={19}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <h2>
                    Latest Reading
                  </h2>

                </div>

                <p>
                  Most recent monitoring
                  observation recorded by AgriWatch.
                </p>

              </div>

              <span className="sensor-record-time">

                <Clock3
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                {formatDateTime(
                  latestRecord.recorded_at
                )}

              </span>

            </div>


            <div className="sensor-latest-grid">

              <div className="sensor-reading-card">

                <div className="sensor-reading-icon">

                  <Thermometer
                    size={21}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                </div>

                <div>

                  <span>
                    Crop Temperature
                  </span>

                  <strong>
                    {formatNumber(
                      latestRecord.crop_temperature
                    )}°C
                  </strong>

                  <span
                    className={
                      getTemperatureStatus(
                        latestRecord.crop_temperature
                      ).className
                    }
                  >
                    {
                      getTemperatureStatus(
                        latestRecord.crop_temperature
                      ).label
                    }
                  </span>

                </div>

              </div>


              <div className="sensor-reading-card">

                <div className="sensor-reading-icon">

                  <Droplets
                    size={21}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                </div>

                <div>

                  <span>
                    Soil Moisture
                  </span>

                  <strong>
                    {formatNumber(
                      latestRecord.soil_moisture
                    )}%
                  </strong>

                  <span
                    className={
                      getMoistureStatus(
                        latestRecord.soil_moisture
                      ).className
                    }
                  >
                    {
                      getMoistureStatus(
                        latestRecord.soil_moisture
                      ).label
                    }
                  </span>

                </div>

              </div>


              <div className="sensor-reading-card">

                <div className="sensor-reading-icon">

                  <Waves
                    size={21}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                </div>

                <div>

                  <span>
                    Plant Condition
                  </span>

                  <strong className="sensor-condition-value">
                    {
                      latestRecord.plant_condition ||
                      "Not recorded"
                    }
                  </strong>

                  <span className="sensor-status good">

                    {String(
                      latestRecord.plant_condition ||
                      ""
                    ).toLowerCase() ===
                    "healthy" ? (
                      <CheckCircle2
                        size={14}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleAlert
                        size={14}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    )}

                    {
                      latestRecord.plant_condition ||
                      "Not recorded"
                    }

                  </span>

                </div>

              </div>

            </div>


            <div className="sensor-latest-meta">

              <span>
                Crop:
                <strong>
                  {" "}
                  {latestRecord.crop_name ||
                    "Unknown crop"}
                </strong>
              </span>

              <span>
                Farm:
                <strong>
                  {" "}
                  {latestRecord.farm_name ||
                    "Unknown farm"}
                </strong>
              </span>

              <span>
                Record ID:
                <strong>
                  {" "}
                  #{latestRecord.id}
                </strong>
              </span>

            </div>

          </div>

        )}


        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="sensor-toolbar">

          <div className="sensor-search">

            <Search
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search crops or farms..."
              aria-label="Search sensor data"
            />

          </div>


          <select
            value={cropFilter}
            onChange={(event) =>
              setCropFilter(
                event.target.value
              )
            }
            aria-label="Filter sensor data by crop"
          >

            <option value="All">
              All crops
            </option>

            {cropOptions.map(
              (cropName) => (

                <option
                  key={cropName}
                  value={cropName}
                >
                  {cropName}
                </option>

              )
            )}

          </select>

        </div>


        {/* =================================================
            HISTORY
        ================================================= */}

        <div className="sensor-content-card">

          <div className="sensor-content-header">

            <div>

              <div className="sensor-heading-title">

                <Activity
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <h2>
                  Sensor History
                </h2>

              </div>

              <p>
                {filteredRecords.length}{" "}
                {filteredRecords.length === 1
                  ? "record"
                  : "records"}{" "}
                displayed
              </p>

            </div>

            <div className="sensor-average-group">

              <span>
                Avg. temperature
                <strong>
                  {" "}
                  {formatNumber(
                    averageTemperature
                  )}°C
                </strong>
              </span>

              <span>
                Avg. soil moisture
                <strong>
                  {" "}
                  {formatNumber(
                    averageMoisture
                  )}%
                </strong>
              </span>

            </div>

          </div>


          {loading ? (

            <div className="sensor-state">

              <Loader2
                size={26}
                className="sensor-spin"
                aria-hidden="true"
              />

              <p>
                Loading sensor data...
              </p>

            </div>

          ) : filteredRecords.length === 0 ? (

            <div className="sensor-empty">

              <div className="sensor-empty-icon">

                <Activity
                  size={32}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

              </div>

              <h3>
                {monitoringRecords.length === 0
                  ? "No sensor data yet"
                  : "No matching records"}
              </h3>

              <p>
                {monitoringRecords.length === 0
                  ? "Monitoring records will appear here when crop observations are recorded."
                  : "Try changing your search or crop filter."}
              </p>

            </div>

          ) : (

            <div className="sensor-table-wrapper">

              <table className="sensor-table">

                <thead>

                  <tr>

                    <th>
                      Crop
                    </th>

                    <th>
                      Temperature
                    </th>

                    <th>
                      Soil Moisture
                    </th>

                    <th>
                      Plant Condition
                    </th>

                    <th>
                      Pest
                    </th>

                    <th>
                      Disease
                    </th>

                    <th>
                      Recorded
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredRecords.map(
                    (record) => {

                      const temperatureStatus =
                        getTemperatureStatus(
                          record.crop_temperature
                        );

                      const moistureStatus =
                        getMoistureStatus(
                          record.soil_moisture
                        );

                      return (

                        <tr
                          key={
                            record.id
                          }
                        >

                          <td>

                            <div className="sensor-crop-cell">

                              <div className="sensor-crop-icon">

                                <Activity
                                  size={17}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />

                              </div>

                              <div>

                                <strong>
                                  {
                                    record.crop_name ||
                                    "Unknown crop"
                                  }
                                </strong>

                                <span>
                                  {
                                    record.farm_name ||
                                    "Unknown farm"
                                  }
                                </span>

                              </div>

                            </div>

                          </td>


                          <td>

                            <div className="sensor-table-reading">

                              <strong>
                                {formatNumber(
                                  record.crop_temperature
                                )}°C
                              </strong>

                              <span
                                className={
                                  temperatureStatus.className
                                }
                              >
                                {
                                  temperatureStatus.label
                                }
                              </span>

                            </div>

                          </td>


                          <td>

                            <div className="sensor-table-reading">

                              <strong>
                                {formatNumber(
                                  record.soil_moisture
                                )}%
                              </strong>

                              <span
                                className={
                                  moistureStatus.className
                                }
                              >
                                {
                                  moistureStatus.label
                                }
                              </span>

                            </div>

                          </td>


                          <td>

                            <span
                              className={`sensor-condition ${
                                String(
                                  record.plant_condition ||
                                  ""
                                ).toLowerCase() ===
                                "healthy"
                                  ? "healthy"
                                  : "attention"
                              }`}
                            >
                              {
                                record.plant_condition ||
                                "Not recorded"
                              }
                            </span>

                          </td>


                          <td>

                            <span
                              className={`sensor-boolean ${
                                record.pest_detected
                                  ? "detected"
                                  : "clear"
                              }`}
                            >
                              {
                                record.pest_detected
                                  ? "Detected"
                                  : "Clear"
                              }
                            </span>

                          </td>


                          <td>

                            <span
                              className={`sensor-boolean ${
                                record.disease_detected
                                  ? "detected"
                                  : "clear"
                              }`}
                            >
                              {
                                record.disease_detected
                                  ? "Detected"
                                  : "Clear"
                              }
                            </span>

                          </td>


                          <td>

                            <span className="sensor-date">

                              {
                                formatDateTime(
                                  record.recorded_at
                                )
                              }

                            </span>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
};

export default SensorData;