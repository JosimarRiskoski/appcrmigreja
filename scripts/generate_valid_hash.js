
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cgxrzvbprkbzidcrywvm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNneHJ6dmJwcmtiemlkY3J5d3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzIzODksImV4cCI6MjA3OTAwODM4OX0.3c8D-u70KZqhWSK-LYIVzFrN3Zq3iC_C8i8hEtQvHRM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const email = "temp_fix_login_" + Date.now() + "@trashmail.com";
    const password = "123456";

    console.log(`Attempting to signup user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error("Error signing up:", error);
    } else {
        console.log("Signup successful!");
        console.log("User ID:", data.user?.id);
        console.log("Email:", data.user?.email);
    }
}

main();
