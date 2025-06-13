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

interface UserProfile {
    id: string
    username: string
    email: string
    fullName?: string
}

// Fix: Ensure the BASE_API_URL points to the correct backend server
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
    const [userId, setUserId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [showQRCodeForId, setShowQRCodeForId] = useState<string | null>(null)
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)
    const [showSortDropdown, setShowSortDropdown] = useState(false)

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

            const tokenParts = token.split('.')
            if (tokenParts.length !== 3) {
                console.error('Invalid JWT token format - expected 3 parts, got:', tokenParts.length)
                console.error('Token parts:', tokenParts)
                return null
            }

            const payload = tokenParts[1]
            console.log('JWT payload part:', payload)

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

    // Function to extract user profile from JWT token (since there's no API endpoint for this)
    const getUserProfileFromToken = useCallback(() => {
        const token = getAuthToken()
        if (!token) {
            console.error('No token available for extracting user profile')
            return null
        }

        try {
            const tokenParts = token.split('.')
            if (tokenParts.length !== 3) {
                console.error('Invalid JWT token format')
                return null
            }

            const payload = tokenParts[1]
            const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
            const decodedPayload = JSON.parse(atob(paddedPayload))

            console.log('Decoded token payload for user profile:', decodedPayload)

            const userProfile: UserProfile = {
                id: decodedPayload.userId || decodedPayload.id || decodedPayload.sub || 'unknown',
                username: decodedPayload.username || decodedPayload.name || 'User',
                email: decodedPayload.email || '',
                fullName: decodedPayload.fullName || decodedPayload.name || decodedPayload.username || 'User'
            }

            return userProfile
        } catch (error) {
            console.error('Error extracting user profile from token:', error)
            return {
                id: 'unknown',
                username: 'User',
                email: '',
                fullName: 'User'
            }
        }
    }, [])

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

        // Extract user profile from token since there's no API endpoint
        const profile = getUserProfileFromToken()
        if (profile) {
            setUserProfile(profile)
            console.log('User profile extracted from token:', profile)
        }
    }, [navigate, getUserProfileFromToken])

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

            const fetchUrl = `${BASE_API_URL}?${queryParams}`
            console.log('Fetching from URL:', fetchUrl) 
            console.log('Base API URL:', BASE_API_URL) // Debug log to check the URL

            const response = await fetch(fetchUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            console.log('Response status:', response.status) 
            console.log('Response headers:', Object.fromEntries(response.headers.entries())) 
            console.log('Response URL:', response.url) // Debug log to see actual URL

            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text()
                console.error('Expected JSON response but got:', contentType)
                console.error('Response text:', responseText)
                console.error('Attempted URL:', fetchUrl)
                
                // More specific error message
                if (response.status === 404) {
                    setError(`API endpoint not found. Please check if your backend server is running on port 8080 and the URLs API is available. Current URL: ${fetchUrl}`)
                } else {
                    setError(`API endpoint returned HTML instead of JSON. Expected JSON but got ${contentType || 'unknown content type'}. Check if you're connecting to the right server.`)
                }
                setLoading(false)
                return
            }

            const result: ApiResponse<ShortUrl[]> = await response.json()
            console.log('API Response:', result) // Debug log

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
                } else if (response.status === 404) {
                    setError("API endpoint not found. Please check your backend server configuration.")
                } else if (result.errors && result.errors.length > 0) {
                    setError(result.message || result.errors[0].message || "Failed to fetch links.")
                } else {
                    setError(result.message || "Failed to fetch links. Please try again.")
                }
            }
        } catch (err) {
            console.error("Error fetching links:", err)
            console.error("Attempted URL:", `${BASE_API_URL}?${new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                sortBy: sortBy,
                sortOrder: sortOrder,
                status: filter,
            }).toString()}`)
            
            if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
                setError("Server returned invalid response. The API endpoint may not exist or may be returning HTML instead of JSON. Please check if your backend server is running correctly.")
            } else if (err instanceof TypeError && err.message.includes('fetch')) {
                setError("Cannot connect to the server. Please check if your backend server is running on the correct port (8080).")
            } else {
                setError("Network error or server is unreachable. Please check your backend server.")
            }
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
        navigate("/shortener")
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
            const deleteUrl = `${BASE_API_URL}/${shortCode}`
            console.log('Deleting link at URL:', deleteUrl) 

            const response = await fetch(deleteUrl, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            // Check content type before parsing JSON
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text()
                console.error('Expected JSON response but got:', contentType)
                console.error('Response text:', responseText)
                setError(`API endpoint not found. Expected JSON but got ${contentType || 'unknown content type'}`)
                setLoading(false)
                return
            }

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
            if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
                setError("Server returned invalid response. The API endpoint may not exist.")
            } else {
                setError("Network error during deletion.")
            }
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
                        <span className="username">
                            {userProfile?.fullName || userProfile?.username || 'Loading...'}
                        </span>
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
                {error && (
                    <div className="error-message" style={{ 
                        color: "red", 
                        marginTop: "1rem", 
                        padding: "1rem", 
                        backgroundColor: "rgba(255, 0, 0, 0.1)", 
                        borderRadius: "4px",
                        border: "1px solid rgba(255, 0, 0, 0.3)"
                    }}>
                        <strong>Error:</strong> {error}
                        <br />
                        <small style={{ color: "#666", marginTop: "0.5rem", display: "block" }}>
                            Debug Info: Trying to connect to {BASE_API_URL}
                        </small>
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && <div style={{ color: '#ccc', textAlign: 'center', marginTop: '2rem' }}>Loading links...</div>}

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