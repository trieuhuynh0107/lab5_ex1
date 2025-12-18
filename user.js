const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Assuming you export sequelize instance from here or pass it in

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING
        },
        registrationDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
    return User;
};