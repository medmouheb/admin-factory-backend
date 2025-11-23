module.exports = (sequelize, Sequelize) => {
    const QualityInspection = sequelize.define("quality_inspections", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        huGalia: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        uniquePieceCode: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        problemCode: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        operator: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        ticketBarcode: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        ticketCode: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        status: {
            type: Sequelize.ENUM("Passed", "Failed", "Pending"),
            defaultValue: "Pending",
        },
    });

    return QualityInspection;
};
