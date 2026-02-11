import React, { useState } from "react";
import * as XLSX from "xlsx";

function BulkUpload({ user, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [validUsers, setValidUsers] = useState([]);
  const [invalidUsers, setInvalidUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const validate = (u) => {
    const errors = [];
    const required = ['first_name', 'last_name', 'contact', 'email', 'address', 'password'];
    required.forEach(field => { if (!u[field]?.trim()) errors.push(`${field.replace('_', ' ')} required`); });
    if (errors.length > 0) return errors;
    if (u.first_name.trim().length > 50) errors.push("First name max 50 chars");
    if (u.last_name.trim().length > 50) errors.push("Last name max 50 chars");
    if (!/^\d{10}$/.test(u.contact.trim())) errors.push("Contact must be 10 digits");
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(u.email.trim())) errors.push("Email must be @gmail.com");
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[#@$&]).{8,12}$/.test(u.password.trim())) errors.push("Password: 8-12 chars, upper, lower, number, special (#,$,&,@)");
    return errors;
  };

  const handleParse = async () => {
  if (!file) return setError("Please select a file first");
  setError("");

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    if (jsonData.length === 0) return setError("File is empty");
    const headers = Object.keys(jsonData[0] || {});
    const required = ["First Name", "Last Name", "Contact", "Email", "Address", "Password"];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) return setError(`Missing columns: ${missing.join(", ")}`);

    const valid = [], invalid = [];
    jsonData.forEach((row, i) => {
      const u = { 
        first_name: row["First Name"] || "", 
        last_name: row["Last Name"] || "", 
        contact: row["Contact"] ? String(row["Contact"]) : "", 
        email: row["Email"] || "", 
        address: row["Address"] || "", 
        password: row["Password"] || "" 
      };
      const errs = validate(u);
      if (errs.length === 0) valid.push({ row: i + 2, data: u });
      else invalid.push({ row: i + 2, data: u, errors: errs });
    });

    setValidUsers(valid);
    setInvalidUsers(invalid);
    setStep(2);
  } catch (err) {
    setError("Failed to parse file. Make sure it's a valid Excel or CSV file.");
  }
};

  const handleUpload = async () => {
    if (validUsers.length === 0) return setError("No valid users to upload");
    setUploading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/users/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: validUsers.map(u => u.data), userRole: user.role })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }
      setResults(await res.json());
      setStep(3);
      setUploading(false);
    } catch (err) {
      setError("Upload failed: " + err.message);
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { "First Name": "John", "Last Name": "Doe", "Contact": "9876543210", "Email": "john@gmail.com", "Address": "123 Main St", "Password": "Pass@123" },
      { "First Name": "Jane", "Last Name": "Smith", "Contact": "9876543211", "Email": "jane@gmail.com", "Address": "456 Oak Ave", "Password": "Test@456" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "bulk_upload_template.xlsx");
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setFileName("");
    setValidUsers([]);
    setInvalidUsers([]);
    setResults(null);
    setError("");
    setUploading(false);
  };

  const renderStep1 = () => (
    <div>
      <div className="upload-instructions">
        <h4>Instructions:</h4>
        <ul><li>Download the template Excel file</li><li>Fill in user details (all fields required)</li><li>Upload the completed file</li></ul>
        <button onClick={downloadTemplate} className="template-btn">📥 Download Template</button>
      </div>
      <div className="file-upload-section">
        <label className="file-upload-label">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setFileName(f.name); setError(""); } }} style={{ display: "none" }} />
          <div className="upload-icon">📁</div>
          <div className="upload-text">{fileName || "Click to select Excel or CSV file"}</div>
        </label>
      </div>
      <div className="modal-actions">
        <button onClick={onClose} className="cancel-btn">Cancel</button>
        <button onClick={handleParse} className="submit-btn" disabled={!file}>Next: Preview Data</button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="preview-summary">
        <h4>Upload Summary</h4>
        <div className="preview-stats">
          <div className="stat-item"><span>Total:</span><span className="stat-value">{validUsers.length + invalidUsers.length}</span></div>
          <div className="stat-item success"><span>Valid:</span><span className="stat-value">{validUsers.length}</span></div>
          <div className="stat-item failed"><span>Invalid:</span><span className="stat-value">{invalidUsers.length}</span></div>
        </div>
      </div>
      {validUsers.length > 0 && (
        <div className="success-section">
          <h5>✅ Valid Records ({validUsers.length})</h5>
          <div className="preview-list">
            {validUsers.slice(0, 5).map(item => <div key={item.row} className="preview-item"><span className="row-number">Row {item.row}:</span><span>{item.data.first_name} {item.data.last_name} ({item.data.email})</span></div>)}
            {validUsers.length > 5 && <div className="preview-item"><span>...and {validUsers.length - 5} more</span></div>}
          </div>
        </div>
      )}
      {invalidUsers.length > 0 && (
        <div className="failed-section">
          <h5>❌ Invalid Records ({invalidUsers.length})</h5>
          <div className="preview-list">
            {invalidUsers.map(item => <div key={item.row} className="preview-item failed-item"><div><span className="row-number">Row {item.row}:</span><span>{item.data.first_name} {item.data.last_name}</span></div><div className="error-msg">{item.errors.join(", ")}</div></div>)}
          </div>
        </div>
      )}
      {invalidUsers.length > 0 && <div className="preview-warning">⚠️ Invalid records will not be uploaded. Only valid records will be processed.</div>}
      <div className="modal-actions">
        <button onClick={reset} className="cancel-btn">← Back</button>
        <button onClick={handleUpload} className="submit-btn" disabled={validUsers.length === 0 || uploading}>{uploading ? "Uploading..." : `Upload ${validUsers.length} Valid Record${validUsers.length !== 1 ? "s" : ""}`}</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className="preview-summary">
        <h4>Upload Complete</h4>
        <div className="preview-stats">
          <div className="stat-item success"><span>✅ Successful:</span><span className="stat-value">{results.summary.success}</span></div>
          <div className="stat-item failed"><span>❌ Failed:</span><span className="stat-value">{results.summary.failed}</span></div>
        </div>
      </div>
      {results.successful.length > 0 && (
        <div className="success-section">
          <h5>✅ Successfully Added ({results.successful.length})</h5>
          <div className="results-list">{results.successful.map(item => <div key={item.row} className="result-item"><span className="row-number">Row {item.row}:</span><span>{item.data.first_name} {item.data.last_name} ({item.data.email})</span></div>)}</div>
        </div>
      )}
      {results.failed.length > 0 && (
        <div className="failed-section">
          <h5>❌ Failed ({results.failed.length})</h5>
          <div className="results-list">{results.failed.map(item => <div key={item.row} className="result-item failed-item"><div><span className="row-number">Row {item.row}:</span><span>{item.data.first_name} {item.data.last_name}</span></div><div className="error-msg">{item.errors.join(", ")}</div></div>)}</div>
        </div>
      )}
      <div className="modal-actions">
        <button onClick={reset} className="cancel-btn">Upload More</button>
        <button onClick={onComplete} className="submit-btn">Close</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content bulk-upload-modal">
        <div className="modal-header"><h2>Bulk Upload Users</h2><button className="close-btn" onClick={onClose}>×</button></div>
        {error && <div className="error-message">{error}</div>}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && results && renderStep3()}
      </div>
    </div>
  );
}

export default BulkUpload;