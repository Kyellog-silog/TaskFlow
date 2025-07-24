"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../hooks/use-toast"
import { Eye, EyeOff, LogIn } from "lucide-react"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User found, redirecting to dashboard:", user)
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Attempting login...")
      await login(email, password)

      toast({
        title: "Success",
        description: "Welcome back!",
      })

      // The useEffect above should handle the redirect when user state updates
      // But we can also try to navigate here as a fallback
      setTimeout(() => {
        navigate("/dashboard", { replace: true })
      }, 100)
    } catch (error: any) {
      console.error("Login failed:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Login failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">TF</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to TaskFlow</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    className="font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => {
                      // TODO: Implement forgot password functionality
                      toast({
                        title: "Coming Soon",
                        description: "Forgot password functionality will be available soon.",
                      })
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
