"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Home, ArrowLeft, Sparkles, Search, RefreshCw, Users, User, Settings, Folder } from 'lucide-react'

const NotFoundPage = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-10 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card
          className={`max-w-lg w-full text-center bg-white/80 backdrop-blur-xl border-2 border-white/20 shadow-2xl transform transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95"}`}
        >
          <CardHeader className="pb-4">
            <div className="mx-auto h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-2xl transform hover:scale-110 transition-all duration-300">
              <span className="text-5xl font-bold text-white animate-bounce">404</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Oops! Page Not Found
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg leading-relaxed">
              Looks like this page decided to take a vacation! 🏖️ Don't worry, we'll help you find your way back to
              your productivity paradise.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Link to="/dashboard">
                  <Home className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1 bg-white/50 border-2 border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg font-bold py-3 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Search className="h-5 w-5 text-blue-500" />
                <p className="text-sm font-bold text-gray-700">Looking for something specific?</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Link
                  to="/teams"
                  className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  View Teams
                </Link>
                <Link
                  to="/profile"
                  className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg text-purple-600 hover:bg-purple-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <User className="h-4 w-4 mx-auto mb-1" />
                  Edit Profile
                </Link>
                <Link
                  to="/settings"
                  className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg text-green-600 hover:bg-green-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <Settings className="h-4 w-4 mx-auto mb-1" />
                  Settings
                </Link>
                <Link
                  to="/boards"
                  className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg text-yellow-600 hover:bg-yellow-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <Folder className="h-4 w-4 mx-auto mb-1" />
                  All Boards
                </Link>
              </div>
            </div>

            {/* Fun Message */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                <p className="text-sm">
                  Lost? No worries! Even the best explorers need a compass sometimes. 🧭
                </p>
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NotFoundPage