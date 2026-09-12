import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";


const SOIL_MOISTURE_THRESHOLD = 30;


const Irrigation = () => {
  const [crops, setCrops] = useState([]);
  const [monitoringRecords, setMonitoringRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    let mounted = true;


    const loadData = async () => {
      setLoading(true);
      setError("");


      try {
        const [
          cropsResponse,
          monitoringResponse,
        ] = await Promise.all([
          api.get("/crops"),
          api.get("/monitoring"),
        ]);


        const cropsData =
          cropsResponse?.data;

        const monitoringData =
          monitoringResponse?.data;


        let cropList = [];
        let monitoringList = [];


        // -----------------------------------------------
        // CROPS
        // -----------------------------------------------

        if (Array.isArray(cropsData)) {
          cropList = cropsData;
        } else if (
          Array.isArray(cropsData?.crops)
        ) {
          cropList = cropsData.crops;
        } else if (
          Array.isArray(cropsData?.data)
        ) {
          cropList = cropsData.data;
        }


        // -----------------------------------------------
        // MONITORING
        // -----------------------------------------------

        if (Array.isArray(monitoringData)) {
          monitoringList =
            monitoringData;
        } else if (
          Array.isArray(
            monitoringData?.monitoring
          )
        ) {
          monitoringList =
            monitoringData.monitoring;
        } else if (
          Array.isArray(
            monitoringData?.records
          )
        ) {
          monitoringList =
            monitoringData.records;
        } else if (
          Array.isArray(
            monitoringData?.data
          )
        ) {
          monitoringList =
            monitoringData.data;
        }


        if (mounted) {
          setCrops(cropList);
          setMonitoringRecords(
            monitoringList
          );
        }

      } catch (err) {
        console.error(
          "Failed to load irrigation data:",
          err
        );


        if (mounted) {
          setError(
            err?.response?.data?.message ||
              "Unable to load irrigation data."
          );
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };


    loadData();


    return () => {
      mounted = false;
    };
  }, []);


  // =====================================================
  // LATEST MONITORING PER CROP
  // =====================================================

  const latestMonitoringByCrop =
    useMemo(() => {

      const latest = {};


      monitoringRecords.forEach(
        (record) => {

          const cropId =
            Number(record.crop_id);


          if (!cropId) {
            return;
          }


          const existing =
            latest[cropId];


          if (!existing) {
            latest[cropId] = record;
            return;
          }


          const existingTime =
            new Date(
              existing.recorded_at || 0
            ).getTime();


          const currentTime =
            new Date(
              record.recorded_at || 0
            ).getTime();


          if (
            currentTime > existingTime ||
            (
              currentTime === existingTime &&
              Number(record.id) >
                Number(existing.id)
            )
          ) {
            latest[cropId] = record;
          }

        }
      );


      return latest;

    }, [
      monitoringRecords,
    ]);


  // =====================================================
  // CROP IRRIGATION STATUS
  // =====================================================

  const cropStatuses = useMemo(() => {

    return crops.map((crop) => {

      const monitoring =
        latestMonitoringByCrop[
          Number(crop.id)
        ];


      const moisture =
        monitoring?.soil_moisture;


      const hasMoisture =
        moisture !== null &&
        moisture !== undefined &&
        Number.isFinite(
          Number(moisture)
        );


      let status = "No Data";
      let recommendation =
        "No soil moisture reading is available yet.";


      if (hasMoisture) {

        const moistureValue =
          Number(moisture);


        if (
          moistureValue <
          SOIL_MOISTURE_THRESHOLD
        ) {

          status = "Irrigation Recommended";

          recommendation =
            "Soil moisture is below the AgriWatch low-moisture threshold. Consider checking the crop and irrigation conditions.";

        } else {

          status = "Moisture Adequate";

          recommendation =
            "Soil moisture is currently above the AgriWatch low-moisture threshold.";

        }

      }


      return {
        crop,
        monitoring,
        moisture: hasMoisture
          ? Number(moisture)
          : null,
        status,
        recommendation,
      };

    });

  }, [
    crops,
    latestMonitoringByCrop,
  ]);


  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {

    const withData =
      cropStatuses.filter(
        (item) =>
          item.moisture !== null
      );


    const irrigationNeeded =
      cropStatuses.filter(
        (item) =>
          item.status ===
          "Irrigation Recommended"
      );


    const adequate =
      cropStatuses.filter(
        (item) =>
          item.status ===
          "Moisture Adequate"
      );


    const averageMoisture =
      withData.length > 0
        ? withData.reduce(
            (total, item) =>
              total + item.moisture,
            0
          ) / withData.length
        : null;


    return {
      totalCrops: crops.length,
      withData: withData.length,
      irrigationNeeded:
        irrigationNeeded.length,
      adequate:
        adequate.length,
      averageMoisture,
    };

  }, [
    cropStatuses,
    crops.length,
  ]);


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateString) => {

    if (!dateString) {
      return "No reading";
    }


    const date =
      new Date(dateString);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "No reading";
    }


    return date.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {

    if (
      status ===
      "Irrigation Recommended"
    ) {
      return "irrigation-status-warning";
    }


    if (
      status ===
      "Moisture Adequate"
    ) {
      return "irrigation-status-good";
    }


    return "irrigation-status-neutral";
  };


  // =====================================================
  // MOISTURE CLASS
  // =====================================================

  const getMoistureClass = (
    moisture
  ) => {

    if (moisture === null) {
      return "moisture-neutral";
    }


    if (
      moisture <
      SOIL_MOISTURE_THRESHOLD
    ) {
      return "moisture-low";
    }


    return "moisture-good";
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="irrigation-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-header">

        <div>

          <div className="page-header-eyebrow">
            Water Management
          </div>

          <h1 className="page-title">
            Irrigation
          </h1>

          <p className="page-description">
            Use soil moisture monitoring to
            identify crops that may need
            irrigation.
          </p>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="irrigation-error-card">

          <div className="irrigation-error-icon">
            ⚠
          </div>

          <div>

            <strong>
              Unable to load irrigation data
            </strong>

            <p>
              {error}
            </p>

          </div>

        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <div className="irrigation-loading-card">

          <div className="irrigation-spinner">
            ⟳
          </div>

          <div>

            <h3>
              Loading irrigation data
            </h3>

            <p>
              Checking the latest crop
              monitoring records...
            </p>

          </div>

        </div>
      ) : (

        <>

          {/* =============================================
              SUMMARY CARDS
          ============================================= */}

          <div className="irrigation-summary-grid">

            {/* Total crops */}

            <div className="irrigation-summary-card">

              <div className="irrigation-summary-icon">
                🍅
              </div>

              <div>

                <div className="irrigation-summary-label">
                  Total Crops
                </div>

                <div className="irrigation-summary-value">
                  {summary.totalCrops}
                </div>

              </div>

            </div>


            {/* Irrigation recommended */}

            <div className="irrigation-summary-card irrigation-summary-warning">

              <div className="irrigation-summary-icon">
                💧
              </div>

              <div>

                <div className="irrigation-summary-label">
                  Irrigation Recommended
                </div>

                <div className="irrigation-summary-value">
                  {summary.irrigationNeeded}
                </div>

              </div>

            </div>


            {/* Adequate */}

            <div className="irrigation-summary-card irrigation-summary-good">

              <div className="irrigation-summary-icon">
                ✓
              </div>

              <div>

                <div className="irrigation-summary-label">
                  Moisture Adequate
                </div>

                <div className="irrigation-summary-value">
                  {summary.adequate}
                </div>

              </div>

            </div>


            {/* Average */}

            <div className="irrigation-summary-card">

              <div className="irrigation-summary-icon">
                📊
              </div>

              <div>

                <div className="irrigation-summary-label">
                  Average Moisture
                </div>

                <div className="irrigation-summary-value">

                  {summary.averageMoisture !== null
                    ? `${summary.averageMoisture.toFixed(1)}%`
                    : "—"}

                </div>

              </div>

            </div>

          </div>


          {/* =============================================
              IRRIGATION GUIDANCE
          ============================================= */}

          <section className="irrigation-guidance-card">

            <div className="irrigation-guidance-icon">
              💧
            </div>

            <div className="irrigation-guidance-content">

              <h2>
                AgriWatch Irrigation Guidance
              </h2>

              <p>
                The current AgriWatch
                recommendation threshold is{" "}
                <strong>
                  {SOIL_MOISTURE_THRESHOLD}%
                </strong>{" "}
                soil moisture.
              </p>

              <p>
                When the latest soil moisture
                reading falls below this
                threshold, AgriWatch marks the
                crop for irrigation review.
              </p>

              <div className="irrigation-guidance-note">

                This page provides a software
                recommendation only. It does not
                activate a physical irrigation
                system.

              </div>

            </div>

          </section>


          {/* =============================================
              CROP IRRIGATION STATUS
          ============================================= */}

          <section className="irrigation-section">

            <div className="section-heading">

              <div>

                <h2>
                  Crop Irrigation Status
                </h2>

                <p>
                  Latest soil moisture reading
                  for each crop.
                </p>

              </div>

            </div>


            {cropStatuses.length === 0 ? (

              <div className="irrigation-empty-card">

                <div className="irrigation-empty-icon">
                  🍅
                </div>

                <h3>
                  No crops available
                </h3>

                <p>
                  Add a crop and record
                  monitoring data to begin
                  irrigation monitoring.
                </p>

              </div>

            ) : (

              <div className="irrigation-crop-grid">

                {cropStatuses.map(
                  (item) => {

                    const crop =
                      item.crop;


                    return (
                      <div
                        className="irrigation-crop-card"
                        key={crop.id}
                      >

                        {/* =================================
                            CARD HEADER
                        ================================= */}

                        <div className="irrigation-crop-header">

                          <div>

                            <h3>
                              {crop.crop_name ||
                                "Unnamed Crop"}
                            </h3>

                            {crop.variety && (
                              <p>
                                {crop.variety}
                              </p>
                            )}

                          </div>


                          <span
                            className={`irrigation-status-badge ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>

                        </div>


                        {/* =================================
                            MOISTURE
                        ================================= */}

                        <div className="irrigation-moisture-area">

                          <div className="irrigation-moisture-header">

                            <span>
                              Soil Moisture
                            </span>

                            <strong>

                              {item.moisture !==
                              null
                                ? `${item.moisture.toFixed(
                                    1
                                  )}%`
                                : "—"}

                            </strong>

                          </div>


                          <div className="irrigation-moisture-bar">

                            <div
                              className={`irrigation-moisture-fill ${getMoistureClass(
                                item.moisture
                              )}`}
                              style={{
                                width:
                                  item.moisture !==
                                  null
                                    ? `${Math.min(
                                        Math.max(
                                          item.moisture,
                                          0
                                        ),
                                        100
                                      )}%`
                                    : "0%",
                              }}
                            />

                          </div>


                          <div className="irrigation-threshold-label">

                            <span>
                              0%
                            </span>

                            <span>
                              Threshold:{" "}
                              {
                                SOIL_MOISTURE_THRESHOLD
                              }%
                            </span>

                            <span>
                              100%
                            </span>

                          </div>

                        </div>


                        {/* =================================
                            RECOMMENDATION
                        ================================= */}

                        <div className="irrigation-recommendation">

                          <div className="irrigation-recommendation-icon">

                            {item.status ===
                            "Irrigation Recommended"
                              ? "💧"
                              : item.status ===
                                "Moisture Adequate"
                              ? "✓"
                              : "ℹ"}

                          </div>

                          <div>

                            <div className="irrigation-recommendation-title">

                              {item.status ===
                              "Irrigation Recommended"
                                ? "Review irrigation"
                                : item.status ===
                                  "Moisture Adequate"
                                ? "No irrigation warning"
                                : "Monitoring required"}

                            </div>

                            <p>
                              {item.recommendation}
                            </p>

                          </div>

                        </div>


                        {/* =================================
                            LAST READING
                        ================================= */}

                        <div className="irrigation-last-reading">

                          <span>
                            Last monitoring record
                          </span>

                          <strong>
                            {formatDate(
                              item.monitoring
                                ?.recorded_at
                            )}
                          </strong>

                        </div>

                      </div>
                    );

                  }
                )}

              </div>
            )}

          </section>


          {/* =============================================
              IMPORTANT NOTE
          ============================================= */}

          <div className="irrigation-footer-note">

            <strong>
              Irrigation monitoring note:
            </strong>

            {" "}

            AgriWatch uses the latest available
            soil-moisture measurement to flag
            crops for irrigation review. Actual
            irrigation decisions should also
            consider crop condition, soil
            characteristics, weather, and the
            farm's irrigation practices.

          </div>

        </>
      )}

    </div>
  );
};


export default Irrigation;