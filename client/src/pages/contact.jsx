import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import React, { useState } from "react";

const Contact = () => {

  // ⭐ Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // ⭐ Google Maps Link
  const mapsUrl =
    "https://www.google.com/maps/place/TalentSprint,+Plot+No.+16,+Gachibowli,+Hyderabad,+Telangana+500032";

  // ⭐ Send Message Function
  const handleSubmit = async () => {
    if (!name || !email || !message) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/contact", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name, email, message }),
});

      const data = await res.json();

      if (res.ok) {
        alert("Message sent successfully!");

        // Reset fields
        setName("");
        setEmail("");
        setMessage("");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Server error — check backend console.");
    }
  };


  return (
    <div style={styles.wrapper}>

      {/* Header Section */}
      <div style={styles.headerBox}>
        <h1 style={styles.title}>Get In Touch</h1>
        <p style={styles.subtitle}>
          We’re here to help with election queries, registration support, or any system issues.
          Contact us anytime!
        </p>
      </div>

      {/* Main Content */}
      <div style={styles.container}>

        {/* FORM CARD */}
        <div style={styles.formCard}>
          <div style={styles.formGrid}>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Message</label>
            <textarea
              placeholder="Write your message..."
              rows="4"
              style={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>

          <button style={styles.button} onClick={handleSubmit}>
            Send Message
          </button>
        </div>

        {/* CONTACT INFORMATION */}
        <div style={styles.leftCard}>
          <h2 style={styles.leftTitle}>Contact Information</h2>

          <p style={styles.leftDescription}>
            Reach out to us for secure voting support, account help, or general inquiries.
          </p>

          {/* Phone */}
          <div style={styles.infoRow}>
            <FaPhoneAlt style={styles.iconWhite} />
            <div>
              <p style={styles.whiteText}>+91 98765 43210</p>
              <p style={styles.whiteText}>+91 90000 00000</p>
            </div>
          </div>

          {/* Email */}
          <div style={styles.infoRow}>
            <FaEnvelope style={styles.iconWhite} />
            <p style={styles.whiteText}>support@votex.com</p>
          </div>

          {/* Map Label */}
          <div style={styles.mapLabel}>
            <FaMapMarkerAlt style={styles.mapIcon} />
            <span style={styles.mapText}>TalentSprint — Gachibowli</span>
          </div>

          {/* MAP */}
          <div style={styles.mapWrapper}>
            <iframe
              title="TalentSprint Location"
              style={styles.mapIframe}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.696306199987!2d78.35776147404185!3d17.40948260392767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93e8794e6e01%3A0x6f98f8a9cf8bbf0f!2sTalentSprint%2C%20Plot%20No.%2016%2C%20Gachibowli%2C%20Hyderabad%2C%20Telangana%20500032!5e0!3m2!1sen!2sin!4v1701372000000"
            ></iframe>

            {/* CLICKABLE OVERLAY */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.mapOverlay}
            >
              <span style={styles.openButton}>Open in Google Maps</span>
            </a>
          </div>

          <div style={styles.circle}></div>
        </div>

      </div>
    </div>
  );
};




// ================== STYLES ==================

const styles = {
  wrapper: {
    padding: "50px 0",
    background: "linear-gradient(to bottom right, #f5f8ff, #ffffff)",
    minHeight: "100vh",
  },

  headerBox: {
    textAlign: "center",
    marginBottom: "50px",
  },

  title: {
    fontSize: "40px",
    color: "#0a2a66",
    fontWeight: "700",
  },

  subtitle: {
    fontSize: "17px",
    color: "#555",
    marginTop: "12px",
  },

  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "40px",
  },

  /** FORM CARD */
  formCard: {
    width: "650px",
    background: "#fff",
    padding: "35px",
    borderRadius: "22px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
  },

  formGrid: {
    display: "flex",
    gap: "25px",
    marginBottom: "25px",
  },

  formGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  label: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#0a2a66",
  },

  input: {
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    fontSize: "15px",
    resize: "none",
    outline: "none",
  },

  button: {
    marginTop: "25px",
    background: "#1e56e7",
    color: "#fff",
    padding: "16px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "700",
    width: "180px",
  },

  /** CONTACT INFO CARD */
  leftCard: {
    width: "650px",
    background: "linear-gradient(135deg, #0a2a66, #123d91)",
    padding: "35px",
    borderRadius: "22px",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
  },

  leftTitle: {
    fontSize: "24px",
    marginBottom: "14px",
    fontWeight: "700",
  },

  leftDescription: {
    color: "#dce6ff",
    marginBottom: "22px",
    fontSize: "15px",
  },

  infoRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "17px",
  },

  iconWhite: {
    fontSize: "22px",
    color: "#fff",
  },

  whiteText: {
    margin: 0,
    fontSize: "15px",
    color: "#fff",
  },

  /** MAP */
  mapLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "18px",
    marginBottom: "10px",
  },

  mapIcon: {
    color: "#fff",
    fontSize: "22px",
  },

  mapText: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
  },

  mapWrapper: {
    width: "100%",
    height: "240px",
    borderRadius: "15px",
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.25)",
  },

  mapIframe: {
    width: "100%",
    height: "100%",
    border: "0",
  },

  mapOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: "10px",
    background: "transparent",
    zIndex: 2,
    textDecoration: "none",
  },

  openButton: {
    background: "#fff",
    color: "#0a2a66",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
  },

  circle: {
    position: "absolute",
    bottom: "-40px",
    right: "-40px",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "rgba(58, 43, 43, 0.15)",
  },
};

export default Contact;