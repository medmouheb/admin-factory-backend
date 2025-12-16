const db = require("./app/models");
const ExcelJS = require("exceljs");
const fs = require("fs");

async function importCsv() {
  const modelName = process.argv[2];
  const filePath = process.argv[3];

  if (!modelName || !filePath) {
    console.error("Usage: node import_csv.js <modelName> <csvFilePath>");
    console.error("Example: node import_csv.js part ./parts.csv");
    console.log("Available models:", Object.keys(db).filter(k => k !== "sequelize" && k !== "Sequelize" && k !== "ROLES" && k !== "AccessTos"));
    process.exit(1);
  }

  // Model name might be case sensitive in db object, usually lowercase (e.g. 'part', 'user')
  const model = db[modelName];
  if (!model) {
    console.error(`Model '${modelName}' not found in db.`);
    console.log("Available models:", Object.keys(db).filter(k => k !== "sequelize" && k !== "Sequelize" && k !== "ROLES" && k !== "AccessTos"));
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    console.log(`Connecting to database... Host: ${db.sequelize.config.host}, Port: ${db.sequelize.config.port}`);
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const workbook = new ExcelJS.Workbook();
    // factory typically uses semicolon separated CSVs
    const options = {
        parserOptions: {
            delimiter: ';',
            quote: '"'
        }
    };
    await workbook.csv.readFile(filePath, options);
    const worksheet = workbook.getWorksheet(1);
    
    // Assume first row is headers
    const headers = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
        let header = cell.value;
        // Simple cleanup if exceljs keeps quotes for some reason (rare but possible)
        if (typeof header === 'string') {
            header = header.replace(/^"|"$/g, '');
        }
        headers[colNumber] = header;
    });

    const items = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const item = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
            item[header] = cell.value;
        }
      });
      // prevent empty objects
      if(Object.keys(item).length > 0) {
        // Exclude ID to avoid conflicts with existing data, allow auto-increment
        delete item.id;
        items.push(item);
      }
    });

    if (items.length > 0) {
        console.log(`Found ${items.length} items. Inserting into ${modelName}...`);
        try {
            await model.bulkCreate(items, { validate: false, ignoreDuplicates: true });
            console.log("Import success!");
        } catch (err) {
            console.error("Bulk create error:", err.message);
            // console.error(err); // print full error if needed
        }
    } else {
        console.log("No data found in CSV to import.");
    }

    process.exit(0);

  } catch (error) {
    console.error("Error importing CSV:", error);
    process.exit(1);
  }
}

importCsv();
