import React from "react"
import ReactDOM from "react-dom/client"
import './index.css'
import App from "./App"
import reportWebVitals from "./reportWebVitals"
import { useAuthInit } from './hooks/UseAuthInit'

const Root = () => {
  useAuthInit()

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(<Root />)

reportWebVitals()
