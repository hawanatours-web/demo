
// OFFLINE MODE: Mock Client
// This file simulates the Supabase client so imports don't break, 
// but it doesn't actually connect to any database.

export const supabase = {
  from: (table: string) => {
    return {
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      order: () => ({ range: () => Promise.resolve({ data: [], error: null, count: 0 }) }),
    };
  }
};
