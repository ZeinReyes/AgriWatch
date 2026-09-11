import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getCrops,
  createCrop,
  updateCrop,
  deleteCrop,
} from "../../services/cropService";
import { getFarms } from "../../services/farmService";

const GROWTH_STAGES = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruit Development",
  "Maturity",
  "Harvested",
];

const STATUSES = [
  "Healthy",
  "Needs Attention",
  "Critical",
  "Harvested",
];

const emptyForm = {
  crop_name: "",
  variety: "",
  planting_date: "",
  expected_harvest_date: "",
  growth_stage: "Seedling",
  status: "Healthy",
  farm_id: "",
};

const MyCrops = () => {
  const { user } = useAuth();

  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [farmsLoading, setFarmsLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // =========================================================
  // LOAD CROPS
  // =========================================================

  const loadCrops = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCrops();

      setCrops(data.crops || []);
    } catch (err) {
      console.error("Unable to load crops:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load crops. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD FARMS
  // =========================================================

  const loadFarms = async () => {
    try {
      setFarmsLoading(true);

      const data = await getFarms();

      setFarms(data.farms || []);
    } catch (err) {
      console.error("Unable to load farms:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load farms."
      );
    } finally {
      setFarmsLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
    loadFarms();
  }, []);

  // =========================================================
  // FORM HANDLING
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      farm_id: farms.length > 0 ? String(farms[0].id) : "",
    });

    setEditingCrop(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");

    setEditingCrop(null);

    setForm({
      ...emptyForm,
      farm_id: farms.length > 0
        ? String(farms[0].id)
        : "",
    });

    setShowForm(true);
  };

  const openEditForm = (crop) => {
    setError("");
    setSuccess("");

    setEditingCrop(crop);

    setForm({
      crop_name: crop.crop_name || "",
      variety: crop.variety || "",
      planting_date: crop.planting_date || "",
      expected_harvest_date:
        crop.expected_harvest_date || "",
      growth_stage: crop.growth_stage || "Seedling",
      status: crop.status || "Healthy",
      farm_id: String(crop.farm_id),
    });

    setShowForm(true);
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.crop_name.trim()) {
      setError("Crop name is required.");
      return;
    }

    if (!form.planting_date) {
      setError("Planting date is required.");
      return;
    }

    if (!form.farm_id) {
      setError("Please select a farm.");
      return;
    }

    if (
      form.expected_harvest_date &&
      form.expected_harvest_date < form.planting_date
    ) {
      setError(
        "Expected harvest date cannot be earlier than the planting date."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        crop_name: form.crop_name.trim(),
        variety: form.variety.trim() || null,
        planting_date: form.planting_date,
        expected_harvest_date:
          form.expected_harvest_date || null,
        growth_stage: form.growth_stage,
        status: form.status,
        farm_id: Number(form.farm_id),
      };

      if (editingCrop) {
        await updateCrop(
          editingCrop.id,
          payload
        );

        setSuccess(
          "Crop updated successfully."
        );
      } else {
        await createCrop(payload);

        setSuccess(
          "Crop added successfully."
        );
      }

      resetForm();

      await loadCrops();
    } catch (err) {
      console.error("Unable to save crop:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save crop. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (crop) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${crop.crop_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(crop.id);
      setError("");
      setSuccess("");

      await deleteCrop(crop.id);

      setSuccess(
        "Crop deleted successfully."
      );

      await loadCrops();
    } catch (err) {
      console.error("Unable to delete crop:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete crop."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredCrops = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return crops.filter((crop) => {
      const matchesSearch =
        !searchValue ||
        crop.crop_name
          ?.toLowerCase()
          .includes(searchValue) ||
        crop.variety
          ?.toLowerCase()
          .includes(searchValue) ||
        crop.farm_name
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        crop.status === statusFilter;

      const matchesStage =
        stageFilter === "All" ||
        crop.growth_stage === stageFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStage
      );
    });
  }, [
    crops,
    search,
    statusFilter,
    stageFilter,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalCrops = crops.length;

  const healthyCrops = crops.filter(
    (crop) => crop.status === "Healthy"
  ).length;

  const attentionCrops = crops.filter(
    (crop) => crop.status === "Needs Attention"
  ).length;

  const criticalCrops = crops.filter(
    (crop) => crop.status === "Critical"
  ).length;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "—";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Healthy":
        return "crop-status healthy";

      case "Needs Attention":
        return "crop-status attention";

      case "Critical":
        return "crop-status critical";

      case "Harvested":
        return "crop-status harvested";

      default:
        return "crop-status";
    }
  };

  return (
    <DashboardLayout>
      <div className="crop-page">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="crop-page-header">

          <div>
            <span className="page-eyebrow">
              CROP MANAGEMENT
            </span>

            <h1>My Crops</h1>

            <p>
              Manage your tomato crops,
              planting schedules, growth stages,
              and crop health status.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={openAddForm}
            disabled={farms.length === 0}
          >
            <span className="button-icon">
              +
            </span>

            Add Crop
          </button>

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="alert-message error">
            <span>!</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-message success">
            <span>✓</span>
            {success}
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="crop-stat-grid">

          <div className="crop-stat-card">
            <div className="crop-stat-icon">
              🌱
            </div>

            <div>
              <span>Total Crops</span>
              <strong>{totalCrops}</strong>
            </div>
          </div>

          <div className="crop-stat-card">
            <div className="crop-stat-icon">
              ✓
            </div>

            <div>
              <span>Healthy</span>
              <strong>{healthyCrops}</strong>
            </div>
          </div>

          <div className="crop-stat-card">
            <div className="crop-stat-icon">
              !
            </div>

            <div>
              <span>Needs Attention</span>
              <strong>{attentionCrops}</strong>
            </div>
          </div>

          <div className="crop-stat-card">
            <div className="crop-stat-icon">
              ⚠
            </div>

            <div>
              <span>Critical</span>
              <strong>{criticalCrops}</strong>
            </div>
          </div>

        </div>

        {/* =================================================
            FARM WARNING
        ================================================= */}

        {!farmsLoading &&
          farms.length === 0 && (
            <div className="crop-empty-farm">
              <div className="crop-empty-icon">
                🏡
              </div>

              <div>
                <h3>No farm available</h3>

                <p>
                  You need to create a farm
                  before you can add crops.
                </p>
              </div>
            </div>
          )}

        {/* =================================================
            FORM
        ================================================= */}

        {showForm && (
          <div className="crop-form-card">

            <div className="crop-form-header">

              <div>
                <span className="page-eyebrow">
                  {editingCrop
                    ? "EDIT CROP"
                    : "NEW CROP"}
                </span>

                <h2>
                  {editingCrop
                    ? "Edit Crop"
                    : "Add New Crop"}
                </h2>

                <p>
                  Enter the crop information
                  below.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={resetForm}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="crop-form"
            >

              <div className="form-grid">

                {/* Crop Name */}

                <div className="form-field">
                  <label>
                    Crop Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="crop_name"
                    value={form.crop_name}
                    onChange={handleChange}
                    placeholder="e.g. Tomato Batch A"
                  />
                </div>

                {/* Variety */}

                <div className="form-field">
                  <label>
                    Variety
                  </label>

                  <input
                    type="text"
                    name="variety"
                    value={form.variety}
                    onChange={handleChange}
                    placeholder="e.g. Roma Tomato"
                  />
                </div>

                {/* Farm */}

                <div className="form-field">
                  <label>
                    Farm
                    <span>*</span>
                  </label>

                  <select
                    name="farm_id"
                    value={form.farm_id}
                    onChange={handleChange}
                    disabled={farmsLoading}
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

                {/* Planting Date */}

                <div className="form-field">
                  <label>
                    Planting Date
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="planting_date"
                    value={form.planting_date}
                    onChange={handleChange}
                  />
                </div>

                {/* Expected Harvest */}

                <div className="form-field">
                  <label>
                    Expected Harvest Date
                  </label>

                  <input
                    type="date"
                    name="expected_harvest_date"
                    value={
                      form.expected_harvest_date
                    }
                    onChange={handleChange}
                  />
                </div>

                {/* Growth Stage */}

                <div className="form-field">
                  <label>
                    Growth Stage
                  </label>

                  <select
                    name="growth_stage"
                    value={form.growth_stage}
                    onChange={handleChange}
                  >
                    {GROWTH_STAGES.map(
                      (stage) => (
                        <option
                          key={stage}
                          value={stage}
                        >
                          {stage}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Status */}

                <div className="form-field">
                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>

              <div className="crop-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingCrop
                    ? "Update Crop"
                    : "Add Crop"}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="crop-toolbar">

          <div className="crop-search">
            <span>⌕</span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search crops or farms..."
            />
          </div>

          <div className="crop-filters">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All statuses
              </option>

              {STATUSES.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All growth stages
              </option>

              {GROWTH_STAGES.map((stage) => (
                <option
                  key={stage}
                  value={stage}
                >
                  {stage}
                </option>
              ))}
            </select>

          </div>

        </div>

        {/* =================================================
            CROP CONTENT
        ================================================= */}

        <div className="crop-content-card">

          <div className="crop-content-header">

            <div>
              <h2>Crop Overview</h2>

              <p>
                {filteredCrops.length}{" "}
                {filteredCrops.length === 1
                  ? "crop"
                  : "crops"}{" "}
                displayed
              </p>
            </div>

          </div>

          {loading ? (
            <div className="crop-loading">
              <div className="loading-spinner"></div>

              <p>
                Loading your crops...
              </p>
            </div>
          ) : filteredCrops.length === 0 ? (
            <div className="crop-empty">

              <div className="crop-empty-icon">
                🌱
              </div>

              <h3>
                {crops.length === 0
                  ? "No crops yet"
                  : "No matching crops"}
              </h3>

              <p>
                {crops.length === 0
                  ? "Add your first crop to start monitoring its growth and health."
                  : "Try changing your search or filters."}
              </p>

              {crops.length === 0 &&
                farms.length > 0 && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={openAddForm}
                  >
                    Add Your First Crop
                  </button>
                )}

            </div>
          ) : (
            <div className="crop-table-wrapper">

              <table className="crop-table">

                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Farm</th>
                    <th>Planting Date</th>
                    <th>Harvest Date</th>
                    <th>Growth Stage</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCrops.map(
                    (crop) => (
                      <tr key={crop.id}>

                        <td>
                          <div className="crop-name-cell">

                            <div className="crop-avatar">
                              🌱
                            </div>

                            <div>
                              <strong>
                                {crop.crop_name}
                              </strong>

                              <span>
                                {crop.variety ||
                                  "Tomato crop"}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="crop-farm-name">
                            {crop.farm_name ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            crop.planting_date
                          )}
                        </td>

                        <td>
                          {formatDate(
                            crop.expected_harvest_date
                          )}
                        </td>

                        <td>
                          <span className="crop-stage">
                            {crop.growth_stage}
                          </span>
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              crop.status
                            )}
                          >
                            <span className="status-dot"></span>
                            {crop.status}
                          </span>
                        </td>

                        <td>
                          <div className="crop-actions">

                            <button
                              type="button"
                              className="table-action edit"
                              onClick={() =>
                                openEditForm(
                                  crop
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="table-action delete"
                              onClick={() =>
                                handleDelete(
                                  crop
                                )
                              }
                              disabled={
                                deletingId ===
                                crop.id
                              }
                            >
                              {deletingId ===
                              crop.id
                                ? "..."
                                : "Delete"}
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
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

export default MyCrops;