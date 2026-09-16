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

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import {
  CheckCircle2,
  CircleAlert,
  Compass,
  Edit3,
  Farm,
  Info,
  Leaf,
  Loader2,
  MapPin,
  MapPinned,
  Maximize2,
  Navigation,
  Plus,
  Ruler,
  Search,
  Sprout,
  Trash2,
  X,
} from "lucide-react";

import "leaflet/dist/leaflet.css";


// =====================================================
// FIX LEAFLET DEFAULT MARKER ICON
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


// =====================================================
// DEFAULT PHILIPPINES LOCATION
// =====================================================

const DEFAULT_LOCATION = [
  12.8797,
  121.7740,
];


// =====================================================
// MAP CLICK HANDLER
// =====================================================

const MapClickHandler = ({
  onLocationSelect,
}) => {
  useMapEvents({
    click(event) {
      onLocationSelect(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
};


// =====================================================
// MAP CENTER COMPONENT
// =====================================================

const MapCenter = ({
  position,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.flyTo(
      position,
      16,
      {
        duration: 0.8,
      }
    );
  }, [
    position,
    map,
  ]);

  return null;
};


// =====================================================
// MY FARM
// =====================================================

const MyFarm = () => {
  const [farms, setFarms] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingFarm, setEditingFarm] =
    useState(null);


  // =================================================
  // LOCATION STATE
  // =================================================

  const [mapPosition, setMapPosition] =
    useState(DEFAULT_LOCATION);

  const [locationSearch, setLocationSearch] =
    useState("");

  const [locationResults, setLocationResults] =
    useState([]);

  const [searchingLocation, setSearchingLocation] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [gettingLocation, setGettingLocation] =
    useState(false);


  // =================================================
  // FORM DATA
  // =================================================

  const [formData, setFormData] =
    useState({
      farm_name: "",
      location: "",
      latitude: "",
      longitude: "",
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

      const data =
        await getFarms();

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

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  // =================================================
  // RESET LOCATION
  // =================================================

  const resetLocation = () => {
    setMapPosition(
      DEFAULT_LOCATION
    );

    setLocationSearch("");

    setLocationResults([]);

    setLocationError("");
  };


  // =================================================
  // RESET FORM
  // =================================================

  const resetForm = () => {
    setFormData({
      farm_name: "",
      location: "",
      latitude: "",
      longitude: "",
      area: "",
      description: "",
    });

    setEditingFarm(null);

    setShowForm(false);

    resetLocation();
  };


  // =================================================
  // OPEN CREATE FORM
  // =================================================

  const handleAddFarm = () => {
    setSuccess("");
    setError("");
    setLocationError("");
    setEditingFarm(null);

    setFormData({
      farm_name: "",
      location: "",
      latitude: "",
      longitude: "",
      area: "",
      description: "",
    });

    setMapPosition(
      DEFAULT_LOCATION
    );

    setLocationSearch("");

    setLocationResults([]);

    setShowForm(true);
  };


  // =================================================
  // OPEN EDIT FORM
  // =================================================

  const handleEdit = (
    farm
  ) => {
    setSuccess("");
    setError("");
    setLocationError("");

    setEditingFarm(farm);

    const latitude =
      farm.latitude ??
      "";

    const longitude =
      farm.longitude ??
      "";

    setFormData({
      farm_name:
        farm.farm_name || "",

      location:
        farm.location || "",

      latitude,
      longitude,

      area:
        farm.area ?? "",

      description:
        farm.description || "",
    });

    if (
      latitude !== "" &&
      longitude !== ""
    ) {
      setMapPosition([
        Number(latitude),
        Number(longitude),
      ]);

    } else {
      setMapPosition(
        DEFAULT_LOCATION
      );
    }

    setLocationSearch(
      farm.location || ""
    );

    setLocationResults([]);

    setShowForm(true);
  };


  // =================================================
  // REVERSE GEOCODE
  // =================================================

  const reverseGeocode = async (
    latitude,
    longitude
  ) => {
    try {
      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Unable to identify this location."
        );
      }

      const data =
        await response.json();

      const displayName =
        data.display_name ||
        `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setFormData(
        (previous) => ({
          ...previous,

          location:
            displayName,

          latitude:
            latitude.toFixed(6),

          longitude:
            longitude.toFixed(6),
        })
      );

      setLocationSearch(
        displayName
      );

    } catch (error) {
      console.error(
        "Reverse geocoding failed:",
        error
      );

      setFormData(
        (previous) => ({
          ...previous,

          latitude:
            latitude.toFixed(6),

          longitude:
            longitude.toFixed(6),
        })
      );

      setLocationError(
        "Location selected, but the address could not be determined."
      );
    }
  };


  // =================================================
  // SELECT MAP LOCATION
  // =================================================

  const handleLocationSelect = async (
    latitude,
    longitude
  ) => {
    const position = [
      latitude,
      longitude,
    ];

    setMapPosition(
      position
    );

    setLocationError("");

    setFormData(
      (previous) => ({
        ...previous,

        latitude:
          latitude.toFixed(6),

        longitude:
          longitude.toFixed(6),
      })
    );

    await reverseGeocode(
      latitude,
      longitude
    );
  };


  // =================================================
  // SEARCH LOCATION
  // =================================================

  const handleLocationSearch = async (
    event
  ) => {
    event.preventDefault();

    const query =
      locationSearch.trim();

    if (!query) {
      setLocationError(
        "Enter a location to search."
      );

      return;
    }

    try {
      setSearchingLocation(true);

      setLocationError("");

      setLocationResults([]);

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5&addressdetails=1`,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Location search failed."
        );
      }

      const results =
        await response.json();

      if (!results.length) {
        setLocationError(
          "No matching locations were found."
        );

        return;
      }

      setLocationResults(
        results
      );

    } catch (error) {
      console.error(
        "Location search failed:",
        error
      );

      setLocationError(
        "Unable to search for this location. Please try again."
      );

    } finally {
      setSearchingLocation(false);
    }
  };


  // =================================================
  // SELECT SEARCH RESULT
  // =================================================

  const handleSearchResult = async (
    result
  ) => {
    const latitude =
      Number(result.lat);

    const longitude =
      Number(result.lon);

    setLocationResults([]);

    setLocationSearch(
      result.display_name
    );

    await handleLocationSelect(
      latitude,
      longitude
    );
  };


  // =================================================
  // USE CURRENT LOCATION
  // =================================================

  const handleUseCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setLocationError(
          "Your browser does not support location services."
        );

        return;
      }

      setGettingLocation(true);

      setLocationError("");

      navigator.geolocation.getCurrentPosition(

        async (position) => {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          await handleLocationSelect(
            latitude,
            longitude
          );

          setGettingLocation(false);
        },

        (error) => {
          console.error(
            "Geolocation error:",
            error
          );

          let message =
            "Unable to get your current location.";

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            message =
              "Location permission was denied. Please allow location access in your browser.";

          } else if (
            error.code ===
            error.POSITION_UNAVAILABLE
          ) {
            message =
              "Your current location is unavailable.";

          } else if (
            error.code ===
            error.TIMEOUT
          ) {
            message =
              "Getting your location timed out.";
          }

          setLocationError(
            message
          );

          setGettingLocation(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };


  // =================================================
  // SUBMIT FORM
  // =================================================

  const handleSubmit = async (
    event
  ) => {
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

        latitude:
          formData.latitude === ""
            ? null
            : Number(formData.latitude),

        longitude:
          formData.longitude === ""
            ? null
            : Number(formData.longitude),

        area:
          formData.area === ""
            ? null
            : Number(formData.area),

        description:
          formData.description.trim(),
      };

      if (
        payload.latitude === null ||
        payload.longitude === null
      ) {
        throw {
          response: {
            data: {
              message:
                "Please select a location on the map or use the current location button.",
            },
          },
        };
      }

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
        setFarms(
          (previous) => [
            updatedFarm,
            ...previous,
          ]
        );

      } else {
        setFarms(
          (previous) =>
            previous.map(
              (farm) =>
                farm.id ===
                updatedFarm.id
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

  const handleDelete = async (
    farm
  ) => {
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

      setFarms(
        (previous) =>
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
              Manage your farm information,
              location, and growing environment.
            </p>

          </div>


          {!showForm && (

            <button
              className="primary-button"
              onClick={handleAddFarm}
              type="button"
            >

              <Plus
                size={18}
                strokeWidth={2.2}
                aria-hidden="true"
              />

              <span>
                Add Farm
              </span>

            </button>

          )}

        </div>


        {/* ==========================================
            SUCCESS
        =========================================== */}

        {success && (

          <div className="farm-alert farm-alert-success">

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


        {/* ==========================================
            ERROR
        =========================================== */}

        {error && (

          <div className="farm-alert farm-alert-error">

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
                  Enter your farm information
                  and pinpoint its location.
                </p>

              </div>


              <button
                className="close-button"
                onClick={resetForm}
                type="button"
                aria-label="Close farm form"
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
              className="farm-form"
            >

              {/* =================================
                  FARM NAME
              ================================== */}

              <div className="form-group">

                <label htmlFor="farm_name">
                  Farm Name
                </label>

                <input
                  id="farm_name"
                  name="farm_name"
                  type="text"
                  value={
                    formData.farm_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Green Valley Farm"
                  required
                />

              </div>


              {/* =================================
                  LOCATION SEARCH
              ================================== */}

              <div className="form-group">

                <label>
                  Farm Location
                </label>

                <div className="location-search-row">

                  <input
                    type="text"
                    value={
                      locationSearch
                    }
                    onChange={(event) => {

                      setLocationSearch(
                        event.target.value
                      );

                      setLocationResults(
                        []
                      );

                    }}
                    placeholder="Search a city, municipality, barangay, or address"
                  />

                  <button
                    type="button"
                    className="secondary-button location-search-button"
                    onClick={
                      handleLocationSearch
                    }
                    disabled={
                      searchingLocation
                    }
                  >

                    {searchingLocation ? (
                      <>
                        <Loader2
                          size={16}
                          className="button-spinner"
                          aria-hidden="true"
                        />

                        <span>
                          Searching...
                        </span>
                      </>
                    ) : (
                      <>
                        <Search
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />

                        <span>
                          Search
                        </span>
                      </>
                    )}

                  </button>

                </div>


                {/* SEARCH RESULTS */}

                {locationResults.length >
                  0 && (

                  <div className="location-results">

                    {locationResults.map(
                      (result) => (

                        <button
                          type="button"
                          key={
                            result.place_id
                          }
                          className="location-result"
                          onClick={() =>
                            handleSearchResult(
                              result
                            )
                          }
                        >

                          <span className="location-result-icon">

                            <MapPin
                              size={17}
                              strokeWidth={2}
                              aria-hidden="true"
                            />

                          </span>

                          <span>
                            {
                              result.display_name
                            }
                          </span>

                        </button>

                      )
                    )}

                  </div>

                )}


                <button
                  type="button"
                  className="current-location-button"
                  onClick={
                    handleUseCurrentLocation
                  }
                  disabled={
                    gettingLocation
                  }
                >

                  {gettingLocation ? (

                    <Loader2
                      size={16}
                      className="button-spinner"
                      aria-hidden="true"
                    />

                  ) : (

                    <Navigation
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                  )}

                  {gettingLocation
                    ? "Getting your location..."
                    : "Use my current location"}

                </button>

              </div>


              {/* =================================
                  MAP
              ================================== */}

              <div className="form-group">

                <label>
                  Pinpoint Farm Location
                </label>

                <div className="farm-map-wrapper">

                  <MapContainer
                    center={
                      mapPosition
                    }
                    zoom={6}
                    scrollWheelZoom={true}
                    className="farm-map"
                  >

                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />


                    <MapCenter
                      position={
                        mapPosition
                      }
                    />


                    <MapClickHandler
                      onLocationSelect={
                        handleLocationSelect
                      }
                    />


                    {formData.latitude !== ""
                      &&
                      formData.longitude !== "" && (

                      <Marker
                        position={[
                          Number(
                            formData.latitude
                          ),
                          Number(
                            formData.longitude
                          ),
                        ]}
                        draggable={true}
                        eventHandlers={{

                          dragend: async (
                            event
                          ) => {

                            const marker =
                              event.target;

                            const position =
                              marker.getLatLng();

                            await handleLocationSelect(
                              position.lat,
                              position.lng
                            );

                          },

                        }}
                      >

                        <Popup>

                          <strong>
                            {formData.farm_name ||
                              "Farm location"}
                          </strong>

                          <br />

                          Drag this marker or
                          click on the map to
                          change the location.

                        </Popup>

                      </Marker>

                    )}

                  </MapContainer>

                </div>


                <div className="location-help">

                  <Info
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <span>
                    Click on the map or drag the
                    marker to pinpoint the exact
                    location of your farm.
                  </span>

                </div>


                {formData.latitude !== ""
                  &&
                  formData.longitude !== "" && (

                  <div className="coordinates-display">

                    <div>

                      <span>
                        Latitude
                      </span>

                      <strong>
                        {
                          formData.latitude
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Longitude
                      </span>

                      <strong>
                        {
                          formData.longitude
                        }
                      </strong>

                    </div>

                  </div>

                )}


                {locationError && (

                  <div className="location-error">

                    <CircleAlert
                      size={17}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                    <span>
                      {locationError}
                    </span>

                  </div>

                )}

              </div>


              {/* =================================
                  SELECTED ADDRESS
              ================================== */}

              <div className="form-group">

                <label htmlFor="location">
                  Selected Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={
                    formData.location
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Select a location on the map"
                  required
                />

                <small className="form-help-text">
                  This address is automatically
                  updated when you select a location
                  on the map.
                </small>

              </div>


              {/* =================================
                  AREA
              ================================== */}

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
                    value={
                      formData.area
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. 2.5"
                  />

                  <span>
                    hectares
                  </span>

                </div>

              </div>


              {/* =================================
                  DESCRIPTION
              ================================== */}

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
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Describe your farm..."
                  rows="4"
                />

              </div>


              {/* =================================
                  ACTIONS
              ================================== */}

              <div className="farm-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    resetForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >

                  {saving ? (
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
                      {editingFarm ? (
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
                        {editingFarm
                          ? "Save Changes"
                          : "Create Farm"}
                      </span>
                    </>
                  )}

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

            <div className="loading-spinner">
              <Loader2
                size={24}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

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

              <Sprout
                size={34}
                strokeWidth={1.9}
                aria-hidden="true"
              />

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
              onClick={
                handleAddFarm
              }
              type="button"
            >

              <Plus
                size={18}
                strokeWidth={2.2}
                aria-hidden="true"
              />

              <span>
                Add Your Farm
              </span>

            </button>

          </div>

        )}


        {/* ==========================================
            FARM CARDS
        =========================================== */}

        {!loading &&
          farms.length > 0 && (

          <div className="farm-grid">

            {farms.map(
              (farm) => (

                <div
                  className="farm-card"
                  key={
                    farm.id
                  }
                >

                  <div className="farm-card-top">

                    <div className="farm-icon">

                      <Leaf
                        size={23}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                    </div>


                    <div className="farm-card-actions">

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            farm
                          )
                        }
                        title="Edit farm"
                        aria-label={`Edit ${farm.farm_name}`}
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
                        className="delete-action"
                        onClick={() =>
                          handleDelete(
                            farm
                          )
                        }
                        title="Delete farm"
                        aria-label={`Delete ${farm.farm_name}`}
                      >

                        <Trash2
                          size={15}
                          strokeWidth={2}
                          aria-hidden="true"
                        />

                        <span>
                          Delete
                        </span>

                      </button>

                    </div>

                  </div>


                  <h2>
                    {
                      farm.farm_name
                    }
                  </h2>


                  <div className="farm-detail">

                    <span className="farm-detail-icon">

                      <MapPin
                        size={17}
                        strokeWidth={2}
                        aria-hidden="true"
                      />

                    </span>

                    <span>
                      {
                        farm.location
                      }
                    </span>

                  </div>


                  {farm.latitude !== null
                    &&
                    farm.latitude !== undefined
                    &&
                    farm.longitude !== null
                    &&
                    farm.longitude !== undefined && (

                    <div className="farm-detail">

                      <span className="farm-detail-icon">

                        <MapPinned
                          size={17}
                          strokeWidth={2}
                          aria-hidden="true"
                        />

                      </span>

                      <span>
                        {
                          Number(
                            farm.latitude
                          ).toFixed(6)
                        }
                        ,{" "}
                        {
                          Number(
                            farm.longitude
                          ).toFixed(6)
                        }
                      </span>

                    </div>

                  )}


                  {farm.area !== null
                    &&
                    farm.area !== undefined && (

                    <div className="farm-detail">

                      <span className="farm-detail-icon">

                        <Ruler
                          size={17}
                          strokeWidth={2}
                          aria-hidden="true"
                        />

                      </span>

                      <span>
                        {
                          farm.area
                        }{" "}
                        hectares
                      </span>

                    </div>

                  )}


                  {farm.description && (

                    <p className="farm-description">
                      {
                        farm.description
                      }
                    </p>

                  )}


                  <div className="farm-card-footer">

                    <span>
                      Farm ID #
                      {
                        farm.id
                      }
                    </span>

                    <span>
                      {
                        farm.created_at
                          ? new Date(
                              farm.created_at
                            ).toLocaleDateString()
                          : ""
                      }
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </DashboardLayout>
  );
};


export default MyFarm;