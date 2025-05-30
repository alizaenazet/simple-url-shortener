"use client"

import type React from "react"
import { useState, useEffect } from "react"
// import { Link } from "react-router-dom" 

const URLShortener = () => {
  const [longUrl, setLongUrl] = useState("")
  const [customShort, setCustomShort] = useState("")
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [shortUrl, setShortUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [activeTab, setActiveTab] = useState<"shortUrl" | "qrCode">("shortUrl")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Cek staus login saat komponen dimuat
  // Ini akan memeriksa apakah ada token di localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-gateway.com'

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (isLoggedIn) {
        const response = await fetch(`${API_BASE_URL}/urls`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            longUrl,
            customShort: customShort || undefined,
            expiresInDays
          })
        })

        const data = await response.json()

        if (response.ok && data.status === 'success') {
          setShortUrl(data.data.fullShortUrl)
          setShowResult(true)
          setSuccess("Short URL created successfully!")
          
          // Reset form
          setLongUrl("")
          setCustomShort("")
          setExpiresInDays(7)
        } else {
          // Handle API errors
          if (data.errors && data.errors.length > 0) {
            setError(data.errors.map(err => err.message).join(', '))
          } else {
            setError(data.message || "Failed to create short URL")
          }
          
          if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken')
            localStorage.removeItem('userData')
            setIsLoggedIn(false)
            setUser(null)
            setError("Session expired. Please login again.")
          }
        }
      } else {
        // Simulate API call for non-authenticated users
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setShortUrl(`https://shorturl.com/${Math.random().toString(36).substr(2, 8)}`)
        setShowResult(true)
        setSuccess("Short URL created! Sign up to save and track your links.")
        
        // Reset form
        setLongUrl("")
      }
    } catch (error) {
      console.error("Error shortening URL:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(shortUrl)
      .then(() => {
        setSuccess("URL copied to clipboard!")
        setTimeout(() => setSuccess(""), 3000)
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        setError("Failed to copy to clipboard")
      })
  }

  const openInNewTab = () => {
    window.open(shortUrl, "_blank")
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setIsLoggedIn(false)
    setUser(null)
    setSuccess("Logged out successfully!")
    setTimeout(() => setSuccess(""), 3000)
  }

  const generateQRCode = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = generateQRCode(shortUrl)
    link.download = `qr-code-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="url-shortener-container">
      <div className="url-shortener-wrapper">
        <div className="glow-bg"></div>
        <div className="glow-bg2"></div>

        {/* Header with Auth Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="auth-logo">
            <img src="/logo.png" alt="App Logo" style={{ width: "80px", height: "auto", marginBottom: "0.5rem" }} />
            <h1 className="h1-title">URL Shortener & QR Generator</h1>
            <p className="auth-subtitle">Transform long URLs into short, shareable links with QR codes</p>
          </div>
          
          {isLoggedIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#fff', fontSize: '0.9rem' }}>
                Welcome, {user?.name || user?.email || 'User'}!
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div className="main-card">
          <div className="card-header">
            <h2 className="auth-header">Create Short URL</h2>
            <p className="auth-description">Enter your long URL below to generate a shortened link and QR code</p>
          </div>

          <div onSubmit={handleSubmit} className="url-form">
            <div className="input-wrapper" style={{ flex: "1" }}>
              <input
                type="url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                required
                placeholder="Enter your long URL here..."
                className="url-input"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="shorten-btn"
              disabled={isLoading || !longUrl}
              style={{ padding: "0.875rem 1rem", minWidth: "120px"}}
            >
              {isLoading ? "Processing..." : "Shorten URL"}
            </button>
          </div>

          {/* Advanced Options for Logged In Users */}
          {isLoggedIn && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Advanced Options</h4>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    Custom Short Code (optional)
                  </label>
                  <input
                    type="text"
                    value={customShort}
                    onChange={(e) => setCustomShort(e.target.value)}
                    placeholder="my-custom-link"
                    className="url-input"
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </div>
                
                <div style={{ flex: '0 0 150px' }}>
                  <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    Expires in Days
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="url-input"
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  >
                    <option value={1}>1 Day</option>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
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
                      src={generateQRCode(shortUrl)} 
                      alt="QR Code" 
                      className="qr-code-image" 
                      style={{ width: '120px', height: '120px' }}
                    />
                  </div>
                  <p className="qr-description">Scan this QR code to access your shortened URL</p>
                  <button className="download-qr-btn" onClick={downloadQRCode}>
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
            {isLoggedIn ? (
              <a href="/dashboard" className="create-account-btn">
                Dashboard
              </a>
            ) : (
              <a href="/register" className="create-account-btn">
                Create account
              </a>
            )}
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
    </div>
  )
}

export default URLShortener