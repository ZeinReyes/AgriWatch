import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Sprout,
  Droplets,
  Leaf,
  CheckCircle2,
  Info,
  MinusCircle,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

import "./Irrigation.css";


const SOIL_MOISTURE_THRESHOLD = 30;


const Irrigation = () => {

  const [
    crops,
    setCrops
  ] = useState([]);

  const [
    monitoringRecords,
    setMonitoringRecords
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {
    loadIrrigationData();
  }, []);


  const loadIrrigationData = async () => {

    try {

      setLoading(true);
      setError("");


      const [
        cropsResponse,
        monitoringResponse
      ] = await Promise.all([
        api.get("/crops"),
        api.get("/monitoring"),
      ]);


      const cropData =
        Array.isArray(
          cropsResponse.data
        )
          ? cropsResponse.data
          : cropsResponse.data?.crops ||
            cropsResponse.data?.data ||
            [];


      const monitoringData =
        Array.isArray(
          monitoringResponse.data
        )
          ? monitoringResponse.data
          : monitoringResponse.data?.monitoring ||
            monitoringResponse.data?.records ||
            monitoringResponse.data?.data ||
            [];


      setCrops(cropData);
      setMonitoringRecords(
        monitoringData
      );

    } catch (err) {

      console.error(
        "Failed to load irrigation data:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load irrigation information."
      );

    } finally {

      setLoading(false);

    }
  };


  /*
   * Get the latest monitoring record
   * for each crop.
   */
  const latestMonitoringByCrop =
    useMemo(() => {

      const latest = {};


      monitoringRecords.forEach(
        (record) => {

          if (
            !record.crop_id
          ) {
            return;
          }


          const existing =
            latest[record.crop_id];


          if (!existing) {

            latest[record.crop_id] =
              record;

            return;
          }


          const existingDate =
            existing.recorded_at
              ? new Date(
                  existing.recorded_at
                ).getTime()
              : 0;


          const currentDate =
            record.recorded_at
              ? new Date(
                  record.recorded_at
                ).getTime()
              : 0;


          if (
            currentDate >
              existingDate ||
            (
              currentDate ===
                existingDate &&
              Number(record.id || 0) >
                Number(existing.id || 0)
            )
          ) {

            latest[record.crop_id] =
              record;

          }

        }
      );


      return latest;

    }, [
      monitoringRecords
    ]);


  const cropRecommendations =
    useMemo(() => {

      return crops.map(
        (crop) => {

          const monitoring =
            latestMonitoringByCrop[
              crop.id
            ];


          const moisture =
            monitoring?.soil_moisture;


          let recommendation =
            "No recommendation";


          let status =
            "no-data";


          if (
            moisture !== null &&
            moisture !== undefined &&
            Number.isFinite(
              Number(moisture)
            )
          ) {

            const moistureValue =
              Number(moisture);


            if (
              moistureValue <
              SOIL_MOISTURE_THRESHOLD
            ) {

              recommendation =
                "Irrigation recommended";

              status =
                "irrigate";

            } else {

              recommendation =
                "Moisture level is adequate";

              status =
                "adequate";

            }

          }


          return {
            ...crop,
            monitoring,
            moisture,
            recommendation,
            status,
          };

        }
      );

    }, [
      crops,
      latestMonitoringByCrop
    ]);


  const monitoredCrops =
    cropRecommendations.filter(
      (crop) =>
        crop.moisture !== null &&
        crop.moisture !== undefined &&
        Number.isFinite(
          Number(crop.moisture)
        )
    );


  const irrigationNeeded =
    cropRecommendations.filter(
      (crop) =>
        crop.status === "irrigate"
    );


  const adequateCrops =
    cropRecommendations.filter(
      (crop) =>
        crop.status === "adequate"
    );


  const averageMoisture =
    monitoredCrops.length > 0
      ? monitoredCrops.reduce(
          (
            total,
            crop
          ) =>
            total +
            Number(
              crop.moisture
            ),
          0
        ) /
        monitoredCrops.length
      : null;


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


  const getMoistureClass = (
    moisture
  ) => {

    if (
      moisture === null ||
      moisture === undefined ||
      !Number.isFinite(
        Number(moisture)
      )
    ) {

      return "no-data";

    }


    const value =
      Number(moisture);


    if (
      value <
      SOIL_MOISTURE_THRESHOLD
    ) {

      return "low";

    }


    if (value < 50) {

      return "moderate";

    }


    return "good";

  };


  return (

    <DashboardLayout>

      <div className="irrigation-page">

        {/* =====================================
            PAGE HEADER
        ====================================== */}

        <div className="irrigation-header">

          <div>

            <span className="irrigation-eyebrow">
              WATER MANAGEMENT
            </span>

            <h1>
              Irrigation
            </h1>

            <p>
              Use soil moisture readings to
              determine when crops may need
              irrigation.
            </p>

          </div>

        </div>


        {/* =====================================
            LOADING
        ====================================== */}

        {loading && (

          <div className="irrigation-state-card">

            <div className="irrigation-spinner"></div>

            <h3>
              Loading irrigation data
            </h3>

            <p>
              Retrieving the latest soil
              moisture readings.
            </p>

          </div>

        )}


        {/* =====================================
            ERROR
        ====================================== */}

        {!loading && error && (

          <div className="irrigation-state-card irrigation-error">

            <div className="irrigation-state-icon">
              <AlertTriangle size={22} strokeWidth={1.85} />
            </div>

            <h3>
              Irrigation data unavailable
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="irrigation-retry-button"
              onClick={
                loadIrrigationData
              }
            >
              Try Again
            </button>

          </div>

        )}


        {/* =====================================
            EMPTY
        ====================================== */}

        {!loading &&
          !error &&
          crops.length === 0 && (

            <div className="irrigation-state-card">

              <div className="irrigation-state-icon">
                <Sprout size={22} strokeWidth={1.85} />
              </div>

              <h3>
                No crops available
              </h3>

              <p>
                Add a crop and record monitoring
                data to receive irrigation
                recommendations.
              </p>

            </div>

          )}


        {/* =====================================
            CONTENT
        ====================================== */}

        {!loading &&
          !error &&
          crops.length > 0 && (

            <>

              {/* =================================
                  SUMMARY
              ================================= */}

              <section className="irrigation-summary">

                <div className="irrigation-summary-card">

                  <div className="irrigation-summary-icon">
                    <Droplets size={18} strokeWidth={1.85} />
                  </div>

                  <div>

                    <span>
                      Average Moisture
                    </span>

                    <strong>
                      {
                        averageMoisture !== null
                          ? `${averageMoisture.toFixed(1)}%`
                          : "—"
                      }
                    </strong>

                  </div>

                </div>


                <div className="irrigation-summary-card">

                  <div className="irrigation-summary-icon">
                    <Leaf size={18} strokeWidth={1.85} />
                  </div>

                  <div>

                    <span>
                      Monitored Crops
                    </span>

                    <strong>
                      {monitoredCrops.length}
                    </strong>

                  </div>

                </div>


                <div className="irrigation-summary-card irrigation-warning">

                  <div className="irrigation-summary-icon">
                    <AlertTriangle size={18} strokeWidth={1.85} />
                  </div>

                  <div>

                    <span>
                      Irrigation Needed
                    </span>

                    <strong>
                      {irrigationNeeded.length}
                    </strong>

                  </div>

                </div>


                <div className="irrigation-summary-card irrigation-good">

                  <div className="irrigation-summary-icon">
                    <CheckCircle2 size={18} strokeWidth={1.85} />
                  </div>

                  <div>

                    <span>
                      Moisture Adequate
                    </span>

                    <strong>
                      {adequateCrops.length}
                    </strong>

                  </div>

                </div>

              </section>


              {/* =================================
                  THRESHOLD INFORMATION
              ================================= */}

              <section className="irrigation-info-card">

                <div className="irrigation-info-icon">
                  <Info size={16} strokeWidth={1.85} />
                </div>

                <div>

                  <h3>
                    Irrigation Threshold
                  </h3>

                  <p>
                    Crops with soil moisture below
                    {" "}
                    <strong>
                      {SOIL_MOISTURE_THRESHOLD}%
                    </strong>
                    {" "}
                    are marked as needing
                    irrigation. This is a software
                    recommendation based on the
                    monitoring data.
                  </p>

                </div>

              </section>


              {/* =================================
                  CROP MONITORING
              ================================= */}

              <section className="irrigation-section">

                <div className="irrigation-section-header">

                  <div>

                    <h2>
                      Crop Irrigation Status
                    </h2>

                    <p>
                      Review the latest soil
                      moisture reading for each crop.
                    </p>

                  </div>

                </div>


                <div className="irrigation-crop-grid">

                  {cropRecommendations.map(
                    (crop) => {

                      const moisture =
                        crop.moisture !==
                          null &&
                        crop.moisture !==
                          undefined
                          ? Number(
                              crop.moisture
                            )
                          : null;


                      const progress =
                        moisture !== null
                          ? Math.max(
                              0,
                              Math.min(
                                100,
                                moisture
                              )
                            )
                          : 0;


                      const moistureClass =
                        getMoistureClass(
                          moisture
                        );


                      return (

                        <div
                          className={
                            `irrigation-crop-card ${crop.status}`
                          }
                          key={crop.id}
                        >

                          <div className="irrigation-crop-top">

                            <div>

                              <span className="irrigation-crop-label">
                                CROP
                              </span>

                              <h3>
                                {
                                  crop.crop_name ||
                                  "Unnamed Crop"
                                }
                              </h3>

                              {crop.variety && (
                                <p>
                                  {crop.variety}
                                </p>
                              )}

                            </div>


                            <span
                              className={
                                `irrigation-status-badge ${crop.status}`
                              }
                            >
                              {crop.status ===
                                "irrigate"
                                ? "Irrigation Needed"
                                : crop.status ===
                                    "adequate"
                                  ? "Adequate"
                                  : "No Data"}
                            </span>

                          </div>


                          <div className="irrigation-moisture">

                            <div className="irrigation-moisture-header">

                              <span>
                                Soil Moisture
                              </span>

                              <strong>
                                {
                                  moisture !==
                                  null
                                    ? `${moisture}%`
                                    : "—"
                                }
                              </strong>

                            </div>


                            <div className="irrigation-progress">

                              <div
                                className={
                                  `irrigation-progress-fill ${moistureClass}`
                                }
                                style={{
                                  width:
                                    `${progress}%`,
                                }}
                              ></div>

                            </div>


                            <div className="irrigation-threshold">

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


                          <div className="irrigation-recommendation">

                            <div className="irrigation-recommendation-icon">
                              {crop.status ===
                                "irrigate"
                                ? (
                                  <AlertTriangle
                                    size={14}
                                    strokeWidth={2}
                                  />
                                )
                                : crop.status ===
                                    "adequate"
                                  ? (
                                    <CheckCircle2
                                      size={14}
                                      strokeWidth={2}
                                    />
                                  )
                                  : (
                                    <MinusCircle
                                      size={14}
                                      strokeWidth={2}
                                    />
                                  )}
                            </div>

                            <div>

                              <span>
                                Recommendation
                              </span>

                              <strong>
                                {
                                  crop.recommendation
                                }
                              </strong>

                            </div>

                          </div>


                          <div className="irrigation-card-footer">

                            <span>
                              Latest Reading
                            </span>

                            <span>
                              {
                                formatDate(
                                  crop.monitoring
                                    ?.recorded_at
                                )
                              }
                            </span>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </section>


              {/* =================================
                  SOFTWARE LIMITATION
              ================================= */}

              <section className="irrigation-notice">

                <div className="irrigation-notice-icon">
                  <Info size={15} strokeWidth={1.85} />
                </div>

                <div>

                  <h3>
                    Software-Based Recommendation
                  </h3>

                  <p>
                    AgriWatch currently provides
                    irrigation recommendations
                    from soil moisture monitoring
                    data. It does not directly
                    activate or control a physical
                    irrigation pump.
                  </p>

                </div>

              </section>

            </>

          )}

      </div>

    </DashboardLayout>

  );
};


export default Irrigation;