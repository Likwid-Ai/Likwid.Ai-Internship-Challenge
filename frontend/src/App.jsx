import React from "react";
import { CustomerProvider } from "./context/CustomerContext";
import CustomerUpload from "./components/CustomerUpload";
import CustomerDashboard from "./components/CustomerDashboard";
import GoogleSheetsSync from "./components/GoogleSheetsSync";

function App() {
  return (
    <CustomerProvider>
      <div style={{ maxWidth: 800, margin: "auto", padding: 16 }}>
        <CustomerUpload />
        <CustomerDashboard />
        <GoogleSheetsSync />
      </div>
    </CustomerProvider>
  );
}

export default App;
