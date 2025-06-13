import React, { useState, useEffect, useCallback } from "react" 
import { Link, useNavigate } from "react-router-dom"

interface ShortUrl {
  shortUrlId: string
  longUrl: string
  shortCode: string
  fullShortUrl: string
  createdAt: string 
  expiresAt: string
  visits: number
  isActive: boolean
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface ApiResponse<T> {
  status: "success" | "error"
  message: string
  data: T | null
  errors: { field?: string; code?: string; message: string }[] | null
  pagination?: Pagination 
}

const BASE_API_URL = `${import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080'}/urls`;
const SHORT_LINK_BASE_URL = import.meta.env.VITE_SHORT_LINK_BASE_URL || "http://localhost:8080/"; 

const Dashboard = () => {
  const [links, setLinks] = useState<ShortUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all")
  const [sortBy, setSortBy] = useState<"createdAt" | "visits" | "expiresAt">("createdAt") 
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc") 
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) 
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  const [showQRCodeForId, setShowQRCodeForId] = useState<string | null>(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Create link modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    longUrl: "",
    customShort: "",
    expiresInDays: 7
  })

  const navigate = useNavigate()

  const getAuthToken = (): string | null => {
    return localStorage.getItem("userToken")
  }

  // Enhanced function to get user ID from JWT token with better error handling
  const getUserIdFromToken = (): string | null => {
    const token = getAuthToken()
    if (!token || token === 'undefined' || token === 'null') {
      console.log('No valid token found, token value:', token)
      return null
    }
    
    try {
      console.log('Processing token:', token)
      
      // Split the token and validate it has 3 parts
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        console.error('Invalid JWT token format - expected 3 parts, got:', tokenParts.length)
        console.error('Token parts:', tokenParts)
        return null
      }

      // Decode the payload (second part of JWT)
      const payload = tokenParts[1]
      console.log('JWT payload part:', payload)
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
      
      try {
        const decodedPayload = JSON.parse(atob(paddedPayload))
        console.log('Decoded JWT payload:', decodedPayload)
        
        // Check for userId in different possible field names
        const userId = decodedPayload.userId || decodedPayload.id || decodedPayload.sub || null
        console.log('Extracted userId:', userId)
        return userId
      } catch (parseError) {
        console.error('Error parsing JWT payload:', parseError)
        console.error('Payload:', payload)
        console.error('Padded payload:', paddedPayload)
        return null
      }
    } catch (error) {
      console.error('Error processing JWT token:', error)
      // If token is corrupted, remove it and redirect to login
      localStorage.removeItem("userToken")
      return null
    }
  }

  // Initialize user ID when component mounts
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      navigate("/login")
      return
    }

    const userIdFromToken = getUserIdFromToken()
    if (!userIdFromToken) {
      setError("Invalid authentication token. Please log in again.")
      localStorage.removeItem("userToken")
      navigate("/login")
      return
    }

    setUserId(userIdFromToken)
  }, [navigate])

  const fetchUserLinks = useCallback(async () => {
    if (!userId) return // Don't fetch if we don't have userId yet
    
    setLoading(true)
    setError(null)
    const token = getAuthToken()

    if (!token) {
      setError("Authentication required. Please log in.")
      setLoading(false)
      navigate("/login")
      return
    }

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
        status: filter,
      }).toString()

      const response = await fetch(`${BASE_API_URL}?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const result: ApiResponse<ShortUrl[]> = await response.json()

      if (response.ok && result.status === "success" && result.data) {
        setLinks(result.data)
        
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setCurrentPage(result.pagination.currentPage)
          setTotalItems(result.pagination.totalItems)
        }
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          localStorage.removeItem("userToken")
          navigate("/login")
        } else if (result.errors && result.errors.length > 0) {
          setError(result.message || result.errors[0].message || "Failed to fetch links.")
        } else {
          setError(result.message || "Failed to fetch links. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error fetching links:", err)
      setError("Network error or server is unreachable.")
    } finally {
      setLoading(false)
    }
  }, [userId, currentPage, itemsPerPage, sortBy, sortOrder, filter, navigate])

  useEffect(() => {
    if (userId) {
      fetchUserLinks()
    }
  }, [fetchUserLinks, userId]) 

  const totalLinks = totalItems 
  const activeLinks = links.filter(link => link.isActive).length
  const expiredLinks = links.filter(link => !link.isActive).length
  const totalClicks = links.reduce((sum, link) => sum + link.visits, 0)

  const stats = [
    { title: "Total Links", value: totalLinks.toString(), subtitle: "Links created" },
    { title: "Total Clicks", value: totalClicks.toString(), subtitle: "Links visits" },
    { title: "Active Links", value: activeLinks.toString(), subtitle: "Currently active", hasIndicator: true, status: "active" },
    { title: "Expired Links", value: expiredLinks.toString(), subtitle: "No longer active", hasIndicator: true, status: "expired" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("userToken") 
    localStorage.removeItem("user")
    navigate("/login")
  }

  const handleCreateLink = () => {
    setShowCreateModal(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError(null)

    const token = getAuthToken()
    if (!token || !userId) {
      setError("Authentication required to create links.")
      setCreateLoading(false)
      return
    }

    try {
      const requestBody = {
        longUrl: createForm.longUrl,
        customShort: createForm.customShort || undefined,
        expiresInDays: createForm.expiresInDays
      }

      const response = await fetch(BASE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody)
      })

      const result: ApiResponse<ShortUrl> = await response.json()

      if (response.ok && result.status === "success") {
        alert(result.message || "Short URL created successfully!")
        setShowCreateModal(false)
        setCreateForm({ longUrl: "", customShort: "", expiresInDays: 7 })
        fetchUserLinks()
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          localStorage.removeItem("userToken")
          navigate("/login")
        } else if (response.status === 409) {
          setError(result.message || "Custom short code is already taken.")
        } else if (result.errors && result.errors.length > 0) {
          setError(result.message || result.errors[0].message || "Failed to create link.")
        } else {
          setError(result.message || "Failed to create link. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error creating link:", err)
      setError("Network error during link creation.")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleShowQR = (linkId: string, shortUrl: string) => {
    setShowQRCodeForId(showQRCodeForId === linkId ? null : linkId)
  }

  const handleDeleteLink = async (shortCode: string) => {
    if (!window.confirm(`Are you sure you want to delete the link with short code "${shortCode}"?`)) {
      return
    }

    const token = getAuthToken()
    if (!token || !userId) {
      setError("Authentication required to delete links.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${BASE_API_URL}/${shortCode}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const result: ApiResponse<null> = await response.json()

      if (response.ok && result.status === "success") {
        alert(result.message || "Link deleted successfully.")
        fetchUserLinks() 
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.")
          localStorage.removeItem("userToken")
          navigate("/login")
        } else if (response.status === 403) {
          setError(result.message || "You don't have permission to delete this link.")
        } else if (response.status === 404) {
          setError(result.message || "Link not found or already deleted.")
        } else if (result.errors && result.errors.length > 0) {
          setError(result.message || result.errors[0].message || "Failed to delete link.")
        } else {
          setError(result.message || "Failed to delete link. Please try again.")
        }
      }
    } catch (err) {
      console.error("Error deleting link:", err)
      setError("Network error during deletion.")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusFilter = (status: "all" | "active" | "expired") => {
    setFilter(status)
    setCurrentPage(1) 
    setShowStatusDropdown(false)
  }

  const handleSortOrder = (order: "asc" | "desc") => {
    setSortOrder(order)
    setCurrentPage(1)
    setShowSortDropdown(false)
  }

  const handleSortBy = (key: "createdAt" | "visits" | "expiresAt") => {
    setSortBy(key)
    setCurrentPage(1)
    setShowSortDropdown(false)
  }

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadQR = (shortUrl: string, shortUrlId: string) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`;
    window.open(qrCodeUrl, '_blank');
  }

  const getStatusLabel = () => {
    switch (filter) {
      case "all": return "All Status"
      case "active": return "Active"
      case "expired": return "Expired"
      default: return "All Status"
    }
  }

  const getSortByLabel = () => {
    switch (sortBy) {
      case "createdAt": return "Created At"
      case "visits": return "Visits"
      case "expiresAt": return "Expires At"
      default: return "Created At"
    }
  }

  const getSortOrderLabel = () => {
    return sortOrder === "desc" ? "Newest" : "Oldest"
  }

  // Show loading screen while we're determining the user ID
  if (!userId && !error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ccc' }}>
        Initializing...
      </div>
    )
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

          <button className="create-link-btn" onClick={handleCreateLink}>
            <img src="/createLink.png" alt="Create Link Icon" className="icon" />
            Create new link
          </button>
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

        {/* Error Display */}
        {error && <div className="error-message" style={{ color: "red", marginTop: "1rem" }}>{error}</div>}

        {/* Loading Indicator */}
        {loading && <div style={{ color: '#ccc', textAlign: 'center', marginTop: '2rem' }}>Loading links...</div>}

        {/* Create Link Modal */}
        {showCreateModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
              <h2 style={{ marginBottom: '1rem', color: '#333' }}>Create New Short Link</h2>
              <form onSubmit={handleCreateSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Long URL *</label>
                  <input
                    type="url"
                    value={createForm.longUrl}
                    onChange={(e) => setCreateForm({...createForm, longUrl: e.target.value})}
                    placeholder="https://example.com/very/long/url"
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Custom Short Code (Optional)</label>
                  <input
                    type="text"
                    value={createForm.customShort}
                    onChange={(e) => setCreateForm({...createForm, customShort: e.target.value})}
                    placeholder="my-custom-link"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Expires In Days *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={createForm.expiresInDays}
                    onChange={(e) => setCreateForm({...createForm, expiresInDays: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateForm({ longUrl: "", customShort: "", expiresInDays: 7 })
                    }}
                    style={{ padding: '0.75rem 1.5rem', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: createLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {createLoading ? 'Creating...' : 'Create Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Links section */}
        {!loading && !error && links.length === 0 && (
          <div style={{ color: '#ccc', textAlign: 'center', marginTop: '2rem' }}>No links found. Create your first short link!</div>
        )}

        {!loading && links.length > 0 && (
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

                {/* Sort By Dropdown */}
                <div className="dropdown-container">
                  <button
                    className="dropdown-btn"
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown)
                      setShowStatusDropdown(false)
                    }}
                  >
                    Sort by: {getSortByLabel()} ({getSortOrderLabel()})
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
                      <div className="dropdown-group-title">Sort By</div>
                      <button
                        className={`dropdown-item ${sortBy === "createdAt" ? "active" : ""}`}
                        onClick={() => handleSortBy("createdAt")}
                      >
                        Created At
                      </button>
                      <button
                        className={`dropdown-item ${sortBy === "visits" ? "active" : ""}`}
                        onClick={() => handleSortBy("visits")}
                      >
                        Visits
                      </button>
                      <button
                        className={`dropdown-item ${sortBy === "expiresAt" ? "active" : ""}`}
                        onClick={() => handleSortBy("expiresAt")}
                      >
                        Expires At
                      </button>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-group-title">Order</div>
                      <button
                        className={`dropdown-item ${sortOrder === "desc" ? "active" : ""}`}
                        onClick={() => handleSortOrder("desc")}
                      >
                        Newest (Descending)
                      </button>
                      <button
                        className={`dropdown-item ${sortOrder === "asc" ? "active" : ""}`}
                        onClick={() => handleSortOrder("asc")}
                      >
                        Oldest (Ascending)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Links list */}
            <div className="links-container">
              {links.map((link) => (
                <div key={link.shortUrlId} className="link-item">
                  <div className="link-header">
                    <div className="status-indicator">
                      <span className={`status-dot ${link.isActive ? "active" : "expired"}`}></span>
                      <span className={`status-text ${link.isActive ? "active" : "expired"}`}>
                        {link.isActive ? "Active" : "Expired"}
                      </span>
                    </div>

                    <div className="link-actions">
                      <button className="action-btn" onClick={() => handleShowQR(link.shortUrlId, link.fullShortUrl)}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#FFFFFF"><path d="M96-672v-192h192v72H168v120H96Zm0 576v-192h72v120h120v72H96Zm576 0v-72h120v-120h72v192H672Zm120-576v-120H672v-72h192v192h-72ZM672-288h48v48h-48v-48Zm0-96h48v48h-48v-48Zm-48 48h48v48h-48v-48Zm-48 48h48v48h-48v-48Zm-48-48h48v48h-48v-48Zm96-96h48v48h-48v-48Zm-48 48h48v48h-48v-48Zm-48-48h48v48h-48v-48Zm216-312v216H528v-216h216ZM432-432v216H216v-216h216Zm0-312v216H216v-216h216Zm-48 480v-120H264v120h120Zm0-312v-120H264v120h120Zm312 0v-120H576v120h120Z" /></svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteLink(link.shortCode)}>
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
                    onClick={() => handleLinkClick(link.longUrl)}
                    title="Click to open original URL"
                  >
                    {link.longUrl}
                  </div>
                  <div
                    className="link-url short clickable"
                    onClick={() => handleLinkClick(link.fullShortUrl)}
                    title="Click to open shortened URL"
                  >
                    {link.fullShortUrl}
                  </div>

                  <div className="link-meta">
                    <span>{link.visits} clicks</span>
                    <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                    <span>Expires {new Date(link.expiresAt).toLocaleDateString()}</span>
                  </div>
                  
                  {showQRCodeForId === link.shortUrlId && (
                    <div className="qr-code-section">
                      <div className="qr-code-display">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(link.fullShortUrl)}`} alt="QR Code" className="qr-code-image" />
                      </div>
                      <p className="qr-description">Scan this QR code to access the shortened URL</p>
                      <div className="qr-actions">
                        <button
                          className="download-qr-btn"
                          onClick={() => handleDownloadQR(link.fullShortUrl, link.shortUrlId)}
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span style={{ color: '#ccc', display: 'flex', alignItems: 'center' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard