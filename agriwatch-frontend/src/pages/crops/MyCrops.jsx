import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import {
  getCrops,
  createCrop,
  updateCrop,
  deleteCrop,
} from "../../services/cropService";

import { getFarms } from "../../services/farmService";

import {
  CheckCircle2,
  CircleAlert,
  Edit3,
  Filter,
  Leaf,
  Loader2,
  Plus,
  Search,
  Sprout,
  Trash2,
  Wheat,
  X,
} from "lucide-react";

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
      farm_id:
        farms.length > 0
          ? String(farms[0].id)
          : "",
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
      farm_id:
        farms.length > 0
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
      crop_name:
        crop.crop_name || "",

      variety:
        crop.variety || "",

      planting_date:
        crop.planting_date || "",

      expected_harvest_date:
        crop.expected_harvest_date || "",

      growth_stage:
        crop.growth_stage || "Seedling",

      status:
        crop.status || "Healthy",

      farm_id:
        String(crop.farm_id),
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
        crop_name:
          form.crop_name.trim(),

        variety:
          form.variety.trim() || null,

        planting_date:
          form.planting_date,

        expected_harvest_date:
          form.expected_harvest_date || null,

        growth_stage:
          form.growth_stage,

        status:
          form.status,

        farm_id:
          Number(form.farm_id),
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
      console.error(
        "Unable to save crop:",
        err
      );

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
    const confirmed =
      window.confirm(
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
      console.error(
        "Unable to delete crop:",
        err
      );

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

  const totalCrops =
    crops.length;

  const healthyCrops =
    crops.filter(
      (crop) =>
        crop.status === "Healthy"
    ).length;

  const attentionCrops =
    crops.filter(
      (crop) =>
        crop.status === "Needs Attention"
    ).length;

  const criticalCrops =
    crops.filter(
      (crop) =>
        crop.status === "Critical"
    ).length;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "—";
    }

    const date =
      new Date(
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

          <div className="crop-page-heading">

            <span className="page-eyebrow">
              CROP MANAGEMENT
            </span>

            <h1>
              My Crops
            </h1>

            <p>
              Manage your tomato crops,
              planting schedules,
              growth stages, and crop
              health status.
            </p>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={openAddForm}
            disabled={
              farms.length === 0 ||
              farmsLoading
            }
          >

            <Plus
              size={18}
              strokeWidth={2.2}
              aria-hidden="true"
            />

            <span>
              Add Crop
            </span>

          </button>

        </div>


        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="alert-message error">

            <CircleAlert
              size={19}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {error}
            </span>

          </div>
        )}

        {success && (
          <div className="alert-message success">

            <CheckCircle2
              size={19}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {success}
            </span>

          </div>
        )}


        {/* =================================================
            STATS
        ================================================= */}

        <div className="crop-stat-grid">

          <div className="crop-stat-card">

            <div className="crop-stat-icon total">

              <Sprout
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Total Crops
              </span>

              <strong>
                {totalCrops}
              </strong>

            </div>

          </div>


          <div className="crop-stat-card">

            <div className="crop-stat-icon healthy">

              <CheckCircle2
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Healthy
              </span>

              <strong>
                {healthyCrops}
              </strong>

            </div>

          </div>


          <div className="crop-stat-card">

            <div className="crop-stat-icon attention">

              <CircleAlert
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Needs Attention
              </span>

              <strong>
                {attentionCrops}
              </strong>

            </div>

          </div>


          <div className="crop-stat-card">

            <div className="crop-stat-icon critical">

              <CircleAlert
                size={22}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>

            <div>

              <span>
                Critical
              </span>

              <strong>
                {criticalCrops}
              </strong>

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

              <Wheat
                size={28}
                strokeWidth={1.9}
                aria-hidden="true"
              />

            </div>

            <div>

              <h3>
                No farm available
              </h3>

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
                aria-label="Close crop form"
                title="Close"
              >

                <X
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                />

              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="crop-form"
            >

              <div className="form-grid">

                {/* Crop Name */}

                <div className="form-field">

                  <label htmlFor="crop_name">
                    Crop Name
                    <span>*</span>
                  </label>

                  <input
                    id="crop_name"
                    type="text"
                    name="crop_name"
                    value={
                      form.crop_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Tomato Batch A"
                    required
                  />

                </div>


                {/* Variety */}

                <div className="form-field">

                  <label htmlFor="variety">
                    Variety
                  </label>

                  <input
                    id="variety"
                    type="text"
                    name="variety"
                    value={
                      form.variety
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Roma Tomato"
                  />

                </div>


                {/* Farm */}

                <div className="form-field">

                  <label htmlFor="farm_id">
                    Farm
                    <span>*</span>
                  </label>

                  <select
                    id="farm_id"
                    name="farm_id"
                    value={
                      form.farm_id
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      farmsLoading
                    }
                    required
                  >

                    <option value="">
                      Select a farm
                    </option>

                    {farms.map(
                      (farm) => (
                        <option
                          key={farm.id}
                          value={farm.id}
                        >
                          {
                            farm.farm_name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* Planting Date */}

                <div className="form-field">

                  <label htmlFor="planting_date">
                    Planting Date
                    <span>*</span>
                  </label>

                  <input
                    id="planting_date"
                    type="date"
                    name="planting_date"
                    value={
                      form.planting_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                {/* Expected Harvest */}

                <div className="form-field">

                  <label htmlFor="expected_harvest_date">
                    Expected Harvest Date
                  </label>

                  <input
                    id="expected_harvest_date"
                    type="date"
                    name="expected_harvest_date"
                    value={
                      form.expected_harvest_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                {/* Growth Stage */}

                <div className="form-field">

                  <label htmlFor="growth_stage">
                    Growth Stage
                  </label>

                  <select
                    id="growth_stage"
                    name="growth_stage"
                    value={
                      form.growth_stage
                    }
                    onChange={
                      handleChange
                    }
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

                  <label htmlFor="status">
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
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
                  onClick={
                    resetForm
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    submitting
                  }
                >

                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="button-spinner"
                        aria-hidden="true"
                      />

                      <span>
                        Saving...
                      </span>
                    </>
                  ) : (
                    <>
                      {editingCrop ? (
                        <CheckCircle2
                          size={17}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ) : (
                        <Plus
                          size={17}
                          strokeWidth={2.2}
                          aria-hidden="true"
                        />
                      )}

                      <span>
                        {editingCrop
                          ? "Update Crop"
                          : "Add Crop"}
                      </span>
                    </>
                  )}

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
              aria-label="Search crops or farms"
            />

          </div>


          <div className="crop-filters">

            <div className="crop-filter-control">

              <Filter
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                aria-label="Filter by crop status"
              >

                <option value="All">
                  All statuses
                </option>

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


            <div className="crop-filter-control">

              <Leaf
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />

              <select
                value={
                  stageFilter
                }
                onChange={(event) =>
                  setStageFilter(
                    event.target.value
                  )
                }
                aria-label="Filter by growth stage"
              >

                <option value="All">
                  All growth stages
                </option>

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

          </div>

        </div>


        {/* =================================================
            CROP CONTENT
        ================================================= */}

        <div className="crop-content-card">

          <div className="crop-content-header">

            <div>

              <div className="crop-content-title">

                <Sprout
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <h2>
                  Crop Overview
                </h2>

              </div>

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

              <div className="loading-spinner">

                <Loader2
                  size={24}
                  strokeWidth={2}
                  aria-hidden="true"
                />

              </div>

              <p>
                Loading your crops...
              </p>

            </div>

          ) : filteredCrops.length === 0 ? (

            <div className="crop-empty">

              <div className="crop-empty-icon">

                <Sprout
                  size={34}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

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
                  onClick={
                    openAddForm
                  }
                >

                  <Plus
                    size={17}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />

                  <span>
                    Add Your First Crop
                  </span>

                </button>

              )}

            </div>

          ) : (

            <div className="crop-table-wrapper">

              <table className="crop-table">

                <thead>

                  <tr>

                    <th>
                      Crop
                    </th>

                    <th>
                      Farm
                    </th>

                    <th>
                      Planting Date
                    </th>

                    <th>
                      Harvest Date
                    </th>

                    <th>
                      Growth Stage
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredCrops.map(
                    (crop) => (

                      <tr key={crop.id}>

                        <td>

                          <div className="crop-name-cell">

                            <div className="crop-avatar">

                              <Leaf
                                size={19}
                                strokeWidth={2}
                                aria-hidden="true"
                              />

                            </div>

                            <div>

                              <strong>
                                {
                                  crop.crop_name
                                }
                              </strong>

                              <span>
                                {
                                  crop.variety ||
                                  "Tomato crop"
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span className="crop-farm-name">
                            {
                              crop.farm_name ||
                              "—"
                            }
                          </span>

                        </td>


                        <td>
                          {
                            formatDate(
                              crop.planting_date
                            )
                          }
                        </td>


                        <td>
                          {
                            formatDate(
                              crop.expected_harvest_date
                            )
                          }
                        </td>


                        <td>

                          <span className="crop-stage">

                            <Sprout
                              size={14}
                              strokeWidth={2}
                              aria-hidden="true"
                            />

                            {
                              crop.growth_stage
                            }

                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              getStatusClass(
                                crop.status
                              )
                            }
                          >

                            <span className="status-dot"></span>

                            {
                              crop.status
                            }

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
                              title="Edit crop"
                              aria-label={`Edit ${crop.crop_name}`}
                            >

                              <Edit3
                                size={15}
                                strokeWidth={2}
                                aria-hidden="true"
                              />

                              <span>
                                Edit
                              </span>

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
                              title="Delete crop"
                              aria-label={`Delete ${crop.crop_name}`}
                            >

                              {deletingId ===
                              crop.id ? (

                                <Loader2
                                  size={15}
                                  className="button-spinner"
                                  aria-hidden="true"
                                />

                              ) : (

                                <Trash2
                                  size={15}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />

                              )}

                              <span>
                                {deletingId ===
                                crop.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </span>

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