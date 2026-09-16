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
  Clock3,
  Droplets,
  RefreshCw,
  Search,
  Sprout,
  Thermometer,
} from "lucide-react";

import "./SensorData.css";


// =========================================================
// HELPERS
// =========================================================

const extractArray = (
  data,
  keys = []
) => {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};


const normalizeId = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
};


const formatNumber = (
  value,
  decimals = 1
) => {
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


const formatDateTime = (
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


const getMoistureStatus = (
  value
) => {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return {
      label: "No reading",
      className:
        "sensor-status neutral",
    };
  }

  if (number < 30) {
    return {
      label: "Low",
      className:
        "sensor-status warning",
    };
  }

  return {
    label: "Normal",
    className:
      "sensor-status good",
  };
};


const getTemperatureStatus = (
  value
) => {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return {
      label: "No reading",
      className:
        "sensor-status neutral",
    };
  }

  if (number > 35) {
    return {
      label: "High",
      className:
        "sensor-status critical",
    };
  }

  return {
    label: "Normal",
    className:
      "sensor-status good",
  };
};


const getPlantConditionClass = (
  condition
) => {
  const normalized =
    String(
      condition || ""
    ).toLowerCase();

  if (
    normalized ===
    "healthy"
  ) {
    return "healthy";
  }

  return "attention";
};


// =========================================================
// SENSOR DATA
// =========================================================

