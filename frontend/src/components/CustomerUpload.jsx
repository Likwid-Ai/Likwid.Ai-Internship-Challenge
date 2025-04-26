import React, { useState } from "react";
import { useCustomers } from "../context/CustomerContext";
import * as XLSX from "xlsx";

const CustomerUpload = () => {
  const { uploadCustomers, loading } = useCustomers();
  const [file, setFile]     = useState(null);
  const [error, setError]   = useState("");
  const [preview, setPreview] = useState([]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setError("");
    setPreview([]);

    if (!f) return;
    if (!/\.(xlsx|xls)$/.test(f.name)) {
      setError("Please upload an .xlsx or .xls file");
      return;
    }
    setFile(f);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      setPreview(data.slice(0, 3));
    };
    reader.readAsArrayBuffer(f);
  };

  const handleUpload = async () => {
    if (!file) return setError("Select a file first");
    try {
      const { added, updated } = await uploadCustomers(file);
      setFile(null);
      setPreview([]);
      document.getElementById("file-upload").value = "";
      alert(`Added: ${added}, Updated: ${updated}`);
    } catch {
      setError("Upload failed");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
      <h2>Upload Customer Data</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        id="file-upload"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        disabled={loading}
      />
      {preview.length > 0 && (
        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {Object.keys(preview[0]).map((h) => (
                <th key={h} style={{ border: "1px solid #ccc", padding: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((v, j) => (
                  <td key={j} style={{ border: "1px solid #ccc", padding: 8 }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{ marginTop: 16, padding: "8px 16px" }}
      >
        {loading ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
};

export default CustomerUpload;
