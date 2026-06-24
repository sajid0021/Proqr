import React from 'react'
import { createRoot } from 'react-dom/client'
// App moved to client/src; import a minimal shim that redirects users to the client app during development.
import React from 'react'

function Redirect() {
  return (
    <div style={{padding:40,fontFamily:'sans-serif'}}>
      <h1>ProQR Studio</h1>
      <p>Please run the client app from the <strong>client</strong> folder: <code>cd client && npm run dev</code></p>
    </div>
  )
}

const App = Redirect
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
