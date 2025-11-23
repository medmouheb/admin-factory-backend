module.exports = (sequelize, Sequelize) => {
    const Packet = sequelize.define("packets", {
        packetId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        huGalia: {
            type: Sequelize.STRING,
            allowNull: false
        },
        location: {
            type: Sequelize.ENUM('354D', '353A', 'Transit', 'Stock 354D'),
            defaultValue: '354D'
        },
        status: {
            type: Sequelize.ENUM(
                'Ready for Transfer',
                'In Transit',
                'Received',
                'In Stock',
                'Returning',
                'Returned'
            ),
            defaultValue: 'Ready for Transfer'
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        date: {
            type: Sequelize.DATEONLY, // or Sequelize.DATE for timestamp
            defaultValue: Sequelize.NOW
        }
    });

    return Packet;
};