module.exports = (sequelize, Sequelize) => {
  const Ticket = sequelize.define("tickets", {
    ticketCode: {
      type: Sequelize.STRING,
      allowNull: true,
      // Supprime toute mention de 'unique' ou 'index' ici 
      // si c'est déjà géré par l'association belongsTo
    },
    barcode: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true, // Cet index est nécessaire et compte pour 1
    },
  });

  return Ticket;
};