const SensorData = () => {
  const [monitoringRecords, setMonitoringRecords] =
    useState([]);

  const [crops, setCrops] =
    useState([]);

  const [farms, setFarms] =
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

  const loadData = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        monitoringResponse,
        cropsResponse,
        farmsResponse,
      ] = await Promise.all([
        api.get("/monitoring"),
        api.get("/crops"),
        api.get("/farms"),
      ]);


      const monitoring =
        extractArray(
          monitoringResponse.data,
          [
            "monitoring",
            "monitoring_records",
            "records",
            "data",
            "results",
          ]
        );


      const cropData =
        extractArray(
          cropsResponse.data,
          [
            "crops",
            "data",
            "results",
          ]
        );


      const farmData =
        extractArray(
          farmsResponse.data,
          [
            "farms",
            "data",
            "results",
          ]
        );


      setCrops(
        cropData
      );

      setFarms(
        farmData
      );


      // ---------------------------------------------------
      // BUILD LOOKUP MAPS
      // ---------------------------------------------------

      const cropMap =
        new Map(
          cropData.map(
            (crop) => [
              normalizeId(
                crop.id
              ),
              crop,
            ]
          )
        );


      const farmMap =
        new Map(
          farmData.map(
            (farm) => [
              normalizeId(
                farm.id
              ),
              farm,
            ]
          )
        );


      // ---------------------------------------------------
      // ENRICH MONITORING RECORDS
      // ---------------------------------------------------

      const enrichedMonitoring =
        monitoring.map(
          (record) => {

            const crop =
              cropMap.get(
                normalizeId(
                  record.crop_id
                )
              );


            const farmId =
              crop?.farm_id ??
              record.farm_id ??
              "";


            const farm =
              farmMap.get(
                normalizeId(
                  farmId
                )
              );


            return {
              ...record,

              crop_name:
                record.crop_name ||
                record.crop?.crop_name ||
                crop?.crop_name ||
                "Unknown crop",

              variety:
                record.variety ||
                record.crop?.variety ||
                crop?.variety ||
                "",

              farm_name:
                record.farm_name ||
                record.farm?.farm_name ||
                farm?.farm_name ||
                "Unknown farm",

              farm_id:
                farmId,
            };
          }
        );


      setMonitoringRecords(
        enrichedMonitoring
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
    loadData();
  }, []);


  // =======================================================
  // SORTED DATA
  // =======================================================

  const sortedRecords =
    useMemo(() => {
      return [
        ...monitoringRecords,
      ].sort(
        (a, b) => {

          const dateA =
            new Date(
              a.recorded_at
            ).getTime() || 0;

          const dateB =
            new Date(
              b.recorded_at
            ).getTime() || 0;

          return (
            dateB - dateA
          );
        }
      );
    }, [
      monitoringRecords,
    ]);


  // =======================================================
  // CROP FILTER OPTIONS
  // =======================================================

  const cropOptions =
    useMemo(() => {

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

    }, [
      monitoringRecords,
    ]);


  // =======================================================
  // FILTERED RECORDS
  // =======================================================

  const filteredRecords =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();


      return sortedRecords.filter(
        (record) => {

          const cropName =
            String(
              record.crop_name ||
              ""
            ).toLowerCase();

          const farmName =
            String(
              record.farm_name ||
              ""
            ).toLowerCase();

          const matchesSearch =
            !searchValue ||
            cropName.includes(
              searchValue
            ) ||
            farmName.includes(
              searchValue
            );


          const matchesCrop =
            cropFilter ===
              "All" ||
            record.crop_name ===
              cropFilter;


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
    sortedRecords[0] ||
    null;


  // =======================================================
  // AVERAGES
  // =======================================================

  const temperatureRecords =
    monitoringRecords.filter(
      (record) =>
        Number.isFinite(
          Number(
            record.crop_temperature
          )
        )
    );


  const moistureRecords =
    monitoringRecords.filter(
      (record) =>
        Number.isFinite(
          Number(
            record.soil_moisture
          )
        )
    );


  const averageTemperature =
    temperatureRecords.length > 0
      ? temperatureRecords.reduce(
          (
            total,
            record
          ) =>
            total +
            Number(
              record.crop_temperature
            ),
          0
        ) /
        temperatureRecords.length
      : null;


  const averageMoisture =
    moistureRecords.length > 0
      ? moistureRecords.reduce(
          (
            total,
            record
          ) =>
            total +
            Number(
              record.soil_moisture
            ),
          0
        ) /
        moistureRecords.length
      : null;


  // =======================================================
  // CONDITION COUNTS
  // =======================================================

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


  // =======================================================
  // RENDER
  // =======================================================

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
              loadData(true)
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

              <small>
                {latestRecord
                  ? getTemperatureStatus(
                      latestRecord.crop_temperature
                    ).label
                  : "No reading"}
              </small>

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

              <small>
                {latestRecord
                  ? getMoistureStatus(
                      latestRecord.soil_moisture
                    ).label
                  : "No reading"}
              </small>

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
                {
                  monitoringRecords.length
                }
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
                Temperature and moisture thresholds
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

                {
                  formatDateTime(
                    latestRecord.recorded_at
                  )
                }

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
                    {
                      formatNumber(
                        latestRecord.crop_temperature
                      )
                    }°C
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
                    {
                      formatNumber(
                        latestRecord.soil_moisture
                      )
                    }%
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

                  <Sprout
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

                  <span
                    className={`sensor-status ${
                      getPlantConditionClass(
                        latestRecord.plant_condition
                      ) ===
                      "healthy"
                        ? "good"
                        : "warning"
                    }`}
                  >

                    {getPlantConditionClass(
                      latestRecord.plant_condition
                    ) ===
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
                  {
                    latestRecord.crop_name ||
                    "Unknown crop"
                  }
                </strong>
              </span>

              <span>
                Farm:
                <strong>
                  {" "}
                  {
                    latestRecord.farm_name ||
                    "Unknown farm"
                  }
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
            FILTER BAR
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
            value={
              cropFilter
            }
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
                {
                  filteredRecords.length ===
                  1
                    ? "record"
                    : "records"
                }{" "}
                displayed
              </p>

            </div>


            <div className="sensor-average-group">

              <span>
                Avg. temperature
                <strong>
                  {" "}
                  {
                    averageTemperature ===
                    null
                      ? "—"
                      : `${formatNumber(
                          averageTemperature
                        )}°C`
                  }
                </strong>
              </span>

              <span>
                Avg. soil moisture
                <strong>
                  {" "}
                  {
                    averageMoisture ===
                    null
                      ? "—"
                      : `${formatNumber(
                          averageMoisture
                        )}%`
                  }
                </strong>
              </span>

            </div>

          </div>


          {loading ? (

            <div className="sensor-state">

              <LoaderSpinner />

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
                {
                  monitoringRecords.length ===
                  0
                    ? "No sensor data yet"
                    : "No matching records"
                }
              </h3>

              <p>
                {
                  monitoringRecords.length ===
                  0
                    ? "Monitoring records will appear here when crop observations are recorded."
                    : "Try changing your search or crop filter."
                }
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
                      Farm
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

                      const plantCondition =
                        record.plant_condition ||
                        "Not recorded";


                      return (

                        <tr
                          key={
                            record.id
                          }
                        >

                          <td>

                            <div className="sensor-crop-cell">

                              <div className="sensor-crop-icon">

                                <Sprout
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
                                    record.variety ||
                                    "Tomato crop"
                                  }
                                </span>

                              </div>

                            </div>

                          </td>


                          <td>

                            <span className="sensor-farm-name">

                              {
                                record.farm_name ||
                                "Unknown farm"
                              }

                            </span>

                          </td>


                          <td>

                            <div className="sensor-table-reading">

                              <strong>
                                {
                                  formatNumber(
                                    record.crop_temperature
                                  )
                                }°C
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
                                {
                                  formatNumber(
                                    record.soil_moisture
                                  )
                                }%
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
                                getPlantConditionClass(
                                  plantCondition
                                )
                              }`}
                            >
                              {
                                plantCondition
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


// =========================================================
// LOADING SPINNER
// =========================================================

const LoaderSpinner = () => {
  return (
    <RefreshCw
      size={26}
      className="sensor-spin"
      aria-hidden="true"
    />
  );
};


export default SensorData;