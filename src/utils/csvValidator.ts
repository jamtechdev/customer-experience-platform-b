export interface CSVColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
}

export interface CSVSchema {
  name: string;
  columns: CSVColumn[];
  dataType: 'social_media' | 'app_review' | 'nps_survey' | 'complaint' | 'unknown';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  detectedType?: 'social_media' | 'app_review' | 'nps_survey' | 'complaint' | 'unknown';
  missingColumns: string[];
  extraColumns: string[];
}

// Common CSV schemas
export const CSV_SCHEMAS: Record<string, CSVSchema> = {
  social_media: {
    name: 'Social Media Feedback',
    dataType: 'social_media',
    columns: [
      { name: 'content', type: 'string', required: true },
      { name: 'source', type: 'string', required: true },
      { name: 'author', type: 'string', required: false },
      { name: 'date', type: 'date', required: true },
      { name: 'rating', type: 'number', required: false },
    ],
  },
  app_review: {
    name: 'App Market Review',
    dataType: 'app_review',
    columns: [
      { name: 'content', type: 'string', required: true },
      { name: 'source', type: 'string', required: true },
      { name: 'author', type: 'string', required: false },
      { name: 'date', type: 'date', required: true },
      { name: 'rating', type: 'number', required: true },
    ],
  },
  nps_survey: {
    name: 'NPS Survey',
    dataType: 'nps_survey',
    columns: [
      { name: 'score', type: 'number', required: true },
      { name: 'comment', type: 'string', required: false },
      { name: 'customerId', type: 'string', required: false },
      { name: 'date', type: 'date', required: true },
    ],
  },
  complaint: {
    name: 'Customer Complaint',
    dataType: 'complaint',
    columns: [
      { name: 'content', type: 'string', required: true },
      { name: 'source', type: 'string', required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'category', type: 'string', required: false },
    ],
  },
};

/**
 * Detect CSV data type based on column names
 */
export function detectCSVType(headers: string[]): 'social_media' | 'app_review' | 'nps_survey' | 'complaint' | 'unknown' {
  const headerLower = headers.map(h => h.toLowerCase());
  
  // Check for NPS survey indicators
  if (headerLower.includes('score') && (headerLower.includes('nps') || headerLower.includes('promoter') || headerLower.includes('detractor'))) {
    return 'nps_survey';
  }
  if (headerLower.includes('score') && headerLower.some(h => h.includes('rating') || h.includes('review'))) {
    // Could be app review or NPS
    if (headerLower.some(h => h.includes('comment') || h.includes('feedback'))) {
      return 'nps_survey';
    }
  }
  
  // Check for app review indicators
  if (headerLower.includes('rating') && (headerLower.includes('review') || headerLower.includes('app'))) {
    return 'app_review';
  }
  
  // Check for complaint indicators
  if (headerLower.includes('complaint') || headerLower.includes('issue') || headerLower.includes('problem')) {
    return 'complaint';
  }
  
  // Check for social media indicators
  if (headerLower.includes('content') || headerLower.includes('text') || headerLower.includes('message')) {
    if (headerLower.includes('source') || headerLower.includes('platform') || headerLower.includes('channel')) {
      return 'social_media';
    }
  }
  
  // Default: try to match by common patterns
  if (headerLower.includes('content') && headerLower.includes('date')) {
    return 'social_media';
  }
  
  return 'unknown';
}

/**
 * Validate CSV headers against a schema
 */
