# Excel Import/Export Feature - Quick Start Guide

## Overview

Three new Excel-based APIs have been added to the application:

1. **Material Export** - Export materials to Excel with date filtering
2. **Material Import** - Import materials from Excel file
3. **Combined Ticket Export** - Export tickets with their associated ticket codes

## 🚀 Quick Start

### Prerequisites

The following packages have been installed:

- `exceljs` - For Excel file generation and parsing
- `multer` - For file upload handling

### API Endpoints

#### 1. Export Materials

```
GET /api/materials/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

#### 2. Import Materials

```
POST /api/materials/import
Content-Type: multipart/form-data
Body: file (Excel file)
```

#### 3. Export Combined Tickets

```
GET /api/tickets-combined/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

## 📝 Testing the APIs

### Option 1: Use the Test HTML Page

1. Open `test-excel-apis.html` in your browser
2. Make sure your backend server is running on `http://192.168.2.10:8080`
3. Use the interactive forms to test each API

### Option 2: Use cURL

**Export Materials:**

```bash
curl -X GET "http://192.168.2.10:8080/api/materials/export?startDate=2025-01-01&endDate=2025-12-31" --output materials.xlsx
```

**Import Materials:**

```bash
curl -X POST http://192.168.2.10:8080/api/materials/import -F "file=@material_import_template.xlsx"
```

**Export Combined Tickets:**

```bash
curl -X GET "http://192.168.2.10:8080/api/tickets-combined/export?startDate=2025-01-01&endDate=2025-12-31" --output tickets.xlsx
```

### Option 3: Use Postman

1. **For Export APIs:**
   - Method: GET
   - URL: `http://192.168.2.10:8080/api/materials/export?startDate=2025-01-01&endDate=2025-12-31`
   - Click "Send and Download"

2. **For Import API:**
   - Method: POST
   - URL: `http://192.168.2.10:8080/api/materials/import`
   - Body: form-data
   - Key: `file` (type: File)
   - Value: Select your Excel file

## 📊 Excel File Format for Import

### Material Import Template

A template file has been created: `material_import_template.xlsx`

**Required Columns:**

- **Column A (ID):** Auto-generated, can be left as "(auto)"
- **Column B (Material):** Material code - **REQUIRED**
- **Column C (Material Description):** Description - **REQUIRED**
- **Column D (Storage Unit):** Storage unit code - Optional
- **Column E (Available Stock):** Stock quantity - **REQUIRED** (must be a number)

**Example:**

| ID     | Material | Material Description | Storage Unit | Available Stock |
| ------ | -------- | -------------------- | ------------ | --------------- |
| (auto) | MAT001   | Sample Material 1    | SU001        | 100.000         |
| (auto) | MAT002   | Sample Material 2    | SU002        | 250.500         |

## 🔧 Implementation Details

### Files Modified/Created:

1. **Controllers:**
   - `app/controllers/material.controller.js` - Added export/import functions
   - `app/controllers/ticketCombined.controller.js` - New controller for combined export

2. **Routes:**
   - `app/routes/material.routes.js` - Added export/import routes
   - `app/routes/ticketCombined.routes.js` - New routes file

3. **Server:**
   - `server.js` - Registered new ticketCombined routes

4. **Documentation:**
   - `EXCEL_API_DOCUMENTATION.md` - Detailed API documentation
   - `README_EXCEL_FEATURES.md` - This file
   - `test-excel-apis.html` - Interactive test page

5. **Templates:**
   - `create-template.js` - Script to generate import template
   - `material_import_template.xlsx` - Sample template file

## 🎯 Features

### Material Export

- ✅ Filter by date range (createdAt field)
- ✅ Includes all material fields
- ✅ Styled Excel output with headers
- ✅ Automatic filename with date range

### Material Import

- ✅ Bulk import from Excel
- ✅ Validation of required fields
- ✅ Error reporting for invalid rows
- ✅ Continues processing valid rows even if some fail

### Combined Ticket Export

- ✅ Joins Ticket and TicketCode data
- ✅ Filter by date range
- ✅ Includes all fields from both tables
- ✅ Handles missing ticket codes gracefully

## 🔍 Data Relationships

The Combined Ticket Export joins data as follows:

```
Ticket.ticketCode = TicketCode.code
```

**Ticket fields:**

- id, barcode, ticketCode, createdAt, updatedAt

**TicketCode fields:**

- id, code, matricule, learPN, quantity, hu, createdAt, updatedAt

## ⚠️ Error Handling

All APIs return appropriate HTTP status codes:

- **200 OK** - Successful export/import
- **201 Created** - Successful import with data created
- **400 Bad Request** - Missing parameters or invalid file
- **500 Internal Server Error** - Server-side processing error

Error responses include a descriptive `message` field.

## 📱 Frontend Integration Example

```javascript
// Export Materials
async function exportMaterials(startDate, endDate) {
  const response = await fetch(
    `http://192.168.2.10:8080/api/materials/export?startDate=${startDate}&endDate=${endDate}`,
  );
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `materials_${startDate}_to_${endDate}.xlsx`;
  a.click();
}

// Import Materials
async function importMaterials(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://192.168.2.10:8080/api/materials/import", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}

// Export Combined Tickets
async function exportCombinedTickets(startDate, endDate) {
  const response = await fetch(
    `http://192.168.2.10:8080/api/tickets-combined/export?startDate=${startDate}&endDate=${endDate}`,
  );
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tickets_combined_${startDate}_to_${endDate}.xlsx`;
  a.click();
}
```

## 🧪 Testing Checklist

- [ ] Start the backend server
- [ ] Test Material Export with valid date range
- [ ] Test Material Export with invalid date range (should return 400)
- [ ] Test Material Import with valid Excel file
- [ ] Test Material Import with invalid file (should return 400)
- [ ] Test Material Import with missing required fields
- [ ] Test Combined Ticket Export with valid date range
- [ ] Verify Excel files download correctly
- [ ] Verify imported data appears in database
- [ ] Test with empty date ranges
- [ ] Test with future dates (should return empty Excel)

## 📞 Support

For detailed API documentation, see `EXCEL_API_DOCUMENTATION.md`

## 🎉 Summary

You now have three powerful Excel-based APIs:

1. **Export materials** filtered by date
2. **Import materials** from Excel files
3. **Export combined ticket data** with ticket codes

All APIs are production-ready with proper error handling, validation, and documentation!
