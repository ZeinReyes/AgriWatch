import {
  useEffect,
  useState,
} from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import {
  createFarm,
  deleteFarm,
  getFarms,
  updateFarm,
} from "../../services/farmService";


const MyFarm = () => {

  const [farms, setFarms] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingFarm, setEditingFarm] =
    useState(null);


  const [formData, setFormData] = useState({
    farm_name: "",
    location: "",
    area: "",
    description: "",
  });


  // =================================================
  // LOAD FARMS
  // =================================================

  const loadFarms = async () => {

    try {

      setLoading(true);
      setError("");

      const data = await getFarms();

      setFarms(
        data.farms || []
      );

    } catch (err) {

      console.error(
        "Unable to load farms:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load your farms."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadFarms();

  }, []);


  // =================================================
  // HANDLE INPUT
  // =================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // =================================================
  // RESET FORM
  // =================================================

  const resetForm = () => {

    setFormData({
      farm_name: "",
      location: "",
      area: "",
      description: "",
    });

    setEditingFarm(null);

    setShowForm(false);

  };


  // =================================================
  // OPEN CREATE FORM
  // =================================================

  const handleAddFarm = () => {

    setSuccess("");
    setError("");

    setEditingFarm(null);

    setFormData({
      farm_name: "",
      location: "",
      area: "",
      description: "",
    });

    setShowForm(true);

  };


  // =================================================
  // OPEN EDIT FORM
  // =================================================

  const handleEdit = (farm) => {

    setSuccess("");
    setError("");

    setEditingFarm(farm);

    setFormData({
      farm_name: farm.farm_name || "",
      location: farm.location || "",
      area: farm.area ?? "",
      description: farm.description || "",
    });

    setShowForm(true);

  };


  // =================================================
  // SUBMIT FORM
  // =================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);


    try {

      const payload = {
        farm_name:
          formData.farm_name.trim(),

        location:
          formData.location.trim(),

        area:
          formData.area === ""
            ? null
            : Number(formData.area),

        description:
          formData.description.trim(),
      };


      let response;


      // ---------------------------------------------
      // CREATE
      // ---------------------------------------------

      if (!editingFarm) {

        response =
          await createFarm(
            payload
          );

        setSuccess(
          "Farm created successfully."
        );

      }

      // ---------------------------------------------
      // UPDATE
      // ---------------------------------------------

      else {

        response =
          await updateFarm(
            editingFarm.id,
            payload
          );

        setSuccess(
          "Farm updated successfully."
        );

      }


      // ---------------------------------------------
      // UPDATE LOCAL STATE
      // ---------------------------------------------

      const updatedFarm =
        response.farm;


      if (!editingFarm) {

        setFarms((previous) => [
          updatedFarm,
          ...previous,
        ]);

      } else {

        setFarms((previous) =>
          previous.map((farm) =>
            farm.id === updatedFarm.id
              ? updatedFarm
              : farm
          )
        );

      }


      resetForm();

    } catch (err) {

      console.error(
        "Unable to save farm:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to save farm."
      );

    } finally {

      setSaving(false);

    }
  };


  // =================================================
  // DELETE FARM
  // =================================================

  const handleDelete = async (farm) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${farm.farm_name}"?`
      );

    if (!confirmed) {
      return;
    }


    try {

      setError("");
      setSuccess("");

      await deleteFarm(
        farm.id
      );


      setFarms((previous) =>
        previous.filter(
          (item) =>
            item.id !== farm.id
        )
      );


      setSuccess(
        "Farm deleted successfully."
      );

    } catch (err) {

      console.error(
        "Unable to delete farm:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to delete farm."
      );

    }
  };


  // =================================================
  // RENDER
  // =================================================

  return (
    <DashboardLayout>

      <div className="farm-page">

        {/* ==========================================
            PAGE HEADER
        =========================================== */}

        <div className="farm-page-header">

          <div>

            <div className="page-eyebrow">
              FARM MANAGEMENT
            </div>

            <h1>
              My Farm
            </h1>

            <p>
              Manage your farm information
              and prepare your crops for
              monitoring.
            </p>

          </div>


          {!showForm && (
            <button
              className="primary-button"
              onClick={handleAddFarm}
            >
              <span>+</span>
              Add Farm
            </button>
          )}

        </div>


        {/* ==========================================
            SUCCESS MESSAGE
        =========================================== */}

        {success && (

          <div className="farm-alert farm-alert-success">

            <span>✓</span>

            <span>
              {success}
            </span>

          </div>

        )}


        {/* ==========================================
            ERROR MESSAGE
        =========================================== */}

        {error && (

          <div className="farm-alert farm-alert-error">

            <span>!</span>

            <span>
              {error}
            </span>

          </div>

        )}


        {/* ==========================================
            FARM FORM
        =========================================== */}

        {showForm && (

          <div className="farm-form-card">

            <div className="farm-form-header">

              <div>

                <h2>
                  {editingFarm
                    ? "Edit Farm"
                    : "Add New Farm"}
                </h2>

                <p>
                  Enter the basic information
                  about your farm.
                </p>

              </div>

              <button
                className="close-button"
                onClick={resetForm}
                type="button"
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="farm-form"
            >

              {/* FARM NAME */}

              <div className="form-group">

                <label htmlFor="farm_name">
                  Farm Name
                </label>

                <input
                  id="farm_name"
                  name="farm_name"
                  type="text"
                  value={formData.farm_name}
                  onChange={handleChange}
                  placeholder="e.g. Green Valley Farm"
                  required
                />

              </div>


              {/* LOCATION */}

              <div className="form-group">

                <label htmlFor="location">
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Batangas, Philippines"
                  required
                />

              </div>


              {/* AREA */}

              <div className="form-group">

                <label htmlFor="area">
                  Farm Area
                  <span className="optional-label">
                    Optional
                  </span>
                </label>

                <div className="input-with-unit">

                  <input
                    id="area"
                    name="area"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                  />

                  <span>
                    hectares
                  </span>

                </div>

              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label htmlFor="description">
                  Description
                  <span className="optional-label">
                    Optional
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your farm..."
                  rows="4"
                />

              </div>


              {/* FORM ACTIONS */}

              <div className="farm-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editingFarm
                      ? "Save Changes"
                      : "Create Farm"}

                </button>

              </div>

            </form>

          </div>

        )}


        {/* ==========================================
            LOADING
        =========================================== */}

        {loading && (

          <div className="farm-loading">

            <div className="loading-spinner"></div>

            <p>
              Loading your farms...
            </p>

          </div>

        )}


        {/* ==========================================
            EMPTY STATE
        =========================================== */}

        {!loading &&
          !showForm &&
          farms.length === 0 && (

            <div className="farm-empty">

              <div className="farm-empty-icon">
                🌱
              </div>

              <h2>
                No farm registered yet
              </h2>

              <p>
                Add your farm to start
                managing crops and monitoring
                your growing environment.
              </p>

              <button
                className="primary-button"
                onClick={handleAddFarm}
              >
                <span>+</span>
                Add Your Farm
              </button>

            </div>

          )}


        {/* ==========================================
            FARM CARDS
        =========================================== */}

        {!loading &&
          farms.length > 0 && (

            <div className="farm-grid">

              {farms.map((farm) => (

                <div
                  className="farm-card"
                  key={farm.id}
                >

                  <div className="farm-card-top">

                    <div className="farm-icon">
                      🌱
                    </div>

                    <div className="farm-card-actions">

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(farm)
                        }
                        title="Edit farm"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-action"
                        onClick={() =>
                          handleDelete(farm)
                        }
                        title="Delete farm"
                      >
                        Delete
                      </button>

                    </div>

                  </div>


                  <h2>
                    {farm.farm_name}
                  </h2>


                  <div className="farm-detail">

                    <span className="farm-detail-icon">
                      📍
                    </span>

                    <span>
                      {farm.location}
                    </span>

                  </div>


                  {farm.area !== null &&
                    farm.area !== undefined && (

                    <div className="farm-detail">

                      <span className="farm-detail-icon">
                        📐
                      </span>

                      <span>
                        {farm.area} hectares
                      </span>

                    </div>

                  )}


                  {farm.description && (

                    <p className="farm-description">
                      {farm.description}
                    </p>

                  )}


                  <div className="farm-card-footer">

                    <span>
                      Farm ID #{farm.id}
                    </span>

                    <span>
                      {farm.created_at
                        ? new Date(
                            farm.created_at
                          ).toLocaleDateString()
                        : ""}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

      </div>

    </DashboardLayout>
  );
};


export default MyFarm;