import React, { useState } from "react";
import { useCustomers } from "../context/CustomerContext";

const GoogleSheetsSync = () => {
  const { connectSheet, syncSheet, loading } = useCustomers();
  const [url, setUrl]     = useState("");
  const [status, setStatus] = useState("Not connected");

  const handleConnect = async () => {
    try {
      setStatus("Connecting…");
      await connectSheet(url);
      setStatus("Connected");
    } catch {
      setStatus("Connection failed");
    }
  };

  const handleSync = async () => {
    try {
      setStatus("Syncing…");
      await syncSheet();
      setStatus("Synced");
    } catch {
      setStatus("Sync failed");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, marginTop: 16 }}>
      <h2>Google Sheets</h2>
      <input
        type="text"
        placeholder="Sheet URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 4 }}
        disabled={loading}
      />
      <button onClick={handleConnect} disabled={loading} style={{ marginRight: 8 }}>
        Connect
      </button>
      <button onClick={handleSync} disabled={loading}>
        Sync
      </button>
      <p>Status: {status}</p>
    </div>
  );
};

export default GoogleSheetsSync;
