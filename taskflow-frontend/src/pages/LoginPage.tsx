"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../hooks/use-toast"
import { Eye, EyeOff, LogIn, Sparkles, ArrowRight, Shield, Zap } from "lucide-react"
import logger from "../lib/logger"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
    if (user) {
      logger.log("User found, redirecting to dashboard:", user)
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
  logger.log("Attempting login...")
      await login(email, password)

      toast({
        title: "Welcome back! 🎉",
        description: "Successfully signed in to TaskFlow",
      })

      setTimeout(() => {
        navigate("/dashboard", { replace: true })
      }, 100)
    } catch (error: any) {
      logger.error("Login failed:", error)
      toast({
        title: "Sign in failed",
        description: error.response?.data?.message || error.message || "Please check your credentials",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-md w-full space-y-8 transform transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300 hover:rotate-3">
              <span className="text-white font-bold text-2xl">TF</span>
            </div>
            <h2 className="mt-6 text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-3 text-lg text-gray-600">Sign in to continue your productivity journey</p>
            <p className="mt-2 text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-purple-600 transition-colors duration-200 hover:underline"
              >
                Create one now →
              </Link>
            </p>
          </div>

          {/* Login Card */}
          <Card className="bg-white/80 backdrop-blur-xl border-2 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center space-x-2">
                <Shield className="h-6 w-6 text-blue-500" />
                <span>Secure Sign In</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter your credentials to access your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-white/50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 text-gray-900 placeholder:text-gray-500 group-hover:border-blue-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <div className="h-2 w-2 bg-blue-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-white/50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 text-gray-900 placeholder:text-gray-500 pr-12 group-hover:border-blue-300"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-md transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors duration-200" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors duration-200" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center group">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200 group-hover:border-blue-400"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700 group-hover:text-blue-600 transition-colors duration-200"
                    >
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-600 hover:text-purple-600 transition-colors duration-200 hover:underline"
                    onClick={() => {
                      toast({
                        title: "Coming Soon! 🚀",
                        description: "Password reset functionality will be available soon.",
                      })
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Signing you in...</span>
                      <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <LogIn className="h-5 w-5 mr-2" />
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>

                {/* Features Preview */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600 mb-4">What you'll get access to:</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>Lightning-fast boards</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Secure collaboration</span>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our{" "}
              <button className="text-blue-600 hover:text-purple-600 transition-colors duration-200 underline">
                Terms of Service
              </button>{" "}
              and{" "}
              <button className="text-blue-600 hover:text-purple-600 transition-colors duration-200 underline">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
