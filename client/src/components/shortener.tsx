import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const URLShortener = () => {
  const [longUrl, setLongUrl] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [activeTab, setActiveTab] = useState<"shortUrl" | "qrCode">("shortUrl")
  const [error, setError] = useState<string | null>(null)
  const [customShortCode, setCustomShortCode] = useState("")
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [showOptions, setShowOptions] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)

  const navigate = useNavigate() 

  const getAuthToken = (): string | null => {
    return localStorage.getItem("userToken")
  }

  const handleLoginRedirect = () => {
    setShowLoginPopup(false) 
    navigate("/login") 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setShowResult(false)

    const token = getAuthToken()
    if (!token) {
      setShowLoginPopup(true)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          longUrl,
          customShort: customShortCode || undefined,
          expiresInDays,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShortUrl(data.data.fullShortUrl)
        setShowResult(true)
      } else {
        if (response.status === 401) {
          setShowLoginPopup(true) 
          setError("Your session has expired or you are not logged in. Please log in again.")
        } else if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map((err: { message: string }) => err.message).join(", ")
          setError(data.message || errorMessages || "Failed to shorten URL.")
        } else {
          setError(data.message || "Failed to shorten URL. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error shortening URL:", err)
      setError("An unexpected error occurred. Please check your network connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(shortUrl)
      .then(() => {
        alert("URL copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        alert("Failed to copy URL. Please try again manually.")
      })
  }

  const openInNewTab = () => {
    window.open(shortUrl, "_blank")
  }

//Pop up
  const LoginPopup = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1a1a2e', 
        padding: '2rem',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '400px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)', 
      }}>
        <h3 style={{ color: '#e0e0e0', marginBottom: '1rem' }}>Login Required</h3>
        <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
          You need to be logged in to use shorten URLs.
        </p>
        <button
          onClick={handleLoginRedirect}
          className="shorten-btn" 
          style={{
            padding: '0.8rem 1.5rem',
            marginRight: '1rem', 
          }}
        >
          Go to Login Page
        </button>
        <button
          onClick={() => setShowLoginPopup(false)}
          style={{
            background: 'none',
            border: '1px solid #777',
            color: '#777',
            padding: '0.8rem 1.5rem',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'background-color 0.3s ease, color 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#777'; }}
        >
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div className="url-shortener-container">
      <div className="url-shortener-wrapper">
        <div className="glow-bg"></div>
        <div className="glow-bg2"></div>

        <div className="auth-logo">
          <img src="/logo.png" alt="App Logo" style={{ width: "80px", height: "auto", marginBottom: "0.5rem" }} />
          <h1 className="h1-title">URL Shortener & QR Generator</h1>
          <p className="auth-subtitle">Transform long URLs into short, shareable links with QR codes</p>
        </div>

        <div className="main-card">
          <div className="card-header">
            <h2 className="auth-header">Create Short URL</h2>
            <p className="auth-description">Enter your long URL below to generate a shortened link and QR code</p>
          </div>

          <form onSubmit={handleSubmit} className="url-form">
            <div className="input-wrapper" style={{ flex: "1" }}>
              <input
                type="url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="Enter your long URL here"
                required
                className="url-input"
              />
            </div>
            <button
              type="submit"
              className="shorten-btn"
              disabled={isLoading || !longUrl}
              style={{ padding: "0.875rem 1rem", minWidth: "120px"}}
            >
              {isLoading ? "Processing..." : "Shorten URL"}
            </button>
          </form>

          {error && <div className="error-message" style={{ color: "red", marginTop: "1rem" }}>{error}</div>}

          {/* Options Button and Collapsible Fields */}
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="shorten-btn"
              onClick={() => {
                if (!getAuthToken()) {
                  setShowLoginPopup(true);
                } else {
                  setShowOptions(!showOptions);
                }
              }}
              style={{
                background: 'none',
                border: '1px solid #777',
                color: '#777',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: showOptions ? '1rem' : '0'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              {showOptions ? "Hide Options" : "More Options"}
            </button>
          </div>

          {showOptions && (
            <div style={{ marginTop: '0', padding: '1rem', border: '1px solid #333', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
              <div className="input-wrapper" style={{ marginBottom: '1rem' }}>
                <label htmlFor="customShort" style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Custom Short Code (optional):</label>
                <input
                  id="customShort"
                  type="text"
                  value={customShortCode}
                  onChange={(e) => setCustomShortCode(e.target.value)}
                  placeholder="e.g., my-cool-link"
                  className="url-input"
                />
              </div>
              <div className="input-wrapper">
                <label htmlFor="expiresInDays" style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Expires in Days (1-30):</label>
                <input
                  id="expiresInDays"
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  min="1"
                  max="30"
                  required
                  className="url-input"
                />
              </div>
            </div>
          )}

          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "shortUrl" ? "active" : ""}`}
                onClick={() => setActiveTab("shortUrl")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Short URL
              </button>
              <button
                className={`tab ${activeTab === "qrCode" ? "active" : ""}`}
                onClick={() => setActiveTab("qrCode")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="5" height="5"></rect>
                  <rect x="16" y="3" width="5" height="5"></rect>
                  <rect x="3" y="16" width="5" height="5"></rect>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
                  <path d="M21 21v.01"></path>
                  <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
                  <path d="M3 12h.01"></path>
                  <path d="M12 3h.01"></path>
                  <path d="M12 16v.01"></path>
                  <path d="M16 12h1"></path>
                  <path d="M21 12v.01"></path>
                  <path d="M12 21v-1"></path>
                </svg>
                QR Code
              </button>
            </div>
          </div>

          {showResult && (
            <div className="result-section">
              {activeTab === "shortUrl" ? (
                <div className="short-url-content">
                  <p className="result-label">Your shortened URL :</p>
                  <div className="url-result">
                    <input type="text" value={shortUrl} readOnly className="result-input" />
                    <button onClick={copyToClipboard} className="copy-btn" title="Copy to clipboard">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <button className="open-link" onClick={openInNewTab}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Open link in new tab
                  </button>
                </div>
              ) : (
                <div className="qr-code-content">
                  <div className="qr-code-display">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`}
                      alt="QR Code"
                      className="qr-code-image"
                    />
                  </div>
                  <p className="qr-description">Scan this QR code to access your shortened URL</p>
                  <button className="download-qr-btn" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`, "_blank")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download QR Code
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="account-banner">
            <p>Want to save and track your links?</p>
            <Link to="/register" className="create-account-btn">
              Create account
            </Link>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon purple">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <h3 className="feature-title">Short URLs</h3>
            <p className="feature-desc">Create compact, easy-to-share links that redirect to your original URL.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon pink">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#D16D6A"><path d="M80-680v-200h200v80H160v120H80Zm0 600v-200h80v120h120v80H80Zm600 0v-80h120v-120h80v200H680Zm120-600v-120H680v-80h200v200h-80ZM700-260h60v60h-60v-60Zm0-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm120-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm240-320v240H520v-240h240ZM440-440v240H200v-240h240Zm0-320v240H200v-240h240Zm-60 500v-120H260v120h120Zm0-320v-120H260v120h120Zm320 0v-120H580v120h120Z"/></svg>
            </div>
            <h3 className="feature-title">QR Codes</h3>
            <p className="feature-desc">
              Generate scannable QR codes for your shortened URLs for print or digital use.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5985E1"><path d="M280-160q-50 0-85-35t-35-85H60l18-80h113q17-19 40-29.5t49-10.5q26 0 49 10.5t40 29.5h167l84-360H182l4-17q6-28 27.5-45.5T264-800h456l-37 160h117l120 160-40 200h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85H400q0 50-35 85t-85 35Zm357-280h193l4-21-74-99h-95l-28 120Zm-19-273 2-7-84 360 2-7 34-146 46-200ZM20-427l20-80h220l-20 80H20Zm80-146 20-80h260l-20 80H100Zm180 333q17 0 28.5-11.5T320-280q0-17-11.5-28.5T280-320q-17 0-28.5 11.5T240-280q0 17 11.5 28.5T280-240Zm400 0q17 0 28.5-11.5T720-280q0-17-11.5-28.5T680-320q-17 0-28.5 11.5T640-280q0 17 11.5 28.5T680-240Z"/></svg>
            </div>
            <h3 className="feature-title">Quick Sharing</h3>
            <p className="feature-desc">Shortened URLs are ready to share in seconds.</p>
          </div>
        </div>
      </div>
      {showLoginPopup && <LoginPopup />} 
    </div>
  )
}

export default URLShortener