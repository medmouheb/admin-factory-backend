# Excel Export and Import APIs

This document describes the new Excel export and import APIs that have been added to the application.

## 1. Material APIs

### Export Materials to Excel
**Endpoint:** `GET /api/materials/export`

**Query Parameters:**
- `startDate` (required): Start date in format YYYY-MM-DD (e.g., "2025-01-01")
- `endDate` (required): End date in format YYYY-MM-DD (e.g., "2025-12-31")

**Description:** Exports all materials created between the start and end dates to an Excel file.

**Example:**
```
GET http://localhost:8080/api/materials/export?startDate=2025-01-01&endDate=2025-12-31
```

**Response:** Downloads an Excel file named `materials_YYYY-MM-DD_to_YYYY-MM-DD.xlsx`

**Excel Columns:**
- ID
- Material
- Material Description
- Storage Unit
- Available Stock
- Created At
- Updated At

---

### Import Materials from Excel
**Endpoint:** `POST /api/materials/import`

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: Excel file (.xlsx)

**Description:** Imports materials from an uploaded Excel file. The Excel file should have the following columns (starting from column B):
- Column A: ID (optional, will be auto-generated)
- Column B: Material (required)
- Column C: Material Description (required)
- Column D: Storage Unit (optional)
- Column E: Available Stock (required)

**Example using cURL:**
```bash
curl -X POST http://localhost:8080/api/materials/import \
  -F "file=@materials.xlsx"
```

**Example using Postman:**
1. Select POST method
2. Enter URL: `http://localhost:8080/api/materials/import`
3. Go to Body tab
4. Select form-data
5. Add key "file" with type "File"
6. Choose your Excel file

**Response:**
```json
{
  "message": "Successfully imported 10 materials",
  "imported": 10,
  "errors": [] // Array of error messages if any rows failed
}
```

---

## 2. Combined Ticket and TicketCode Export API

### Export Combined Ticket and TicketCode Data
**Endpoint:** `GET /api/tickets-combined/export`

**Query Parameters:**
- `startDate` (required): Start date in format YYYY-MM-DD (e.g., "2025-01-01")
- `endDate` (required): End date in format YYYY-MM-DD (e.g., "2025-12-31")

**Description:** Exports all tickets created between the start and end dates, combined with their corresponding ticket code data. The join is performed where `ticket.ticketCode = ticketCode.code`.

**Example:**
```
GET http://localhost:8080/api/tickets-combined/export?startDate=2025-01-01&endDate=2025-12-31
```

**Response:** Downloads an Excel file named `tickets_combined_YYYY-MM-DD_to_YYYY-MM-DD.xlsx`

**Excel Columns:**
- Ticket ID
- Barcode
- Ticket Code
- Ticket Created At
- Ticket Updated At
- Code ID
- Matricule
- Lear PN
- Quantity
- HU
- Code Created At
- Code Updated At

---

## Excel File Format for Import

When preparing an Excel file for import, follow this structure:

### Materials Import Template

| ID | Material | Material Description | Storage Unit | Available Stock |
|----|----------|---------------------|--------------|-----------------|
| (auto) | MAT001 | Sample Material 1 | SU001 | 100.000 |
| (auto) | MAT002 | Sample Material 2 | SU002 | 250.500 |

**Notes:**
- Row 1 should contain headers
- ID column (A) is optional and will be auto-generated
- Material (B) and Material Description (C) are required
- Storage Unit (D) is optional
- Available Stock (E) is required and should be a number

---

## Testing the APIs

### Using cURL

**Export Materials:**
```bash
curl -X GET "http://localhost:8080/api/materials/export?startDate=2025-01-01&endDate=2025-12-31" \
  --output materials.xlsx
```

**Import Materials:**
```bash
curl -X POST http://localhost:8080/api/materials/import \
  -F "file=@materials.xlsx"
```

**Export Combined Tickets:**
```bash
curl -X GET "http://localhost:8080/api/tickets-combined/export?startDate=2025-01-01&endDate=2025-12-31" \
  --output tickets_combined.xlsx
```

### Using JavaScript/Fetch

**Export Materials:**
```javascript
const startDate = '2025-01-01';
const endDate = '2025-12-31';

fetch(`http://localhost:8080/api/materials/export?startDate=${startDate}&endDate=${endDate}`)
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materials_${startDate}_to_${endDate}.xlsx`;
    a.click();
  });
```

**Import Materials:**
```javascript
const fileInput = document.getElementById('fileInput');
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8080/api/materials/import', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => console.log(data));
```

**Export Combined Tickets:**
```javascript
const startDate = '2025-01-01';
const endDate = '2025-12-31';

fetch(`http://localhost:8080/api/tickets-combined/export?startDate=${startDate}&endDate=${endDate}`)
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets_combined_${startDate}_to_${endDate}.xlsx`;
    a.click();
  });
```

---

## Dependencies

The following npm packages were installed to support these features:
- `exceljs`: For creating and reading Excel files
- `multer`: For handling file uploads

---

## Error Handling

All APIs include error handling and will return appropriate HTTP status codes:

- **400 Bad Request**: Missing required parameters or invalid file
- **500 Internal Server Error**: Server-side errors during processing

Error responses include a `message` field describing the error.
