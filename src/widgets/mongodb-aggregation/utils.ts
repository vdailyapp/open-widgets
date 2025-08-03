import type { StageType, StageConfig, ConfigField } from './types';

export const generateStageId = (): string => {
  return `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getStageConfig = (type: StageType): StageConfig => {
  const configs: Record<StageType, StageConfig> = {
    '$match': {
      type: '$match',
      title: 'Match',
      description: 'Filter documents that match specified conditions',
      icon: '🔍',
      defaultConfig: { $match: {} },
      configSchema: [
        {
          name: 'query',
          label: 'Filter Query',
          type: 'object',
          required: true,
          placeholder: '{ "age": { "$gte": 18 } }',
          description: 'MongoDB query to filter documents',
        },
      ],
    },
    '$group': {
      type: '$group',
      title: 'Group',
      description: 'Group documents by specified fields and perform aggregations',
      icon: '📊',
      defaultConfig: { $group: { _id: null } },
      configSchema: [
        {
          name: '_id',
          label: 'Group By',
          type: 'text',
          required: true,
          placeholder: '$category',
          description: 'Field to group by (use null for all documents)',
        },
        {
          name: 'accumulator',
          label: 'Accumulator',
          type: 'object',
          placeholder: '{ "count": { "$sum": 1 } }',
          description: 'Aggregation operations to perform',
        },
      ],
    },
    '$project': {
      type: '$project',
      title: 'Project',
      description: 'Include, exclude, or reshape fields in documents',
      icon: '📋',
      defaultConfig: { $project: {} },
      configSchema: [
        {
          name: 'fields',
          label: 'Field Projection',
          type: 'object',
          required: true,
          placeholder: '{ "name": 1, "age": 1, "_id": 0 }',
          description: 'Specify which fields to include (1) or exclude (0)',
        },
      ],
    },
    '$sort': {
      type: '$sort',
      title: 'Sort',
      description: 'Sort documents by specified fields',
      icon: '🔄',
      defaultConfig: { $sort: {} },
      configSchema: [
        {
          name: 'fields',
          label: 'Sort Fields',
          type: 'object',
          required: true,
          placeholder: '{ "age": -1, "name": 1 }',
          description: 'Fields to sort by (1 for ascending, -1 for descending)',
        },
      ],
    },
    '$limit': {
      type: '$limit',
      title: 'Limit',
      description: 'Limit the number of documents',
      icon: '⚡',
      defaultConfig: { $limit: 10 },
      configSchema: [
        {
          name: 'count',
          label: 'Limit Count',
          type: 'number',
          required: true,
          placeholder: '10',
          description: 'Maximum number of documents to return',
        },
      ],
    },
    '$skip': {
      type: '$skip',
      title: 'Skip',
      description: 'Skip a specified number of documents',
      icon: '⏭️',
      defaultConfig: { $skip: 0 },
      configSchema: [
        {
          name: 'count',
          label: 'Skip Count',
          type: 'number',
          required: true,
          placeholder: '0',
          description: 'Number of documents to skip',
        },
      ],
    },
    '$unwind': {
      type: '$unwind',
      title: 'Unwind',
      description: 'Deconstruct an array field into multiple documents',
      icon: '🧵',
      defaultConfig: { $unwind: '' },
      configSchema: [
        {
          name: 'path',
          label: 'Array Path',
          type: 'text',
          required: true,
          placeholder: '$tags',
          description: 'Path to the array field to unwind',
        },
        {
          name: 'preserveNullAndEmptyArrays',
          label: 'Preserve Null/Empty',
          type: 'boolean',
          description: 'Include documents with null or empty arrays',
        },
      ],
    },
    '$lookup': {
      type: '$lookup',
      title: 'Lookup',
      description: 'Perform left outer join with another collection',
      icon: '🔗',
      defaultConfig: { 
        $lookup: { 
          from: '', 
          localField: '', 
          foreignField: '', 
          as: '' 
        } 
      },
      configSchema: [
        {
          name: 'from',
          label: 'From Collection',
          type: 'text',
          required: true,
          placeholder: 'orders',
          description: 'Collection to join with',
        },
        {
          name: 'localField',
          label: 'Local Field',
          type: 'text',
          required: true,
          placeholder: '_id',
          description: 'Field from current collection',
        },
        {
          name: 'foreignField',
          label: 'Foreign Field',
          type: 'text',
          required: true,
          placeholder: 'userId',
          description: 'Field from foreign collection',
        },
        {
          name: 'as',
          label: 'Output Array Name',
          type: 'text',
          required: true,
          placeholder: 'userOrders',
          description: 'Name for the joined array field',
        },
      ],
    },
    '$addFields': {
      type: '$addFields',
      title: 'Add Fields',
      description: 'Add new fields to documents',
      icon: '➕',
      defaultConfig: { $addFields: {} },
      configSchema: [
        {
          name: 'fields',
          label: 'New Fields',
          type: 'object',
          required: true,
          placeholder: '{ "fullName": { "$concat": ["$firstName", " ", "$lastName"] } }',
          description: 'Fields to add with their expressions',
        },
      ],
    },
    '$replaceRoot': {
      type: '$replaceRoot',
      title: 'Replace Root',
      description: 'Replace the root document with a specified document',
      icon: '🔄',
      defaultConfig: { $replaceRoot: { newRoot: '' } },
      configSchema: [
        {
          name: 'newRoot',
          label: 'New Root',
          type: 'text',
          required: true,
          placeholder: '$address',
          description: 'Expression or field to use as new root',
        },
      ],
    },
    '$count': {
      type: '$count',
      title: 'Count',
      description: 'Count the number of documents',
      icon: '🔢',
      defaultConfig: { $count: 'total' },
      configSchema: [
        {
          name: 'field',
          label: 'Count Field Name',
          type: 'text',
          required: true,
          placeholder: 'total',
          description: 'Name for the count field',
        },
      ],
    },
    '$facet': {
      type: '$facet',
      title: 'Facet',
      description: 'Process multiple aggregation pipelines within a single stage',
      icon: '💎',
      defaultConfig: { $facet: {} },
      configSchema: [
        {
          name: 'pipelines',
          label: 'Sub-pipelines',
          type: 'object',
          required: true,
          placeholder: '{ "categorizedByAge": [{ "$match": { "age": { "$gte": 18 } } }] }',
          description: 'Named sub-pipelines to execute',
        },
      ],
    },
    '$bucket': {
      type: '$bucket',
      title: 'Bucket',
      description: 'Group documents into buckets based on field values',
      icon: '🪣',
      defaultConfig: { 
        $bucket: { 
          groupBy: '', 
          boundaries: [], 
          default: 'Other' 
        } 
      },
      configSchema: [
        {
          name: 'groupBy',
          label: 'Group By Expression',
          type: 'text',
          required: true,
          placeholder: '$age',
          description: 'Expression to group documents by',
        },
        {
          name: 'boundaries',
          label: 'Boundaries',
          type: 'array',
          required: true,
          placeholder: '[0, 18, 30, 50, 100]',
          description: 'Array of boundary values',
        },
        {
          name: 'default',
          label: 'Default Bucket',
          type: 'text',
          placeholder: 'Other',
          description: 'Default bucket for values outside boundaries',
        },
      ],
    },
    '$sample': {
      type: '$sample',
      title: 'Sample',
      description: 'Randomly select a specified number of documents',
      icon: '🎲',
      defaultConfig: { $sample: { size: 10 } },
      configSchema: [
        {
          name: 'size',
          label: 'Sample Size',
          type: 'number',
          required: true,
          placeholder: '10',
          description: 'Number of documents to randomly select',
        },
      ],
    },
  };

  return configs[type];
};

export const getAllStageTypes = (): StageType[] => {
  return [
    '$match',
    '$group',
    '$project',
    '$sort',
    '$limit',
    '$skip',
    '$unwind',
    '$lookup',
    '$addFields',
    '$replaceRoot',
    '$count',
    '$facet',
    '$bucket',
    '$sample',
  ];
};

export const formatJson = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return JSON.stringify(obj);
  }
};

export const parseJsonSafely = (json: string): any => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
};

export const validateStageConfig = (type: StageType, config: any): string[] => {
  const errors: string[] = [];
  const stageConfig = getStageConfig(type);
  
  stageConfig.configSchema.forEach((field) => {
    if (field.required && !config[field.name]) {
      errors.push(`${field.label} is required`);
    }
  });
  
  return errors;
};

export const getSamplePipeline = () => {
  return [
    { $match: { age: { $gte: 18 } } },
    { $group: { _id: '$city', avgSalary: { $avg: '$salary' }, count: { $sum: 1 } } },
    { $sort: { avgSalary: -1 } },
    { $limit: 5 }
  ];
};