import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './database';
import bcrypt from 'bcrypt';
import { config } from '../config';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare name: string;
  declare role: 'admin' | 'operator' | 'viewer';
  declare status: 'active' | 'inactive';
  declare lastLoginAt?: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Instance methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'operator', 'viewer'),
      defaultValue: 'viewer',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, config.auth.bcryptRounds);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, config.auth.bcryptRounds);
        }
      },
    },
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['status'] },
      { fields: ['role'] },
    ],
  }
);
