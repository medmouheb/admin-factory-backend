const ExcelJS = require('exceljs');
const path = require('path');

async function debugExcel() {
  const filePath = path.join(__dirname, 'materials (3).xlsx');
  console.log(`Reading file: ${filePath}`);

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    
    console.log(`Row Count: ${worksheet.rowCount}`);
    
    // Print first 5 rows to see structure
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 5) {
        console.log(`Row ${rowNumber}:`, JSON.stringify(row.values));
      }
    });

    // Check specific columns expected by controller
    // values[2] = Material, values[3] = Desc, values[4] = Storage, values[5] = Stock
    // Note: row.values is 1-based index in ExcelJS (index 0 is usually empty or specific to implementation, let's see output)
    
  } catch (err) {
    console.error('Error reading file:', err);
  }
}

debugExcel();
