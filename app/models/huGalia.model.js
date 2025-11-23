module.exports = (sequelize, Sequelize) => {
    const HuGalia = sequelize.define("hu_galias", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ticketCode: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        huGalia: {
            type: Sequelize.STRING, // Renamed from 'code'
            allowNull: false,
            unique: true,
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        status: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        location: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        createdBy: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        modifiedBy: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        date: {
            type: Sequelize.DATEONLY, // Or DATE, user example is '2023-10-27'
            defaultValue: Sequelize.NOW,
        },
    });

    return HuGalia;
};
