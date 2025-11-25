const db = require("./app/models");
const User = db.user;

async function updateMatricules() {
    try {
        await db.sequelize.sync({ alter: true }); // Ensure models are synced and table is altered

        const users = await User.findAll();
        console.log(`Found ${users.length} users.`);

        let currentMatricule = 5107;

        for (const user of users) {
            user.matricule = currentMatricule.toString();
            await user.save();
            console.log(`Updated user with id ${user.id} with matricule ${currentMatricule}`);
            currentMatricule++;
        }

        console.log("All users updated successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error updating users:", error);
        process.exit(1);
    }
}

updateMatricules();
