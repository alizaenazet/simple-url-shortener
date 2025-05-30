"use client"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const Dashboard = () => {
  const [filter, setFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")
  const [showQRCode, setShowQRCode] = useState(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const navigate = useNavigate()

  // Mock data for the dashboard
  const stats = [
    { title: "Total Links", value: "12", subtitle: "Links created" },
    { title: "Total Clicks", value: "283", subtitle: "Links visits" },
    { title: "Active Links", value: "10", subtitle: "Currently active", hasIndicator: true, status: "active" },
    { title: "Expired Links", value: "2", subtitle: "No longer active", hasIndicator: true, status: "expired" },
  ]

  const links = [
    {
      id: 1,
      status: "active",
      originalUrl: "https://example.com/verylongverylongurl",
      shortUrl: "https://short.url/abc123",
      clicks: 24,
      created: "May 10, 2023",
      expires: "May 10, 2024",
      createdDate: new Date("2023-05-10"),
    },
    {
      id: 2,
      status: "expired",
      originalUrl: "https://example.com/verylongverylongurl",
      shortUrl: "https://short.url/abc123",
      clicks: 24,
      created: "May 8, 2023",
      expires: "May 8, 2024",
      createdDate: new Date("2023-05-08"),
    },
    {
      id: 3,
      status: "active",
      originalUrl: "https://example.com/verylongverylongurl",
      shortUrl: "https://short.url/abc123",
      clicks: 24,
      created: "May 12, 2023",
      expires: "May 12, 2024",
      createdDate: new Date("2023-05-12"),
    },
    {
      id: 4,
      status: "active",
      originalUrl: "https://example.com/verylongverylongurl",
      shortUrl: "https://short.url/abc123",
      clicks: 24,
      created: "May 9, 2023",
      expires: "May 9, 2024",
      createdDate: new Date("2023-05-09"),
    },
    {
      id: 5,
      status: "active",
      originalUrl: "https://example.com/verylongverylongurl",
      shortUrl: "https://short.url/abc123",
      clicks: 24,
      created: "May 11, 2023",
      expires: "May 11, 2024",
      createdDate: new Date("2023-05-11"),
    },
  ]

  // Filter and sort links
  let filteredLinks = filter === "all" ? links : links.filter((link) => link.status === filter)

  // Sort links based on sortOrder
  filteredLinks = [...filteredLinks].sort((a, b) => {
    if (sortOrder === "newest") {
      return b.createdDate - a.createdDate
    } else {
      return a.createdDate - b.createdDate
    }
  })

  const handleLogout = () => {
    navigate("/login")
  }

  const handleCreateLink = () => {
    console.log("Create new link clicked")
  }

  const handleShowQR = (linkId) => {
    setShowQRCode(showQRCode === linkId ? null : linkId)
  }

  const handleDeleteLink = (linkId) => {
    console.log("Delete link:", linkId)
  }

  const handleStatusFilter = (status) => {
    setFilter(status)
    setShowStatusDropdown(false)
  }

  const handleSortOrder = (order) => {
    setSortOrder(order)
    setShowSortDropdown(false)
  }

  // Function to generate and download QR code
  // Function to handle link clicks
  const handleLinkClick = (url) => {
    // Open link in new tab
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Function to generate and download QR code
  const handleDownloadQR = async (shortUrl, linkId) => {
    try {
      // Create canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size
      canvas.width = 200
      canvas.height = 200
      
      // Fill white background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // For demo purposes, create a simple pattern
      // In a real app, you'd use a QR code library like qrcode.js
      ctx.fillStyle = 'black'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('QR Code', canvas.width / 2, canvas.height / 2 - 10)
      ctx.fillText(shortUrl, canvas.width / 2, canvas.height / 2 + 10)
      
      // Create simple QR-like pattern for demo
      const size = 8
      for (let i = 0; i < canvas.width; i += size) {
        for (let j = 0; j < canvas.height; j += size) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, j, size - 1, size - 1)
          }
        }
      }
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `qr-code-${linkId}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
      
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const getStatusLabel = () => {
    switch (filter) {
      case "all":
        return "All Status"
      case "active":
        return "Active"
      case "expired":
        return "Expired"
      default:
        return "All Status"
    }
  }

  const getSortLabel = () => {
    return sortOrder === "newest" ? "Newest" : "Oldest"
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="auth-logo">
            <img src="/logo.png" alt="App Logo" style={{ width: "40px", height: "auto", marginBottom: "0.5rem" }} />
          </div>
          <span className="sidebar-title">Link Shortener</span>
        </div>

        <div className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Dashboard
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span className="username">Username</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Log out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="dashboard-header-section">
          <div className="header-content">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Overview of your URL shortening activity</p>
          </div>

          <Link to="/dashboard" className="create-link-btn">
            <img src="/createLink.png" alt="Create Link Icon" className="icon" />
            Create new link
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-card-header">
                <div className="stat-title">{stat.title}</div>
                {stat.hasIndicator && <span className={`status-dot ${stat.status}`}></span>}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-subtitle">{stat.subtitle}</div>
            </div>
          ))}
        </div>

        {/* Links section */}
        <div className="links-section">
          <div className="links-header">
            <h2 className="links-title">My Links</h2>

            <div className="filter-dropdowns">
              {/* Status Filter Dropdown */}
              <div className="dropdown-container">
                <button
                  className="dropdown-btn"
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown)
                    setShowSortDropdown(false)
                  }}
                >
                  {getStatusLabel()}
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
                    className={`dropdown-icon ${showStatusDropdown ? "rotated" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </button>
                {showStatusDropdown && (
                  <div className="dropdown-menu">
                    <button
                      className={`dropdown-item ${filter === "all" ? "active" : ""}`}
                      onClick={() => handleStatusFilter("all")}
                    >
                      All Status
                    </button>
                    <button
                      className={`dropdown-item ${filter === "active" ? "active" : ""}`}
                      onClick={() => handleStatusFilter("active")}
                    >
                      Active
                    </button>
                    <button
                      className={`dropdown-item ${filter === "expired" ? "active" : ""}`}
                      onClick={() => handleStatusFilter("expired")}
                    >
                      Expired
                    </button>
                  </div>
                )}
              </div>

              {/* Sort Order Dropdown */}
              <div className="dropdown-container">
                <button
                  className="dropdown-btn"
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown)
                    setShowStatusDropdown(false)
                  }}
                >
                  {getSortLabel()}
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
                    className={`dropdown-icon ${showSortDropdown ? "rotated" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </button>
                {showSortDropdown && (
                  <div className="dropdown-menu">
                    <button
                      className={`dropdown-item ${sortOrder === "newest" ? "active" : ""}`}
                      onClick={() => handleSortOrder("newest")}
                    >
                      Newest
                    </button>
                    <button
                      className={`dropdown-item ${sortOrder === "oldest" ? "active" : ""}`}
                      onClick={() => handleSortOrder("oldest")}
                    >
                      Oldest
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Links list */}
          <div className="links-container">
            {filteredLinks.map((link) => (
              <div key={link.id} className="link-item">
                <div className="link-header">
                  <div className="status-indicator">
                    <span className={`status-dot ${link.status}`}></span>
                    <span className={`status-text ${link.status}`}>
                      {link.status === "active" ? "Active" : "Expired"}
                    </span>
                  </div>

                  <div className="link-actions">
                    <button className="action-btn" onClick={() => handleShowQR(link.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#FFFFFF"><path d="M96-672v-192h192v72H168v120H96Zm0 576v-192h72v120h120v72H96Zm576 0v-72h120v-120h72v192H672Zm120-576v-120H672v-72h192v192h-72ZM672-288h48v48h-48v-48Zm0-96h48v48h-48v-48Zm-48 48h48v48h-48v-48Zm-48 48h48v48h-48v-48Zm-48-48h48v48h-48v-48Zm96-96h48v48h-48v-48Zm-48 48h48v48h-48v-48Zm-48-48h48v48h-48v-48Zm216-312v216H528v-216h216ZM432-432v216H216v-216h216Zm0-312v216H216v-216h216Zm-48 480v-120H264v120h120Zm0-312v-120H264v120h120Zm312 0v-120H576v120h120Z" /></svg>
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteLink(link.id)}>
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
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div 
                  className="link-url original clickable" 
                  onClick={() => handleLinkClick(link.originalUrl)}
                  title="Click to open original URL"
                >
                  {link.originalUrl}
                </div>
                <div 
                  className="link-url short clickable" 
                  onClick={() => handleLinkClick(link.shortUrl)}
                  title="Click to open shortened URL"
                >
                  {link.shortUrl}
                </div>

                <div className="link-meta">
                  <span>{link.clicks} clicks</span>
                  <span>Created {link.created}</span>
                  <span>Expires {link.expires}</span>
                </div>
                {showQRCode === link.id && (
                  <div className="qr-code-section">
                    <div className="qr-code-display">
                      <img src="/placeholder.svg?height=120&width=120" alt="QR Code" className="qr-code-image" />
                    </div>
                    <p className="qr-description">Scan this QR code to access the shortened URL</p>
                    <div className="qr-actions">
                      <button 
                        className="download-qr-btn"
                        onClick={() => handleDownloadQR(link.shortUrl, link.id)}
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard