import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

import { getFarms } from "../../services/farmService";
import { getCrops } from "../../services/cropService";

import {
  getCropMonitoring,
  createMonitoringRecord,
  deleteMonitoringRecord,
} from "../../services/monitoringService";

import "./Monitoring.css";


const initialForm = {
  soil_moisture: "",
  crop_temperature: "",
  pest_detected: false,
  disease_detected: false,
  discoloration_detected: false,
  plant_condition: "Healthy",
};


function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


function getConditionClass(condition) {
  if (condition === "Critical") return "critical";
  if (condition === "Needs Attention") return "warning";
  return "healthy";
}


function Monitoring() {

  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);

  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedCropId, setSelectedCropId] = useState("");

  const [records, setRecords] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // =====================================================
  // LOAD FARMS + CROPS
  // =====================================================

  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);
        setError("");

        const [farmData, cropData] = await Promise.all([
          getFarms(),
          getCrops(),
        ]);

        setFarms(farmData.farms || []);
        setCrops(cropData.crops || []);

      } catch (err) {

        console.error(
          "Unable to load monitoring data:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to load farms and crops."
        );

      } finally {

        setLoading(false);

      }
    };


    loadData();

  }, []);


  // =====================================================
  // FILTER CROPS BY FARM
  // =====================================================

  const availableCrops = useMemo(() => {

    if (!selectedFarmId) {
      return crops;
    }

    return crops.filter(
      (crop) =>
        String(crop.farm_id) === String(selectedFarmId)
    );

  }, [crops, selectedFarmId]);


  // =====================================================
  // SELECT FARM
  // =====================================================

  const handleFarmChange = (event) => {

    const farmId = event.target.value;

    setSelectedFarmId(farmId);

    setSelectedCropId("");

    setRecords([]);

    setError("");
    setSuccess("");

  };


  // =====================================================
  // SELECT CROP
  // =====================================================

  const handleCropChange = async (event) => {

    const cropId = event.target.value;

    setSelectedCropId(cropId);

    setRecords([]);

    setError("");
    setSuccess("");

    if (!cropId) {
      return;
    }

    try {

      setLoadingRecords(true);

      const data = await getCropMonitoring(cropId);

      setRecords(data.monitoring || []);

    } catch (err) {

      console.error(
        "Unable to load monitoring records:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load monitoring records."
      );

    } finally {

      setLoadingRecords(false);

    }

  };


  // =====================================================
  // CURRENT RECORD
  // =====================================================

  const latestRecord = records.length > 0
    ? records[0]
    : null;


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox"
        ? checked
        : value,
    }));

  };


  // =====================================================
  // OPEN FORM
  // =====================================================

  const openForm = () => {

    setForm(initialForm);

    setError("");
    setSuccess("");

    setShowForm(true);

  };


  // =====================================================
  // SUBMIT MONITORING
  // =====================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedCropId) {

      setError(
        "Please select a crop first."
      );

      return;
    }


    if (
      form.soil_moisture === "" &&
      form.crop_temperature === ""
    ) {

      setError(
        "Please enter at least one monitoring measurement."
      );

      return;
    }


    const payload = {

      crop_id: Number(selectedCropId),

      soil_moisture:
        form.soil_moisture === ""
          ? null
          : Number(form.soil_moisture),

      crop_temperature:
        form.crop_temperature === ""
          ? null
          : Number(form.crop_temperature),

      pest_detected:
        form.pest_detected,

      disease_detected:
        form.disease_detected,

      discoloration_detected:
        form.discoloration_detected,

      plant_condition:
        form.plant_condition,
    };


    try {

      setSubmitting(true);

      const data =
        await createMonitoringRecord(payload);

      setSuccess(
        data.message ||
        "Monitoring record added successfully."
      );

      setShowForm(false);

      setForm(initialForm);


      const refreshed =
        await getCropMonitoring(
          selectedCropId
        );

      setRecords(
        refreshed.monitoring || []
      );

    } catch (err) {

      console.error(
        "Unable to create monitoring record:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to create monitoring record."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // =====================================================
  // DELETE RECORD
  // =====================================================

  const handleDelete = async (record) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this monitoring record?"
    );

    if (!confirmed) {
      return;
    }


    try {

      setDeletingId(record.id);

      setError("");
      setSuccess("");

      await deleteMonitoringRecord(
        record.id
      );

      setRecords((previous) =>
        previous.filter(
          (item) => item.id !== record.id
        )
      );

      setSuccess(
        "Monitoring record deleted successfully."
      );

    } catch (err) {

      console.error(
        "Unable to delete monitoring record:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to delete monitoring record."
      );

    } finally {

      setDeletingId(null);

    }

  };


  const selectedCrop =
    crops.find(
      (crop) =>
        String(crop.id) ===
        String(selectedCropId)
    );


  if (loading) {

    return (
      <DashboardLayout>
        <div className="monitoring-page">

          <div className="monitoring-loading">
            Loading monitoring...
          </div>

        </div>
      </DashboardLayout>
    );

  }


  return (
    <DashboardLayout>

      <div className="monitoring-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="monitoring-header">

          <div>

            <h1>
              Crop Monitoring
            </h1>

            <p>
              Monitor the condition and environmental
              status of your tomato crops.
            </p>

          </div>

          {selectedCropId && (
            <button
              className="monitoring-primary-button"
              onClick={openForm}
            >
              + Add Monitoring
            </button>
          )}

        </div>


        {/* =================================================
            MESSAGES
        ================================================= */}

        {error && (
          <div className="monitoring-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="monitoring-message success">
            {success}
          </div>
        )}


        {/* =================================================
            FARM / CROP SELECTION
        ================================================= */}

        <section className="monitoring-card selection-card">

          <div className="selection-field">

            <label>
              Farm
            </label>

            <select
              value={selectedFarmId}
              onChange={handleFarmChange}
            >

              <option value="">
                Select a farm
              </option>

              {farms.map((farm) => (

                <option
                  key={farm.id}
                  value={farm.id}
                >
                  {farm.farm_name}
                </option>

              ))}

            </select>

          </div>


          <div className="selection-field">

            <label>
              Crop
            </label>

            <select
              value={selectedCropId}
              onChange={handleCropChange}
            >

              <option value="">
                Select a crop
              </option>

              {availableCrops.map((crop) => (

                <option
                  key={crop.id}
                  value={crop.id}
                >
                  {crop.crop_name}
                  {crop.variety
                    ? ` — ${crop.variety}`
                    : ""}
                </option>

              ))}

            </select>

          </div>

        </section>


        {!selectedCropId ? (

          <div className="monitoring-empty">

            <div className="monitoring-empty-icon">
              🌱
            </div>

            <h2>
              Select a crop to begin
            </h2>

            <p>
              Choose a farm and crop to view
              monitoring information.
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                CURRENT MONITORING
            ================================================= */}

            <section className="monitoring-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Current Monitoring
                  </h2>

                  <p>
                    Latest available reading for{" "}
                    <strong>
                      {selectedCrop?.crop_name}
                    </strong>
                  </p>

                </div>

              </div>


              {latestRecord ? (

                <div className="monitoring-metrics">

                  <div className="metric-card">

                    <span className="metric-label">
                      Soil Moisture
                    </span>

                    <strong className="metric-value">

                      {latestRecord.soil_moisture !== null
                        ? `${latestRecord.soil_moisture}%`
                        : "—"}

                    </strong>

                    <span className="metric-description">
                      Soil moisture level
                    </span>

                  </div>


                  <div className="metric-card">

                    <span className="metric-label">
                      Crop Temperature
                    </span>

                    <strong className="metric-value">

                      {latestRecord.crop_temperature !== null
                        ? `${latestRecord.crop_temperature}°C`
                        : "—"}

                    </strong>

                    <span className="metric-description">
                      Recorded crop temperature
                    </span>

                  </div>


                  <div className="metric-card">

                    <span className="metric-label">
                      Plant Condition
                    </span>

                    <strong
                      className={`condition-badge ${getConditionClass(
                        latestRecord.plant_condition
                      )}`}
                    >
                      {latestRecord.plant_condition}
                    </strong>

                    <span className="metric-description">
                      Latest recorded condition
                    </span>

                  </div>

                </div>

              ) : (

                <div className="monitoring-no-records">

                  <h3>
                    No monitoring data yet
                  </h3>

                  <p>
                    Add the first monitoring record
                    for this crop.
                  </p>

                  <button
                    className="monitoring-primary-button"
                    onClick={openForm}
                  >
                    Add Monitoring Record
                  </button>

                </div>

              )}

            </section>


            {/* =================================================
                DETECTION RESULTS
            ================================================= */}

            {latestRecord && (

              <section className="monitoring-section">

                <div className="section-heading">

                  <div>

                    <h2>
                      Detection Results
                    </h2>

                    <p>
                      Latest crop condition detections
                    </p>

                  </div>

                </div>


                <div className="detection-grid">

                  <div className="detection-card">

                    <span>
                      Pest Detection
                    </span>

                    <strong
                      className={
                        latestRecord.pest_detected
                          ? "detected"
                          : "not-detected"
                      }
                    >
                      {latestRecord.pest_detected
                        ? "Detected"
                        : "Not Detected"}
                    </strong>

                  </div>


                  <div className="detection-card">

                    <span>
                      Disease Detection
                    </span>

                    <strong
                      className={
                        latestRecord.disease_detected
                          ? "detected"
                          : "not-detected"
                      }
                    >
                      {latestRecord.disease_detected
                        ? "Detected"
                        : "Not Detected"}
                    </strong>

                  </div>


                  <div className="detection-card">

                    <span>
                      Discoloration Detection
                    </span>

                    <strong
                      className={
                        latestRecord.discoloration_detected
                          ? "detected"
                          : "not-detected"
                      }
                    >
                      {latestRecord.discoloration_detected
                        ? "Detected"
                        : "Not Detected"}
                    </strong>

                  </div>

                </div>

              </section>

            )}


            {/* =================================================
                HISTORY
            ================================================= */}

            <section className="monitoring-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Monitoring History
                  </h2>

                  <p>
                    Previous monitoring records
                  </p>

                </div>

              </div>


              {loadingRecords ? (

                <div className="monitoring-loading">
                  Loading records...
                </div>

              ) : records.length === 0 ? (

                <div className="monitoring-no-records">
                  No monitoring records available.
                </div>

              ) : (

                <div className="monitoring-table-wrapper">

                  <table className="monitoring-table">

                    <thead>

                      <tr>
                        <th>Date</th>
                        <th>Moisture</th>
                        <th>Temperature</th>
                        <th>Pest</th>
                        <th>Disease</th>
                        <th>Discoloration</th>
                        <th>Condition</th>
                        <th>Action</th>
                      </tr>

                    </thead>

                    <tbody>

                      {records.map((record) => (

                        <tr key={record.id}>

                          <td>
                            {formatDate(
                              record.recorded_at
                            )}
                          </td>

                          <td>
                            {record.soil_moisture !== null
                              ? `${record.soil_moisture}%`
                              : "—"}
                          </td>

                          <td>
                            {record.crop_temperature !== null
                              ? `${record.crop_temperature}°C`
                              : "—"}
                          </td>

                          <td>
                            {record.pest_detected
                              ? "Detected"
                              : "None"}
                          </td>

                          <td>
                            {record.disease_detected
                              ? "Detected"
                              : "None"}
                          </td>

                          <td>
                            {record.discoloration_detected
                              ? "Detected"
                              : "None"}
                          </td>

                          <td>

                            <span
                              className={`condition-badge ${getConditionClass(
                                record.plant_condition
                              )}`}
                            >
                              {record.plant_condition}
                            </span>

                          </td>

                          <td>

                            <button
                              className="table-delete-button"
                              onClick={() =>
                                handleDelete(record)
                              }
                              disabled={
                                deletingId === record.id
                              }
                            >
                              {deletingId === record.id
                                ? "..."
                                : "Delete"}
                            </button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          </>

        )}


        {/* =================================================
            ADD MONITORING MODAL
        ================================================= */}

        {showForm && (

          <div
            className="monitoring-modal-overlay"
            onClick={() => setShowForm(false)}
          >

            <div
              className="monitoring-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <h2>
                    Add Monitoring Record
                  </h2>

                  <p>
                    {selectedCrop?.crop_name}
                  </p>

                </div>

                <button
                  className="modal-close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>

              </div>


              <form onSubmit={handleSubmit}>

                <div className="form-grid">

                  <div className="form-field">

                    <label>
                      Soil Moisture (%)
                    </label>

                    <input
                      type="number"
                      name="soil_moisture"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.soil_moisture}
                      onChange={handleChange}
                      placeholder="e.g. 27.5"
                    />

                  </div>


                  <div className="form-field">

                    <label>
                      Crop Temperature (°C)
                    </label>

                    <input
                      type="number"
                      name="crop_temperature"
                      step="0.1"
                      value={form.crop_temperature}
                      onChange={handleChange}
                      placeholder="e.g. 36.4"
                    />

                  </div>

                </div>


                <div className="form-field">

                  <label>
                    Plant Condition
                  </label>

                  <select
                    name="plant_condition"
                    value={form.plant_condition}
                    onChange={handleChange}
                  >
                    <option value="Healthy">
                      Healthy
                    </option>

                    <option value="Needs Attention">
                      Needs Attention
                    </option>

                    <option value="Critical">
                      Critical
                    </option>
                  </select>

                </div>


                <div className="detection-form-section">

                  <h3>
                    Detection Results
                  </h3>


                  <label className="checkbox-field">

                    <input
                      type="checkbox"
                      name="pest_detected"
                      checked={form.pest_detected}
                      onChange={handleChange}
                    />

                    <span>
                      Pest detected
                    </span>

                  </label>


                  <label className="checkbox-field">

                    <input
                      type="checkbox"
                      name="disease_detected"
                      checked={form.disease_detected}
                      onChange={handleChange}
                    />

                    <span>
                      Disease detected
                    </span>

                  </label>


                  <label className="checkbox-field">

                    <input
                      type="checkbox"
                      name="discoloration_detected"
                      checked={
                        form.discoloration_detected
                      }
                      onChange={handleChange}
                    />

                    <span>
                      Discoloration detected
                    </span>

                  </label>

                </div>


                <div className="modal-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowForm(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="monitoring-primary-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : "Save Record"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}


export default Monitoring;