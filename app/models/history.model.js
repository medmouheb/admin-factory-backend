module.exports = (sequelize, Sequelize) => {
    const History = sequelize.define("history", {
        action: {
            type: Sequelize.STRING
        },
        entity: {
            type: Sequelize.STRING
        },
        entityId: {
            type: Sequelize.STRING // Using STRING to support both UUIDs and Integer IDs if needed, or just Packet IDs which might be strings
        },
        userId: {
            type: Sequelize.INTEGER
        },
        details: {
            type: Sequelize.TEXT // JSON string of details
        },
        timestamp: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    });

    return History;
};
