module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // userId and prodId will be added automatically by associations, 
        // but defining them explicitly is often safer.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        prodId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    });
    return Cart;
};