
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { API_URLS } from "../config/api.js";
import "../styles/App.css";

const API_URL = API_URLS.listings;

const categories = [
  "All",
  "Books",
  "Electronics",
  "Academic Supplies",
  "Other",
];

const conditions = ["Like New", "Good", "Fair"];

const initialForm = {
  title: "",
  description: "",
  price: "",
  category: "Books",
  condition: "Good",
};

const categoryIcons = {
  Books: "📚",
  Electronics: "💻",
  "Academic Supplies": "✏️",
  Other: "🎒",
};

function formatPrice(price) {
  return Number(price).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function getContactLink(contact) {
  if (!contact?.value || !contact?.platform) return null;

  const value = contact.value.trim();

  switch (contact.platform) {
    case "whatsapp": {
      const phone = value.replace(/[^\d]/g, "");
      return phone ? `https://wa.me/${phone}` : null;
    }

    case "instagram": {
      const username = value.replace(/^@/, "");
      return username
        ? `https://www.instagram.com/${encodeURIComponent(username)}/`
        : null;
    }

    case "telegram": {
      const username = value.replace(/^@/, "");
      return username && !/\s/.test(username)
        ? `https://t.me/${encodeURIComponent(username)}`
        : null;
    }

    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? `mailto:${value}`
        : null;

    default:
      return null;
  }
}

function getContactLabel(platform) {
  const labels = {
    whatsapp: "Contact seller on WhatsApp",
    instagram: "Contact seller on Instagram",
    telegram: "Contact seller on Telegram",
    email: "Email the seller",
    other: "Seller contact details",
  };

  return labels[platform] || "Contact seller";
}

export default function Marketplace() {
  const { token, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedListing, setSelectedListing] = useState(null);

  const [showMyListings, setShowMyListings] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [myListingsLoading, setMyListingsLoading] = useState(false);
  const [myListingsError, setMyListingsError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [listingToSell, setListingToSell] = useState(null);
  const [soldError, setSoldError] = useState("");
  const [soldSubmitting, setSoldSubmitting] = useState(false);

  const currentUserId =
    currentUser?._id || currentUser?.id || null;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load marketplace listings."
        );
      }

      const items = Array.isArray(data)
        ? data
        : data.listings || data.items || [];

      setListings(items);

      setSelectedListing((current) => {
        if (!current) return null;

        return (
          items.find((item) => item._id === current._id) || current
        );
      });
    } catch (error) {
      setPageError(
        error.message ||
          "Could not connect to the marketplace server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    if (!token || !currentUser) {
      navigate("/login", {
        state: {
          from: "/",
          message: "Please log in to view your listings.",
        },
      });
      return;
    }

    setMyListingsLoading(true);
    setMyListingsError("");

    try {
      const response = await fetch(`${API_URL}/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not load your listings."
        );
      }

      setMyListings(data.listings || []);
    } catch (error) {
      setMyListingsError(
        error.message || "Could not load your listings."
      );
    } finally {
      setMyListingsLoading(false);
    }
  }, [token, currentUser, navigate]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = listings.filter((listing) => {
      const belongsToMe =
        currentUserId &&
        listing.sellerId &&
        String(listing.sellerId) === String(currentUserId);

      if (belongsToMe || listing.availability === "sold") {
        return false;
      }

      const matchesSearch =
        !query ||
        listing.title?.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query) ||
        listing.category?.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (category === "All" || listing.category === category)
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "priceLow") {
        return Number(a.price) - Number(b.price);
      }

      if (sortBy === "priceHigh") {
        return Number(b.price) - Number(a.price);
      }

      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });
  }, [listings, search, category, sortBy, currentUserId]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openSellForm() {
    if (!currentUser || !token) {
      navigate("/login", {
        state: {
          from: "/",
          message: "Please log in before publishing a listing.",
        },
      });
      return;
    }

    setForm(initialForm);
    setFormError("");
    setSuccessMessage("");
    setShowMyListings(false);
    setSelectedListing(null);
    setShowForm((previous) => !previous);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!token || !currentUser) {
      navigate("/login", {
        state: {
          from: "/",
          message: "Please log in before publishing a listing.",
        },
      });
      return;
    }

    const price = Number(form.price);

    if (!form.title.trim() || !form.description.trim()) {
      setFormError("Please fill in the title and description.");
      return;
    }

    if (!Number.isFinite(price) || price < 1) {
      setFormError("Price must be at least ₹1.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price,
          category: form.category,
          condition: form.condition,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not create your listing."
        );
      }

      setForm(initialForm);
      setShowForm(false);
      setCategory("All");
      setSearch("");
      setSuccessMessage(
        "Your item has been added to CampusLoop!"
      );

      await fetchListings();

      if (showMyListings) {
        await fetchMyListings();
      }
    } catch (error) {
      setFormError(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function openMyListings() {
    if (!currentUser || !token) {
      navigate("/login", {
        state: {
          from: "/",
          message: "Please log in to view your listings.",
        },
      });
      return;
    }

    setSelectedListing(null);
    setShowForm(false);
    cancelEditing();
    setSuccessMessage("");
    setShowMyListings(true);

    await fetchMyListings();
  }

  function startEditing(listing) {
    setEditingId(listing._id);
    setEditError("");
    setSuccessMessage("");

    setEditForm({
      title: listing.title || "",
      description: listing.description || "",
      price: String(listing.price ?? ""),
      category: listing.category || "Books",
      condition: listing.condition || "Good",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditError("");
    setEditForm(initialForm);
  }

  async function handleEditSubmit(event, listingId) {
    event.preventDefault();
    setEditError("");
    setSuccessMessage("");

    if (!token || !currentUser) {
      navigate("/login", {
        state: {
          from: "/",
          message: "Please log in to edit your listing.",
        },
      });
      return;
    }

    const price = Number(editForm.price);

    if (!editForm.title.trim() || !editForm.description.trim()) {
      setEditError("Please fill in the title and description.");
      return;
    }

    if (!Number.isFinite(price) || price < 1) {
      setEditError("Price must be at least ₹1.");
      return;
    }

    setEditSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/${listingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          price,
          category: editForm.category,
          condition: editForm.condition,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not update this listing."
        );
      }

      cancelEditing();
      setSuccessMessage(
        "Your listing has been updated successfully."
      );

      await Promise.all([
        fetchMyListings(),
        fetchListings(),
      ]);
    } catch (error) {
      setEditError(
        error.message || "Could not update this listing."
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  function askToDelete(listing) {
    setDeleteError("");
    setListingToDelete(listing);
  }

  async function confirmDelete() {
    if (!listingToDelete || !token || deleteSubmitting) return;

    const listing = listingToDelete;

    setDeleteSubmitting(true);
    setDeletingId(listing._id);
    setDeleteError("");

    try {
      const response = await fetch(`${API_URL}/${listing._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not delete this listing."
        );
      }

      if (editingId === listing._id) {
        cancelEditing();
      }

      setListingToDelete(null);
      setSuccessMessage("Your listing has been deleted.");

      await Promise.all([
        fetchMyListings(),
        fetchListings(),
      ]);
    } catch (error) {
      setDeleteError(
        error.message || "Could not delete this listing."
      );
    } finally {
      setDeletingId(null);
      setDeleteSubmitting(false);
    }
  }

  function askToMarkSold(listing) {
    setSoldError("");
    setListingToSell(listing);
  }

  async function confirmMarkSold() {
    if (!listingToSell || !token || soldSubmitting) return;

    const listing = listingToSell;

    setSoldSubmitting(true);
    setSoldError("");

    try {
      const response = await fetch(
        `${API_URL}/${listing._id}/sold`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not mark this listing as sold."
        );
      }

      setListingToSell(null);
      setSuccessMessage(
        `"${listing.title}" has been marked as sold.`
      );

      await Promise.all([
        fetchMyListings(),
        fetchListings(),
      ]);
    } catch (error) {
      setSoldError(
        error.message || "Could not mark this listing as sold."
      );
    } finally {
      setSoldSubmitting(false);
    }
  }

  function handleLogout() {
    cancelEditing();
    logout();

    setShowForm(false);
    setSelectedListing(null);
    setShowMyListings(false);
    setSuccessMessage("You have been logged out.");
  }

  function goToMarketplace() {
    cancelEditing();

    setSelectedListing(null);
    setShowForm(false);
    setShowMyListings(false);
    setListingToDelete(null);
    setListingToSell(null);
  }

  function openDetails(listing) {
    setSelectedListing(listing);
    setShowForm(false);
    setShowMyListings(false);
  }

  const selectedContact = selectedListing?.sellerContact;
  const selectedContactLink = getContactLink(selectedContact);

  return (
    <div className="marketplace">
      <header className="navbar">
        <Link to="/" className="brand" onClick={goToMarketplace}>
          Campus<span>Loop</span>
        </Link>

        <nav className="nav-actions" aria-label="Account navigation">
          {currentUser ? (
            <>
              <span className="welcome-user">
                Hi, {currentUser.name?.split(" ")[0]}
              </span>

              <button
                type="button"
                className="button button-outline button-small"
                onClick={openMyListings}
              >
                My Listings
              </button>

              <Link
                className="button button-outline button-small"
                to="/settings/contact"
              >
                Contact Settings
              </Link>

              <button
                type="button"
                className="button button-outline button-small"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                Log in
              </Link>

              <Link
                className="button button-primary button-small"
                to="/signup"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        {selectedListing ? (
          <section className="detail-page">
            <button
              type="button"
              className="back-button"
              onClick={goToMarketplace}
            >
              ← Back to marketplace
            </button>

            <div className="detail-card">
              <div className="detail-illustration detail-text-placeholder">
                <span>
                  {categoryIcons[selectedListing.category] || "🎒"}
                </span>
                <p>No product photos</p>
              </div>

              <div className="detail-content">
                <span className="listing-category">
                  {selectedListing.category}
                </span>

                <h1>{selectedListing.title}</h1>

                <p className="detail-price">
                  ₹{formatPrice(selectedListing.price)}
                </p>

                <div className="detail-facts">
                  <span>
                    <strong>Condition:</strong>{" "}
                    {selectedListing.condition || "Not specified"}
                  </span>

                  <span>
                    <strong>Seller:</strong>{" "}
                    {selectedListing.seller || "Campus student"}
                  </span>

                  <span>
                    <strong>Status:</strong>{" "}
                    {selectedListing.availability || "available"}
                  </span>
                </div>

                <h2>About this item</h2>

                <p className="detail-description">
                  {selectedListing.description}
                </p>

                {selectedContact?.value &&
                selectedContact?.platform ? (
                  <div style={{ marginTop: "24px" }}>
                    <h2>Contact the seller</h2>

                    <p className="detail-note">
                      Preferred method:{" "}
                      {selectedContact.platform
                        .charAt(0)
                        .toUpperCase() +
                        selectedContact.platform.slice(1)}
                    </p>

                    {selectedContactLink ? (
                      <a
                        className="button button-primary"
                        href={selectedContactLink}
                        target={
                          selectedContact.platform === "email"
                            ? undefined
                            : "_blank"
                        }
                        rel={
                          selectedContact.platform === "email"
                            ? undefined
                            : "noopener noreferrer"
                        }
                      >
                        {getContactLabel(selectedContact.platform)}
                      </a>
                    ) : (
                      <p className="detail-note">
                        Contact details: {selectedContact.value}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="detail-note">
                    The seller hasn't added contact details yet.
                    Please check back later.
                  </p>
                )}

                <p className="detail-note">
                  Arrange exchanges in a safe public campus location.
                </p>
              </div>
            </div>
          </section>
        ) : showMyListings ? (
          <section className="listing-section">
            <button
              type="button"
              className="back-button"
              onClick={goToMarketplace}
            >
              ← Back to marketplace
            </button>

            <div className="section-heading">
              <div>
                <p className="section-eyebrow">YOUR CAMPUS EXCHANGE</p>
                <h2>My Listings</h2>
                <p className="section-subtitle">
                  Manage the items you've published.
                </p>
              </div>

              <button
                type="button"
                className="button button-primary"
                onClick={openSellForm}
              >
                + Sell an item
              </button>
            </div>

            {successMessage && (
              <div className="message message-success" role="status">
                {successMessage}
              </div>
            )}

            {myListingsLoading ? (
              <div className="empty-state">
                <span className="empty-icon">⌛</span>
                <h3>Loading your listings...</h3>
              </div>
            ) : myListingsError ? (
              <div className="empty-state">
                <span className="empty-icon">⚠️</span>
                <h3>We couldn't load your listings</h3>
                <p>{myListingsError}</p>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={fetchMyListings}
                >
                  Try again
                </button>
              </div>
            ) : myListings.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <h3>You haven't listed anything yet</h3>
                <p>Your published items will appear here.</p>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={openSellForm}
                >
                  Publish your first listing
                </button>
              </div>
            ) : (
              <div className="listing-grid">
                {myListings.map((listing) => (
                  <article className="listing-card" key={listing._id}>
                    <div className="listing-illustration">
                      <span>
                        {categoryIcons[listing.category] || "🎒"}
                      </span>

                      <span className="condition-badge">
                        {listing.condition || "Used"}
                      </span>
                    </div>

                    <div className="listing-card-body">
                      <span className="listing-category">
                        {listing.category}
                      </span>

                      <h3>{listing.title}</h3>

                      <p className="listing-description">
                        {listing.description}
                      </p>

                      <div className="listing-card-footer">
                        <div>
                          <p className="listing-price">
                            ₹{formatPrice(listing.price)}
                          </p>

                          <p className="listing-seller">
                            Status:{" "}
                            {listing.availability === "sold"
                              ? "Sold"
                              : "Available"}
                          </p>
                        </div>
                      </div>

                      {editingId === listing._id ? (
                        <form
                          className="listing-form"
                          onSubmit={(event) =>
                            handleEditSubmit(event, listing._id)
                          }
                        >
                          <label htmlFor={`edit-title-${listing._id}`}>
                            Item title
                          </label>

                          <input
                            id={`edit-title-${listing._id}`}
                            name="title"
                            value={editForm.title}
                            onChange={handleEditFormChange}
                            maxLength={100}
                            required
                          />

                          <label
                            htmlFor={`edit-description-${listing._id}`}
                          >
                            Description
                          </label>

                          <textarea
                            id={`edit-description-${listing._id}`}
                            name="description"
                            value={editForm.description}
                            onChange={handleEditFormChange}
                            rows={4}
                            maxLength={1000}
                            required
                          />

                          <label htmlFor={`edit-price-${listing._id}`}>
                            Price (₹)
                          </label>

                          <input
                            id={`edit-price-${listing._id}`}
                            name="price"
                            type="number"
                            min="1"
                            step="0.01"
                            value={editForm.price}
                            onChange={handleEditFormChange}
                            required
                          />

                          <label
                            htmlFor={`edit-category-${listing._id}`}
                          >
                            Category
                          </label>

                          <select
                            id={`edit-category-${listing._id}`}
                            name="category"
                            value={editForm.category}
                            onChange={handleEditFormChange}
                          >
                            {categories
                              .filter((item) => item !== "All")
                              .map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                          </select>

                          <label
                            htmlFor={`edit-condition-${listing._id}`}
                          >
                            Condition
                          </label>

                          <select
                            id={`edit-condition-${listing._id}`}
                            name="condition"
                            value={editForm.condition}
                            onChange={handleEditFormChange}
                          >
                            {conditions.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>

                          {editError && (
                            <p
                              className="message message-error"
                              role="alert"
                            >
                              {editError}
                            </p>
                          )}

                          <button
                            type="submit"
                            className="button button-primary form-submit"
                            disabled={editSubmitting}
                          >
                            {editSubmitting
                              ? "Saving..."
                              : "Save changes"}
                          </button>

                          <button
                            type="button"
                            className="button button-outline form-submit"
                            onClick={cancelEditing}
                            disabled={editSubmitting}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="listing-actions">
                          {listing.availability !== "sold" && (
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => startEditing(listing)}
                            >
                              Edit
                            </button>
                          )}

                          {listing.availability !== "sold" && (
                            <button
                              type="button"
                              className="button button-outline"
                              onClick={() => askToMarkSold(listing)}
                            >
                              Mark as Sold
                            </button>
                          )}

                          <button
                            type="button"
                            className="button button-outline"
                            onClick={() => askToDelete(listing)}
                            disabled={deletingId === listing._id}
                          >
                            {deletingId === listing._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="hero-tag">
                  YOUR CAMPUS. YOUR MARKETPLACE.
                </span>

                <h1>
                  Good finds.
                  <br />
                  <span>Better campus living.</span>
                </h1>

                <p>
                  Buy and sell books, electronics, and everyday
                  essentials with your fellow students.
                </p>

                <div className="hero-actions">
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={openSellForm}
                  >
                    + Sell an item
                  </button>

                  <a className="hero-secondary" href="#listings">
                    Explore listings ↓
                  </a>
                </div>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="hero-art-circle">🛍️</div>
                <div className="floating-note note-top">
                  📚 Used textbooks
                </div>
                <div className="floating-note note-bottom">
                  ♻️ Give things a second life
                </div>
              </div>
            </section>

            {showForm && (
              <section className="form-section" id="sell-form">
                <div className="section-heading">
                  <div>
                    <p className="section-eyebrow">SELL SOMETHING</p>
                    <h2>List your item</h2>
                  </div>

                  <button
                    type="button"
                    className="close-button"
                    onClick={() => {
                      setShowForm(false);
                      setForm(initialForm);
                      setFormError("");
                    }}
                    aria-label="Close listing form"
                  >
                    ✕
                  </button>
                </div>

                <form className="listing-form" onSubmit={handleSubmit}>
                  <label htmlFor="listing-title">Item title</label>

                  <input
                    id="listing-title"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Engineering Mathematics textbook"
                    maxLength={100}
                    required
                  />

                  <label htmlFor="listing-description">
                    Description
                  </label>

                  <textarea
                    id="listing-description"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Describe the item and its condition..."
                    rows={4}
                    maxLength={1000}
                    required
                  />

                  <div className="form-grid">
                    <div>
                      <label htmlFor="listing-price">Price (₹)</label>

                      <input
                        id="listing-price"
                        name="price"
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.price}
                        onChange={handleFormChange}
                        placeholder="350"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="listing-category">
                        Category
                      </label>

                      <select
                        id="listing-category"
                        name="category"
                        value={form.category}
                        onChange={handleFormChange}
                      >
                        {categories
                          .filter((item) => item !== "All")
                          .map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <label htmlFor="listing-condition">
                    Condition
                  </label>

                  <select
                    id="listing-condition"
                    name="condition"
                    value={form.condition}
                    onChange={handleFormChange}
                  >
                    {conditions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  {formError && (
                    <p className="message message-error" role="alert">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="button button-primary form-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Publishing..." : "Publish listing"}
                  </button>
                </form>
              </section>
            )}

            {successMessage && (
              <div className="message message-success" role="status">
                {successMessage}
              </div>
            )}

            <section className="listing-section" id="listings">
              <div className="section-heading">
                <div>
                  <p className="section-eyebrow">
                    THE CAMPUS EXCHANGE
                  </p>
                  <h2>Explore listings</h2>
                  <p className="section-subtitle">
                    Find your next useful thing.
                  </p>
                </div>

                <span className="listing-count">
                  {filteredListings.length}{" "}
                  {filteredListings.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="listing-controls">
                <input
                  className="search-input"
                  type="search"
                  placeholder="Search books, gadgets, supplies..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search listings"
                />

                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  aria-label="Sort listings"
                >
                  <option value="newest">Newest first</option>
                  <option value="priceLow">Price: low to high</option>
                  <option value="priceHigh">Price: high to low</option>
                </select>
              </div>

              <div
                className="category-tabs"
                aria-label="Filter by category"
              >
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`category-tab ${
                      category === item ? "active" : ""
                    }`}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="empty-state">
                  <span className="empty-icon">⌛</span>
                  <h3>Loading the marketplace...</h3>
                  <p>
                    Just a moment while we fetch the latest listings.
                  </p>
                </div>
              ) : pageError ? (
                <div className="empty-state">
                  <span className="empty-icon">⚠️</span>
                  <h3>We couldn't load the listings</h3>
                  <p>{pageError}</p>

                  <button
                    type="button"
                    className="button button-primary"
                    onClick={fetchListings}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔎</span>
                  <h3>No listings found</h3>
                  <p>
                    Try another search or category, or be the first to
                    list an item.
                  </p>

                  <button
                    type="button"
                    className="button button-primary"
                    onClick={openSellForm}
                  >
                    Sell an item
                  </button>
                </div>
              ) : (
                <div className="listing-grid">
                  {filteredListings.map((listing) => (
                    <article
                      className="listing-card"
                      key={listing._id}
                    >
                      <div className="listing-illustration">
                        <span>
                          {categoryIcons[listing.category] || "🎒"}
                        </span>

                        <span className="condition-badge">
                          {listing.condition || "Used"}
                        </span>
                      </div>

                      <div className="listing-card-body">
                        <span className="listing-category">
                          {listing.category}
                        </span>

                        <h3>{listing.title}</h3>

                        <p className="listing-description">
                          {listing.description}
                        </p>

                        <div className="listing-card-footer">
                          <div>
                            <p className="listing-price">
                              ₹{formatPrice(listing.price)}
                            </p>

                            <p className="listing-seller">
                              By {listing.seller || "Campus student"}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="button button-outline view-button"
                            onClick={() => openDetails(listing)}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <Link
          to="/"
          className="brand footer-brand"
          onClick={goToMarketplace}
        >
          Campus<span>Loop</span>
        </Link>

        <p>A little less waste. A little more campus community.</p>

        <span>© {new Date().getFullYear()} CampusLoop</span>
      </footer>

      {listingToSell && (
        <div
          className="confirmation-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !soldSubmitting
            ) {
              setListingToSell(null);
              setSoldError("");
            }
          }}
        >
          <section
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sold-dialog-title"
            aria-describedby="sold-dialog-description"
          >
            <div className="confirmation-icon">✅</div>

            <h2 id="sold-dialog-title">
              Mark this item as sold?
            </h2>

            <p id="sold-dialog-description">
              <strong>{listingToSell.title}</strong> will no longer
              appear in the public marketplace. It will remain in My
              Listings with its sold status.
            </p>

            {soldError && (
              <p className="message message-error" role="alert">
                {soldError}
              </p>
            )}

            <div className="confirmation-actions">
              <button
                type="button"
                className="button button-outline"
                disabled={soldSubmitting}
                onClick={() => {
                  setListingToSell(null);
                  setSoldError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button button-primary"
                disabled={soldSubmitting}
                onClick={confirmMarkSold}
              >
                {soldSubmitting
                  ? "Updating..."
                  : "Yes, mark as sold"}
              </button>
            </div>
          </section>
        </div>
      )}

      {listingToDelete && (
        <div
          className="confirmation-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleteSubmitting
            ) {
              setListingToDelete(null);
              setDeleteError("");
            }
          }}
        >
          <section
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <div className="confirmation-icon">🗑️</div>

            <h2 id="delete-dialog-title">
              Delete this listing?
            </h2>

            <p id="delete-dialog-description">
              <strong>{listingToDelete.title}</strong> will be
              permanently removed. You cannot undo this action.
            </p>

            {deleteError && (
              <p className="message message-error" role="alert">
                {deleteError}
              </p>
            )}

            <div className="confirmation-actions">
              <button
                type="button"
                className="button button-outline"
                disabled={deleteSubmitting}
                onClick={() => {
                  setListingToDelete(null);
                  setDeleteError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button button-primary delete-confirm-button"
                disabled={deleteSubmitting}
                onClick={confirmDelete}
              >
                {deleteSubmitting
                  ? "Deleting..."
                  : "Delete listing"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
