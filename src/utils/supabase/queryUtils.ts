
import { supabase } from "@/lib/supabase";

/**
 * Utility functions for handling common Supabase queries with proper typings and error handling
 */

/**
 * Fetches data from a table with proper error handling
 */
export async function fetchFromTable(tableName: string, columns: string, filters?: Record<string, any>) {
  try {
    let query = supabase
      .from(tableName)
      .select(columns);
    
    // Apply any filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in fetchFromTable for ${tableName}:`, error);
    return { data: null, error };
  }
}

/**
 * Fetches a single record from a table
 */
export async function fetchSingleRecord(tableName: string, columns: string, filters: Record<string, any>) {
  try {
    let query = supabase
      .from(tableName)
      .select(columns);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();
    
    if (error) {
      console.error(`Error fetching single record from ${tableName}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in fetchSingleRecord for ${tableName}:`, error);
    return { data: null, error };
  }
}

/**
 * Inserts data into a table
 */
export async function insertIntoTable(tableName: string, records: any | any[]) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert(records);
    
    if (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in insertIntoTable for ${tableName}:`, error);
    return { data: null, error };
  }
}

/**
 * Updates data in a table
 */
export async function updateTable(tableName: string, updates: any, filters: Record<string, any>) {
  try {
    let query = supabase
      .from(tableName)
      .update(updates);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    
    if (error) {
      console.error(`Error updating ${tableName}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in updateTable for ${tableName}:`, error);
    return { data: null, error };
  }
}