export function validateCSVHeaders(
  headers: string[],
  schema: CSVSchema
): ValidationResult {
  const errors: string[] = [];
  const missingColumns: string[] = [];
  const extraColumns: string[] = [];
  
  const headerLower = headers.map(h => h.toLowerCase());
  const schemaColumnsLower = schema.columns.map(c => c.name.toLowerCase());
  
  // Check for required columns
  for (const column of schema.columns) {
    if (column.required) {
      const found = headerLower.includes(column.name.toLowerCase());
      if (!found) {
        missingColumns.push(column.name);
        errors.push(`Required column '${column.name}' is missing`);
      }
    }
  }
  
  // Check for extra columns (optional - just for info)
  for (const header of headers) {
    if (!schemaColumnsLower.includes(header.toLowerCase())) {
      extraColumns.push(header);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    detectedType: schema.dataType,
    missingColumns,
    extraColumns,
  };
}

/**
 * Validate CSV row data
 */
export function validateCSVRow(
  row: Record<string, any>,
  schema: CSVSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const column of schema.columns) {
    const value = row[column.name];
    const hasValue = value !== undefined && value !== null && value !== '';
    
    // Check required fields
    if (column.required && !hasValue) {
      errors.push(`Required field '${column.name}' is missing or empty`);
      continue;
    }
    
    // Skip validation if value is empty and not required
    if (!hasValue) {
      continue;
    }
    
    // Type validation
    switch (column.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`Field '${column.name}' must be a number, got: ${value}`);
        }
        break;
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`Field '${column.name}' must be a valid date, got: ${value}`);
        }
        break;
      case 'boolean':
        const boolValue = String(value).toLowerCase();
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(boolValue)) {
          errors.push(`Field '${column.name}' must be a boolean, got: ${value}`);
        }
        break;
      case 'string':
        // String is always valid
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Auto-detect and validate CSV
 */
export function validateCSV(
  headers: string[],
  sampleRows: Record<string, any>[] = []
): ValidationResult {
  const detectedType = detectCSVType(headers);
  
  if (detectedType === 'unknown') {
    return {
      valid: false,
      errors: ['Could not detect CSV data type. Please specify the type manually.'],
      detectedType: 'unknown',
      missingColumns: [],
      extraColumns: [],
    };
  }
  
  const schema = CSV_SCHEMAS[detectedType];
  if (!schema) {
    return {
      valid: false,
      errors: [`No schema found for detected type: ${detectedType}`],
      detectedType,
      missingColumns: [],
      extraColumns: [],
    };
  }
  
  return validateCSVHeaders(headers, schema);
}

/**
 * Get suggested column mappings
 */
export function suggestColumnMappings(
  csvHeaders: string[],
  targetType: 'social_media' | 'app_review' | 'nps_survey' | 'complaint'
): Record<string, string> {
  const schema = CSV_SCHEMAS[targetType];
  if (!schema) {
    return {};
  }
  
  const mappings: Record<string, string> = {};
  const headerLower = csvHeaders.map(h => h.toLowerCase());
  
  for (const column of schema.columns) {
    const columnLower = column.name.toLowerCase();
    
    // Try exact match
    const exactMatch = csvHeaders.find(h => h.toLowerCase() === columnLower);
    if (exactMatch) {
      mappings[exactMatch] = column.name;
      continue;
    }
    
    // Try partial match
    const partialMatch = csvHeaders.find(h => {
      const hLower = h.toLowerCase();
      return hLower.includes(columnLower) || columnLower.includes(hLower);
    });
    if (partialMatch) {
      mappings[partialMatch] = column.name;
      continue;
    }
    
    // Try common synonyms
    const synonyms: Record<string, string[]> = {
      content: ['text', 'message', 'comment', 'feedback', 'review', 'description'],
      source: ['platform', 'channel', 'origin', 'source_type'],
      author: ['user', 'customer', 'reviewer', 'name', 'username'],
      date: ['timestamp', 'created_at', 'created', 'time', 'datetime'],
      rating: ['score', 'stars', 'star_rating', 'rate'],
      score: ['nps_score', 'rating', 'value'],
      comment: ['feedback', 'text', 'content', 'message'],
      customerId: ['customer_id', 'user_id', 'client_id', 'id'],
    };
    
    const columnSynonyms = synonyms[column.name] || [];
    const synonymMatch = csvHeaders.find(h => {
      const hLower = h.toLowerCase();
      return columnSynonyms.some(syn => hLower.includes(syn) || syn.includes(hLower));
    });
    
    if (synonymMatch) {
      mappings[synonymMatch] = column.name;
    }
  }
  
  return mappings;
}
