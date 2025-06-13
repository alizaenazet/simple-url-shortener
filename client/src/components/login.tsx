import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const Login = () => {
    const [username, setUsername] = useState("") 
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Client-side validation
        if (!username.trim() || !password.trim()) {
            setError("All fields are required")
            setIsLoading(false)
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username, 
                    password
                }),
            })

            const data = await response.json()

            if (response.ok && data.status === 'success') {
                localStorage.setItem('token', data.data.token)
                
                const userData = {
                    id: data.data.userId,       
                    username: data.data.username 
                }
                localStorage.setItem('user', JSON.stringify(userData))
                
                navigate("/dashboard")
            } else {
                if (data.errors && data.errors.length > 0) {
                    const errorMessages = data.errors.map(err => err.message).join('. ')
                    setError(errorMessages)
                } else {
                    setError(data.message || "Login failed. Please try again.")
                }
            }
        } catch (err) {
            console.error('Login error:', err)
            setError("Network error. Please check your connection and try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="glow-bg"></div>
                <div className="glow-bg2"></div>
                <div className="auth-logo">
                    <img
                        src="/logo.png"
                        alt="App Logo"
                        style={{ width: "80px", height: "auto", marginBottom: "0.5rem" }}
                    />
                    <h1 className="h1-title">URL Shortener & QR Generator</h1>
                    <p className="auth-subtitle">Transform long URLs into short, shareable links with QR codes</p>
                </div>

                <div className="auth-card">
                    <div className="auth-header">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="25px"
                            viewBox="0 -960 960 960"
                            width="25px"
                            fill="#B473C3"
                            className="auth-icon"
                            style={{ marginRight: "0.2rem", verticalAlign: "middle" }}
                        >
                            <path d="M481-120v-60h299v-600H481v-60h299q24 0 42 18t18 42v600q0 24-18 42t-42 18H481Zm-55-185-43-43 102-102H120v-60h363L381-612l43-43 176 176-174 174Z" />
                        </svg>
                        Log in to your account
                    </div>

                    <p className="auth-description">Enter your credentials to access your dashboard</p>
                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Log in"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login