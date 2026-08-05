import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load local .env so `NEXT_PUBLIC_SUPABASE_URL` and anon key are available
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export default supabaseClient;
