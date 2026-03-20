import { supabase } from "./supabase";

const TABLE = "user_data";

export async function syncSave(userId: string, data: object) {
  console.log("Saving data to cloud for user:", userId);
  try {
    const { error } = await supabase.from(TABLE).upsert(
      { user_id: userId, data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error("syncSave error returned from Supabase:", error);
      throw error;
    }
    console.log("Cloud save successful.");
  } catch (e) {
    console.error("syncSave catch block:", e);
  }
}

export async function syncLoad(userId: string): Promise<object | null> {
  console.log("Loading data from cloud for user:", userId);
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("data")
      .eq("user_id", userId)
      .maybeSingle(); // maybeSingle avoids error if no row exists
    
    if (error) {
      console.error("syncLoad error from Supabase:", error);
      return null;
    }
    
    if (!data) {
      console.log("No remote data row found for user.");
      return null;
    }
    
    console.log("Remote data fetched successfully.");
    return data.data;
  } catch (e) {
    console.error("syncLoad catch block:", e);
    return null;
  }
}
