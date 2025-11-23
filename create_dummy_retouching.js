const db = require("./app/models");
const Retouching = db.retouching;

const dummyData = [
    {
        refLear: "L002525760NCPAD",
        refTesca: "350641166",
        huGalia: "825645170",
        quantity: 4,
        coiffeNumber: "1234567891234",
        codeProblem: "350",
        status: "Non Réceptionne",
    },
    {
        refLear: "L002525761NCPAD",
        refTesca: "350641167",
        huGalia: "825645171",
        quantity: 2,
        coiffeNumber: "9876543210987",
        codeProblem: "351",
        status: "Rétouche",
    },
    {
        refLear: "L002525762NCPAD",
        refTesca: "350641168",
        huGalia: "825645172",
        quantity: 10,
        coiffeNumber: "1122334455667",
        codeProblem: "352",
        status: "Réceptionné",
    },
    {
        refLear: "L002525763NCPAD",
        refTesca: "350641169",
        huGalia: "825645173",
        quantity: 1,
        coiffeNumber: "9988776655443",
        codeProblem: "353",
        status: "Remplacer",
    },
    {
        refLear: "L002525764NCPAD",
        refTesca: "350641170",
        huGalia: "825645174",
        quantity: 5,
        coiffeNumber: "5544332211009",
        codeProblem: "354",
        status: "Non Réceptionne",
    },
];

const createDummyData = async () => {
    try {
        // Sync database to ensure table exists (alter: true updates schema if needed)
        await db.sequelize.sync({ alter: true });
        console.log("Database synced.");

        await Retouching.bulkCreate(dummyData);
        console.log("Dummy data created successfully!");
    } catch (error) {
        console.error("Error creating dummy data:", error);
    } finally {
        process.exit();
    }
};

createDummyData();
