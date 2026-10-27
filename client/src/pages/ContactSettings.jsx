
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { API_URLS } from "../config/api.js";
import "../styles/App.css";

const contactOptions = [
  { value: "whatsapp", label: "WhatsApp", placeholder: "e.g. +91 9876543210" },
  { value: "instagram", label: "Instagram", placeholder: "e.g. your_username" },
  { value: "telegram", label: "Telegram", placeholder: "e.g. @your_username" },
  { value: "email", label: "Email", placeholder: "e.g. you@example.com" },
  { value: "other", label: "Other", placeholder: "Enter your contact details" },
];

export default function ContactSettings() {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();

  const [platform, setPlatform] = useState("whatsapp");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token || !currentUser) {
      navigate("/login", {
        replace: true,
        state: {
          from: "/settings/contact",
          message: "Please log in to manage your contact preferences.",
        },
      });
      return;
    }

    let cancelled = false;

    async function loadContact() {
      try {
        const response = await fetch(`${API_URLS.auth}/contact`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load contact settings.");
        }

        if (!cancelled && data.contact) {
          setPlatform(data.contact.platform || "whatsapp");
          setValue(data.contact.value || "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load contact settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadContact();

    return () => {
      cancelled = true;
    };
  }, [token, currentUser, navigate]);

  const selectedOption =
    contactOptions.find((option) => option.value === platform) ||
    contactOptions[0];

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!value.trim()) {
      setError("Please enter your contact details.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URLS.auth}/contact`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform,
          value: value.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save contact settings.");
      }

      setPlatform(data.contact?.platform || platform);
      setValue(data.contact?.value || value.trim());
      setSuccess("Your contact preference has been saved.");
    } catch (err) {
      setError(err.message || "Could not save your contact settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!token || !currentUser) {
    return null;
  }

  return (
    <div className="marketplace">
      <header className="navbar">
        <Link to="/" className="brand">
          Campus<span>Loop</span>
        </Link>

        <Link to="/" className="nav-link">
          ← Back to marketplace
        </Link>
      </header>

      <main
        style={{
          maxWidth: "680px",
          width: "calc(100% - 32px)",
          margin: "48px auto",
        }}
      >
        <section
          style={{
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border-color, #e5e7eb)",
            borderRadius: "16px",
            padding: "clamp(20px, 5vw, 36px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
          }}
        >
          <p className="section-eyebrow">YOUR ACCOUNT</p>
          <h1 style={{ marginTop: "8px" }}>Contact preferences</h1>

          <p style={{ lineHeight: 1.7, marginBottom: "24px" }}>
            Choose one way for interested students to contact you about your
            listings. This preference applies to your account, not just one item.
          </p>

          {loading ? (
            <p>Loading your contact settings...</p>
          ) : (
            <form className="listing-form" onSubmit={handleSubmit}>
              <label htmlFor="contact-platform">Preferred contact method</label>
              <select
                id="contact-platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                required
              >
                {contactOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label htmlFor="contact-value">
                {platform === "whatsapp"
                  ? "WhatsApp phone number"
                  : platform === "instagram"
                    ? "Instagram username"
                    : platform === "telegram"
                      ? "Telegram username or contact"
                      : platform === "email"
                        ? "Email address"
                        : "Contact details"}
              </label>

              <input
                id="contact-value"
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={selectedOption.placeholder}
                maxLength={100}
                autoComplete="off"
                required
              />

              <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                Buyers may see these details on listings linked to your account.
                Only enter contact information you are comfortable sharing.
              </p>

              {error && (
                <p className="message message-error" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <p className="message message-success" role="status">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="button button-primary form-submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save contact preference"}
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <Link to="/" className="brand footer-brand">
          Campus<span>Loop</span>
        </Link>
        <p>A little less waste. A little more campus community.</p>
      </footer>
    </div>
  );
}
