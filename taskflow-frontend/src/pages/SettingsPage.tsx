"use client"

import type React from "react"
import { useAuth } from "../contexts/AuthContext"

const SettingsPage: React.FC = () => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  return (
    <div>
      <h1>Settings</h1>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  )
}

export default SettingsPage
