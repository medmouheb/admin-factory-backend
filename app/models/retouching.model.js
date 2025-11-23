module.exports = (sequelize, Sequelize) => {
    const Retouching = sequelize.define("retouchings", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        refLear: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        refTesca: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        huGalia: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        coiffeNumber: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        codeProblem: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        status: {
            type: Sequelize.ENUM("Rétouche", "Réceptionné", "Non Réceptionne", "Remplacer"),
            defaultValue: "Non Réceptionne",
        },
    });

    return Retouching;
};
