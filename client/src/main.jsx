import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyTheme, loadSavedTheme } from './themes'
// paint the saved theme before React renders, so the page never flashes the wrong colours
applyTheme(loadSavedTheme())
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
