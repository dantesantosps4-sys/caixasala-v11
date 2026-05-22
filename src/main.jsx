import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-center"
        gutter={8}
        containerStyle={{ top: 16, zIndex: 9999 }}
        toastOptions={{
          duration: 3500,
          style: {
            background: "#1a2035",
            color: "#e2e8f8",
            border: "1px solid #2e3a60",
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Inter', system-ui, sans-serif",
            boxShadow: "0 8px 32px rgba(0,0,0,.5)",
            padding: "12px 18px",
            maxWidth: "90vw",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#141928" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#141928" } },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
