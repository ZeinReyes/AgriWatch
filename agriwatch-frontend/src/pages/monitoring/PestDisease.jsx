import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import api from "../../services/api";

import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle2,
  CircleAlert,
  Leaf,
  RefreshCw,
  Search,
  ShieldAlert,
  Sprout,
} from "lucide-react";

import "./PestDisease.css";


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


const normalizeId = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
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


const isTrue = (
  value
) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value)
      .toLowerCase() ===
      "true"
  );
};


const PestDisease = () => {
  const [
    monitoringRecords,
    setMonitoringRecords,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [viewFilter, setViewFilter] =
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


      const crops =
        extractArray(
          cropsResponse.data,
          [
            "crops",
            "data",
            "results",
          ]
        );


      const farms =
        extractArray(
          farmsResponse.data,
          [
            "farms",
            "data",
            "results",
          ]
        );


      const cropMap =
        new Map(
          crops.map(
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
          farms.map(
            (farm) => [
              normalizeId(
                farm.id
              ),
              farm,
            ]
          )
        );


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
        "Unable to load pest and disease data:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load pest and disease data."
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
  // SORT
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
  // COUNTS
  // =======================================================

  const pestDetections =
    monitoringRecords.filter(
      (record) =>
        isTrue(
          record.pest_detected
        )
    ).length;


  const diseaseDetections =
    monitoringRecords.filter(
      (record) =>
        isTrue(
          record.disease_detected
        )
    ).length;


  const discolorationDetections =
    monitoringRecords.filter(
      (record) =>
        isTrue(
          record.discoloration_detected
        )
    ).length;


  const attentionConditions =
    monitoringRecords.filter(
      (record) =>
        String(
          record.plant_condition ||
          ""
        ).toLowerCase() !==
        "healthy"
    ).length;


  // =======================================================
  // DETECTION RECORDS
  // =======================================================

  const detectionRecords =
    useMemo(() => {

      return sortedRecords.filter(
        (record) =>
          isTrue(
            record.pest_detected
          ) ||
          isTrue(
            record.disease_detected
          ) ||
          isTrue(
            record.discoloration_detected
          ) ||
          String(
            record.plant_condition ||
            ""
          ).toLowerCase() !==
            "healthy"
      );

    }, [
      sortedRecords,
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


      return detectionRecords.filter(
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


          let matchesFilter =
            true;


          if (
            viewFilter ===
            "Pest"
          ) {
            matchesFilter =
              isTrue(
                record.pest_detected
              );
          }


          if (
            viewFilter ===
            "Disease"
          ) {
            matchesFilter =
              isTrue(
                record.disease_detected
              );
          }


          if (
            viewFilter ===
            "Discoloration"
          ) {
            matchesFilter =
              isTrue(
                record.discoloration_detected
              );
          }


          if (
            viewFilter ===
            "Plant Condition"
          ) {
            matchesFilter =
              String(
                record.plant_condition ||
                ""
              ).toLowerCase() !==
              "healthy";
          }


          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );

    }, [
      detectionRecords,
      search,
      viewFilter,
    ]);


  // =======================================================
  // LATEST DETECTION
  // =======================================================

  const latestDetection =
    detectionRecords[0] ||
    null;


  // =======================================================
  // DETECTION TYPES
  // =======================================================

  const getDetectionTypes = (
    record
  ) => {

    const types = [];

    if (
      isTrue(
        record.pest_detected
      )
    ) {
      types.push("Pest");
    }

    if (
      isTrue(
        record.disease_detected
      )
    ) {
      types.push("Disease");
    }

    if (
      isTrue(
        record.discoloration_detected
      )
    ) {
      types.push(
        "Discoloration"
      );
    }

    if (
      String(
        record.plant_condition ||
        ""
      ).toLowerCase() !==
      "healthy"
    ) {
      types.push(
        "Plant Condition"
      );
    }

    return types;
  };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <DashboardLayout>

      <div className="pest-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="pest-page-header">

          <div>

            <span className="page-eyebrow">
              CROP HEALTH
            </span>

            <h1>
              Pest & Disease
            </h1>

            <p>
              Review recorded pest,
              disease, discoloration,
              and plant-condition findings.
            </p>

          </div>


          <button
            type="button"
            className="pest-refresh-button"
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
                  ? "pest-spin"
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

          <div className="pest-alert">

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

        <div className="pest-stat-grid">

          <div className="pest-stat-card">

            <div className="pest-stat-icon pest">

              <Bug
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Pest Detections
              </span>

              <strong>
                {pestDetections}
              </strong>

              <small>
                Recorded observations
              </small>

            </div>

          </div>


          <div className="pest-stat-card">

            <div className="pest-stat-icon disease">

              <ShieldAlert
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Disease Detections
              </span>

              <strong>
                {diseaseDetections}
              </strong>

              <small>
                Recorded observations
              </small>

            </div>

          </div>


          <div className="pest-stat-card">

            <div className="pest-stat-icon discoloration">

              <Leaf
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Discoloration
              </span>

              <strong>
                {
                  discolorationDetections
                }
              </strong>

              <small>
                Recorded observations
              </small>

            </div>

          </div>


          <div className="pest-stat-card">

            <div className="pest-stat-icon attention">

              <AlertTriangle
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Plant Conditions
              </span>

              <strong>
                {
                  attentionConditions
                }
              </strong>

              <small>
                Conditions needing review
              </small>

            </div>

          </div>

        </div>


        {/* =================================================
            LATEST DETECTION
        ================================================= */}

        {latestDetection && (

          <div className="pest-feature-card">

            <div className="pest-feature-header">

              <div>

                <div className="pest-heading-title">

                  <Activity
                    size={19}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <h2>
                    Latest Finding
                  </h2>

                </div>

                <p>
                  Most recent monitored condition
                  requiring review.
                </p>

              </div>


              <span className="pest-feature-time">

                {
                  formatDateTime(
                    latestDetection.recorded_at
                  )
                }

              </span>

            </div>


            <div className="pest-feature-body">

              <div className="pest-feature-icon">

                {isTrue(
                  latestDetection.disease_detected
                ) ? (

                  <ShieldAlert
                    size={31}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                ) : isTrue(
                  latestDetection.pest_detected
                ) ? (

                  <Bug
                    size={31}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                ) : (

                  <Leaf
                    size={31}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                )}

              </div>


              <div className="pest-feature-copy">

                <div className="pest-feature-tags">

                  {getDetectionTypes(
                    latestDetection
                  ).map(
                    (type) => (

                      <span
                        key={type}
                        className={
                          type ===
                            "Disease"
                            ? "pest-tag critical"
                            : "pest-tag warning"
                        }
                      >
                        {type}
                      </span>

                    )
                  )}

                </div>


                <h3>
                  {
                    latestDetection.crop_name ||
                    "Unknown crop"
                  }
                </h3>


                <p>
                  {
                    latestDetection.farm_name ||
                    "Unknown farm"
                  }
                </p>


                <span className="pest-feature-condition">

                  <strong>
                    Plant condition:
                  </strong>

                  {" "}

                  {
                    latestDetection.plant_condition ||
                    "Not recorded"
                  }

                </span>

              </div>

            </div>

          </div>

        )}


        {/* =================================================
            NO MONITORING DATA
        ================================================= */}

        {!loading &&
          monitoringRecords.length ===
            0 && (

          <div className="pest-empty">

            <div className="pest-empty-icon">

              <Sprout
                size={34}
                strokeWidth={1.9}
                aria-hidden="true"
              />

            </div>

            <h2>
              No detection data yet
            </h2>

            <p>
              Pest and disease findings will
              appear here when monitoring
              records are submitted.
            </p>

          </div>

        )}


        {/* =================================================
            FILTERS
        ================================================= */}

        {!loading &&
          detectionRecords.length >
            0 && (

          <div className="pest-toolbar">

            <div className="pest-search">

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
                aria-label="Search pest and disease records"
              />

            </div>


            <select
              value={
                viewFilter
              }
              onChange={(event) =>
                setViewFilter(
                  event.target.value
                )
              }
              aria-label="Filter detection type"
            >

              <option value="All">
                All findings
              </option>

              <option value="Pest">
                Pest
              </option>

              <option value="Disease">
                Disease
              </option>

              <option value="Discoloration">
                Discoloration
              </option>

              <option value="Plant Condition">
                Plant Condition
              </option>

            </select>

          </div>

        )}


        {/* =================================================
            HISTORY
        ================================================= */}

        {!loading &&
          detectionRecords.length >
            0 && (

          <div className="pest-content-card">

            <div className="pest-content-header">

              <div>

                <div className="pest-heading-title">

                  <Bug
                    size={19}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <h2>
                    Detection History
                  </h2>

                </div>

                <p>
                  {filteredRecords.length}{" "}
                  {
                    filteredRecords.length ===
                    1
                      ? "finding"
                      : "findings"
                  }{" "}
                  displayed
                </p>

              </div>

            </div>


            {filteredRecords.length ===
              0 ? (

              <div className="pest-state">

                <div className="pest-empty-icon small">

                  <Search
                    size={27}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                </div>

                <h3>
                  No matching findings
                </h3>

                <p>
                  Try changing your search
                  or detection filter.
                </p>

              </div>

            ) : (

              <div className="pest-record-list">

                {filteredRecords.map(
                  (record) => {

                    const types =
                      getDetectionTypes(
                        record
                      );

                    const hasDisease =
                      isTrue(
                        record.disease_detected
                      );


                    return (

                      <div
                        className={`pest-record ${
                          hasDisease
                            ? "critical"
                            : "warning"
                        }`}
                        key={
                          record.id
                        }
                      >

                        <div className="pest-record-icon">

                          {hasDisease ? (

                            <ShieldAlert
                              size={21}
                              strokeWidth={2}
                              aria-hidden="true"
                            />

                          ) : (

                            <Bug
                              size={21}
                              strokeWidth={2}
                              aria-hidden="true"
                            />

                          )}

                        </div>


                        <div className="pest-record-main">

                          <div className="pest-record-title-row">

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


                            <small>
                              {
                                formatDateTime(
                                  record.recorded_at
                                )
                              }
                            </small>

                          </div>


                          <div className="pest-record-tags">

                            {types.map(
                              (type) => (

                                <span
                                  key={type}
                                  className={
                                    type ===
                                      "Disease"
                                      ? "pest-tag critical"
                                      : "pest-tag warning"
                                  }
                                >
                                  {
                                    type
                                  }
                                </span>

                              )
                            )}

                          </div>


                          <div className="pest-record-meta">

                            <span>

                              <strong>
                                Plant condition:
                              </strong>

                              {" "}

                              {
                                record.plant_condition ||
                                "Not recorded"
                              }

                            </span>


                            <span>

                              <strong>
                                Record:
                              </strong>

                              {" "}
                              #
                              {
                                record.id
                              }

                            </span>

                          </div>

                        </div>


                        <div className="pest-record-status">

                          {hasDisease ? (

                            <span className="pest-severity critical">

                              <CircleAlert
                                size={14}
                                strokeWidth={2}
                                aria-hidden="true"
                              />

                              Critical

                            </span>

                          ) : (

                            <span className="pest-severity warning">

                              <AlertTriangle
                                size={14}
                                strokeWidth={2}
                                aria-hidden="true"
                              />

                              Review

                            </span>

                          )}

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

        )}

      </div>

    </DashboardLayout>
  );
};


export default PestDisease;