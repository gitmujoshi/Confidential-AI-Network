import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './database';

interface AgentAttributes {
  id: string;
  name: string;
  type: 'orchestrator' | 'triage' | 'forensic' | 'remediation' | 'custom';
  status: 'active' | 'inactive' | 'suspended';
  workloadId: string;
  spiffeId?: string;
  configuration: Record<string, any>;
  capabilities: string[];
  createdBy: string;
  lastActiveAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AgentCreationAttributes extends Optional<AgentAttributes, 'id' | 'spiffeId' | 'lastActiveAt' | 'createdAt' | 'updatedAt'> {}

export class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  declare id: string;
  declare name: string;
  declare type: 'orchestrator' | 'triage' | 'forensic' | 'remediation' | 'custom';
  declare status: 'active' | 'inactive' | 'suspended';
  declare workloadId: string;
  declare spiffeId?: string;
  declare configuration: Record<string, any>;
  declare capabilities: string[];
  declare createdBy: string;
  declare lastActiveAt?: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Agent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('orchestrator', 'triage', 'forensic', 'remediation', 'custom'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
    workloadId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    spiffeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    configuration: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    capabilities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'agents',
    timestamps: true,
    indexes: [
      { fields: ['workloadId'] },
      { fields: ['spiffeId'] },
      { fields: ['status'] },
      { fields: ['type'] },
    ],
  }
);
