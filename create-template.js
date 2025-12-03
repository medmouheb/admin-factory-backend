const ExcelJS = require('exceljs');
const path = require('path');

async function createMaterialTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Materials');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Material', key: 'material', width: 20 },
    { header: 'Material Description', key: 'materialDescription', width: 40 },
    { header: 'Storage Unit', key: 'storageUn', width: 20 },
    { header: 'Available Stock', key: 'availStock', width: 15 }
  ];

  // Add sample data
  worksheet.addRow({
    id: '(auto)',
    material: 'MAT001',
    materialDescription: 'Sample Material 1',
    storageUn: 'SU001',
    availStock: 100.000
  });

  worksheet.addRow({
    id: '(auto)',
    material: 'MAT002',
    materialDescription: 'Sample Material 2',
    storageUn: 'SU002',
    availStock: 250.500
  });

  worksheet.addRow({
    id: '(auto)',
    material: 'MAT003',
    materialDescription: 'Sample Material 3',
    storageUn: '',
    availStock: 75.250
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4CAF50' }
  };

  // Add notes
  worksheet.addRow([]);
  worksheet.addRow(['NOTES:']);
  worksheet.addRow(['- ID column will be auto-generated, you can leave it as (auto)']);
  worksheet.addRow(['- Material and Material Description are required']);
  worksheet.addRow(['- Storage Unit is optional']);
  worksheet.addRow(['- Available Stock is required and must be a number']);
  worksheet.addRow(['- Delete the sample rows and add your own data']);

  // Style notes
  const notesStartRow = 5;
  for (let i = notesStartRow; i <= notesStartRow + 5; i++) {
    worksheet.getRow(i).font = { italic: true, color: { argb: 'FF666666' } };
  }

  // Save file
  const filePath = path.join(__dirname, 'material_import_template.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`Template created successfully at: ${filePath}`);
}

createMaterialTemplate().catch(console.error);
