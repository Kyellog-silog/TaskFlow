"use client"

import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Home, ArrowLeft } from "lucide-react"

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-blue-600">404</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Page Not Found</CardTitle>
          <CardDescription className="text-gray-600">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the
            wrong URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-3">Need help? Here are some useful links:</p>
            <div className="flex flex-col space-y-2 text-sm">
              <Link to="/teams" className="text-blue-600 hover:text-blue-800">
                View Teams
              </Link>
              <Link to="/profile" className="text-blue-600 hover:text-blue-800">
                Edit Profile
              </Link>
              <Link to="/settings" className="text-blue-600 hover:text-blue-800">
                Settings
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFoundPage
