"use client";

import React, { createContext, useState, useContext, useEffect } from "react";

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [sheetId, setSheetId]     = useState(null);
  const [loading, setLoading]     = useState(false);

  // fetch existing customers
  const fetchCustomers = async () => {
    const res  = await fetch("http://localhost:5000/api/customers");
    const data = await res.json();
    setCustomers(data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // upload file to backend
  const uploadCustomers = async (file) => {
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("http://localhost:5000/api/customers", {
      method: "POST",
      body: form,
    });
    const result = await res.json();
    await fetchCustomers();
    setLoading(false);
    return result;
  };

  // connect to Google Sheet
  const connectSheet = async (sheetUrl) => {
    const res = await fetch("http://localhost:5000/api/google-sheets/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetUrl }),
    });
    const { sheetId } = await res.json();
    setSheetId(sheetId);
    return sheetId;
  };

  // sync with Google Sheet
  const syncSheet = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/google-sheets/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await res.json();
    await fetchCustomers();
    setLoading(false);
    return result;
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        loading,
        uploadCustomers,
        connectSheet,
        syncSheet,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => useContext(CustomerContext);
