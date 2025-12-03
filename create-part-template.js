const ExcelJS = require('exceljs');
const path = require('path');

async function createPartTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Parts');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Lear PN', key: 'learPN', width: 20 },
    { header: 'Tesca PN', key: 'tescaPN', width: 20 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Qty Per Box', key: 'qtyPerBox', width: 15 }
  ];

  // Add sample data
  worksheet.addRow({
    id: '(auto)',
    learPN: 'LPN001',
    tescaPN: 'TPN001',
    desc: 'Sample Part 1',
    qtyPerBox: 50
  });

  worksheet.addRow({
    id: '(auto)',
    learPN: 'LPN002',
    tescaPN: 'TPN002',
    desc: 'Sample Part 2',
    qtyPerBox: 100
  });

  worksheet.addRow({
    id: '(auto)',
    learPN: 'LPN003',
    tescaPN: 'TPN003',
    desc: 'Sample Part 3',
    qtyPerBox: 75
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2196F3' }
  };

  // Add notes
  worksheet.addRow([]);
  worksheet.addRow(['NOTES:']);
  worksheet.addRow(['- ID column will be auto-generated, you can leave it as (auto)']);
  worksheet.addRow(['- Lear PN, Tesca PN, and Description are required']);
  worksheet.addRow(['- Qty Per Box is required and must be an integer']);
  worksheet.addRow(['- Delete the sample rows and add your own data']);

  // Style notes
  const notesStartRow = 5;
  for (let i = notesStartRow; i <= notesStartRow + 4; i++) {
    worksheet.getRow(i).font = { italic: true, color: { argb: 'FF666666' } };
  }

  // Save file
  const filePath = path.join(__dirname, 'part_import_template.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`Part template created successfully at: ${filePath}`);
}

createPartTemplate().catch(console.error);
