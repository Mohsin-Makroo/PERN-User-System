import { useState } from "react";
import * as XLSX from "xlsx";

function BulkUpload({ onClose, onSuccess, userRole }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [validUsers, setValidUsers] = useState([]);
  const [invalidUsers, setInvalidUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [finalResults, setFinalResults] = useState(null);
  const [error, setError] = useState("");

  const REQUIRED_HEADERS = ["First Name", "Last Name", "Contact", "Email", "Address", "Password"];

  // Validation function - OPTIMIZED
  const validateUser = (user) => {
    const errors = [];
    if (!user.first_name?.trim()) errors.push("First name required");
    if (!user.last_name?.trim()) errors.push("Last name required");
    if (!user.contact?.trim()) errors.push("Contact required");
    if (!user.email?.trim()) errors.push("Email required");
    if (!user.address?.trim()) errors.push("Address required");
    if (!user.password?.trim()) errors.push("Password required");
    if (errors.length > 0) return errors;

    if (user.first_name.length > 50) errors.push("First name max 50 chars");
    if (user.last_name.length > 50) errors.push("Last name max 50 chars");
    if (!/^\d{10}$/.test(user.contact)) errors.push("Contact must be 10 digits");
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(user.email)) errors.push("Email must be @gmail.com");
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[#@$&]).{8,12}$/.test(user.password)) {
      errors.push("Password: 8-12 chars, uppercase, lowercase, number, special (#@$&)");
    }
    return errors;
  };

  const validateHeaders = (headers) => {
    return REQUIRED_HEADERS.filter(req => 
      !headers.some(h => h.toLowerCase().replace(/\s+/g, '') === req.toLowerCase().replace(/\s+/g, ''))
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Invalid file! Use Excel (.xlsx, .xls) or CSV (.csv)");
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const handleParseFile = async () => {
    if (!file) return setError("Select a file first");
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) return setError("Empty file");

        const headers = Object.keys(jsonData[0]);
        const missingHeaders = validateHeaders(headers);
        if (missingHeaders.length > 0) {
          return setError(`Missing columns: ${missingHeaders.join(", ")}\n\nRequired: ${REQUIRED_HEADERS.join(", ")}`);
        }

        const users = jsonData.map(row => ({
          first_name: row["First Name"] || row["first_name"] || "",
          last_name: row["Last Name"] || row["last_name"] || "",
          contact: String(row["Contact"] || row["contact"] || ""),
          email: row["Email"] || row["email"] || "",
          address: row["Address"] || row["address"] || "",
          password: row["Password"] || row["password"] || ""
        }));

        const valid = [], invalid = [];
        users.forEach((user, i) => {
          const errors = validateUser(user);
          const row = i + 2;
          errors.length > 0 ? invalid.push({ row, data: user, errors }) : valid.push({ row, data: user });
        });

        setValidUsers(valid);
        setInvalidUsers(invalid);
        setStep(2);
      } catch {
        setError("Failed to parse file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmUpload = async () => {
    setUploading(true);
    setError("");

    try {
      const usersToUpload = validUsers.map(item => item.data);
      const res = await fetch("http://localhost:5000/users/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: usersToUpload, userRole })
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error);

      setFinalResults(data);
      setStep(3);
      if (data.summary.success > 0) onSuccess();
    } catch (err) {
      setError(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleGoBackToFix = () => {
    setStep(1);
    setFile(null);
    setValidUsers([]);
    setInvalidUsers([]);
    setError("");
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal bulk-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Bulk Upload Users</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <div className="upload-section">
              <div className="upload-instructions">
                <h4>📋 Instructions:</h4>
                <ul>
                  <li>Upload Excel (.xlsx, .xls) or CSV (.csv) file</li>
                  <li><strong>Required columns:</strong> First Name, Last Name, Contact, Email, Address, Password</li>
                  <li>All validation rules apply</li>
                  <li>You can review data before final upload</li>
                </ul>
                <button onClick={downloadTemplate} className="template-btn">📥 Download Template</button>
              </div>
              <div className="file-upload-area">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} id="file-upload" style={{display:"none"}} />
                <label htmlFor="file-upload" className="file-upload-label">
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">{file ? file.name : "Click to select file"}</div>
                  <div className="upload-hint">Excel or CSV files only</div>
                </label>
              </div>
              {error && <div className="form-error" style={{whiteSpace:'pre-line'}}>{error}</div>}
              <div className="modal-actions">
                <button onClick={onClose} className="cancel-button">Cancel</button>
                <button onClick={handleParseFile} className="submit-button" disabled={!file}>Next: Preview Data</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="preview-section">
              <div className="preview-summary">
                <h4>📊 Data Preview</h4>
                <div className="preview-stats">
                  <div className="stat-item"><span className="stat-label">Total:</span> <span className="stat-value">{validUsers.length + invalidUsers.length}</span></div>
                  <div className="stat-item success"><span className="stat-label">✅ Valid:</span> <span className="stat-value">{validUsers.length}</span></div>
                  <div className="stat-item failed"><span className="stat-label">❌ Invalid:</span> <span className="stat-value">{invalidUsers.length}</span></div>
                </div>
              </div>

              {validUsers.length > 0 && (
                <div className="preview-section-list success-section">
                  <h5>✅ Valid Records ({validUsers.length})</h5>
                  <div className="preview-list">
                    {validUsers.slice(0, 5).map((item, i) => (
                      <div key={i} className="preview-item success-item">
                        <span className="row-number">Row {item.row}</span>
                        <span className="user-info">{item.data.first_name} {item.data.last_name} ({item.data.email})</span>
                      </div>
                    ))}
                    {validUsers.length > 5 && <div className="preview-more">... and {validUsers.length - 5} more valid records</div>}
                  </div>
                </div>
              )}

              {invalidUsers.length > 0 && (
                <div className="preview-section-list failed-section">
                  <h5>❌ Invalid Records ({invalidUsers.length})</h5>
                  <div className="preview-list">
                    {invalidUsers.slice(0, 5).map((item, i) => (
                      <div key={i} className="preview-item failed-item">
                        <div className="failed-header">
                          <span className="row-number">Row {item.row}</span>
                          <span className="user-info">{item.data.first_name || "N/A"} {item.data.last_name || "N/A"}</span>
                        </div>
                        <div className="error-messages">
                          {item.errors.map((error, idx) => <div key={idx} className="error-msg">• {error}</div>)}
                        </div>
                      </div>
                    ))}
                    {invalidUsers.length > 5 && <div className="preview-more">... and {invalidUsers.length - 5} more invalid records</div>}
                  </div>
                </div>
              )}

              {invalidUsers.length > 0 && (
                <div className="preview-warning"><strong>⚠️ Note:</strong> Only valid records will be uploaded. Invalid records will be skipped.</div>
              )}

              <div className="modal-actions">
                <button onClick={handleGoBackToFix} className="cancel-button">← Go Back to Fix</button>
                <button onClick={handleConfirmUpload} className="submit-button" disabled={validUsers.length === 0 || uploading}>
                  {uploading ? "Uploading..." : `Upload ${validUsers.length} Valid Records`}
                </button>
              </div>
            </div>
          )}

          {step === 3 && finalResults && (
            <div className="upload-results">
              <div className="results-summary">
                <h4>✅ Upload Complete!</h4>
                <div className="summary-stats">
                  <div className="stat-item success"><span className="stat-label">Successfully Added:</span> <span className="stat-value">{finalResults.summary.success}</span></div>
                  <div className="stat-item failed"><span className="stat-label">Failed (Duplicates):</span> <span className="stat-value">{finalResults.summary.failed}</span></div>
                </div>
              </div>

              {finalResults.successful.length > 0 && (
                <div className="results-section success-section">
                  <h5>✅ Successfully Added ({finalResults.successful.length})</h5>
                  <div className="results-list">
                    {finalResults.successful.map((item, i) => (
                      <div key={i} className="result-item success-item">
                        <span className="row-number">Row {item.row}</span>
                        <span className="user-info">{item.data.first_name} {item.data.last_name} ({item.data.email})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {finalResults.failed.length > 0 && (
                <div className="results-section failed-section">
                  <h5>❌ Failed - Duplicates ({finalResults.failed.length})</h5>
                  <div className="results-list">
                    {finalResults.failed.map((item, i) => (
                      <div key={i} className="result-item failed-item">
                        <div className="failed-header">
                          <span className="row-number">Row {item.row}</span>
                          <span className="user-info">{item.data.first_name} {item.data.last_name} ({item.data.email})</span>
                        </div>
                        <div className="error-messages">
                          {item.errors.map((error, idx) => <div key={idx} className="error-msg">• {error}</div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button onClick={onClose} className="submit-button">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkUpload;