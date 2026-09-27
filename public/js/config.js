// AR Rakshak Safety System - Central Configuration
const SUPABASE_URL = "https://fkvblimipuapifmsurlf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdmJsaW1pcHVhcGlmbXN1cmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzAxNTIsImV4cCI6MjEwNjAwNjE1Mn0.hOEDxd2ldD48tigB33cfJobp1j5ajtoblYbah_lGcMc";

let supabase = null;
try {
  if (typeof window !== "undefined" && window.supabase) {
    supabase = window.supabase;
  } else {
    const { createClient } = require("@supabase/supabase-js");
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    if (typeof window !== "undefined") window.supabase = supabase;
  }
} catch (e) {
  console.warn("Supabase client init deferred:", e.message);
}

const APP_NAME = "AR Rakshak Safety System";
const APP_SHORT = "AR Rakshak";
const APP_VERSION = "2.0.0";

const SUPPORTED_LANGUAGES = [
  { code: "English", label: "English", short: "EN" },
  { code: "Hindi", label: "हिन्दी", short: "HI" },
  { code: "Bengali", label: "বাংলা", short: "BN" },
  { code: "Urdu", label: "اردو", short: "UR" },
  { code: "Santali", label: "ᱥᱟᱱᱛᱟᱞ", short: "SAT" },
  { code: "Khortha", label: "खोरठा", short: "KHT" },
  { code: "Sadan", label: "सदान / सदरी", short: "SAD" },
  { code: "Magahi", label: "मगही", short: "MAG" },
  { code: "Ho", label: "ᱦᱚ", short: "HO" },
  { code: "Kurukh", label: "कुड़ुख", short: "KUU" },
  { code: "Mundari", label: "ᱢᱩᱱᱰᱟᱨᱤ", short: "MUN" }
];

const VERIFIED_EMERGENCY_PROCEDURES = {
  gas_leak: { title: "Gas Leak Emergency", steps: ["Move immediately to the designated safe assembly area.", "Do NOT use switches, phones, or any ignition source in the gas zone.", "Alert co-workers and supervisor using the site alarm system.", "Do not re-enter until cleared by authorized personnel with gas detectors."] },
  fire: { title: "Fire Emergency", steps: ["Raise the alarm immediately using the nearest fire alarm call point.", "Use the nearest safe exit route — do not use elevators.", "If trained and safe, use a fire extinguisher on small fires only.", "Proceed to the assembly point and await headcount by supervisor."] },
  electrical: { title: "Electrical Hazard", steps: ["Do NOT touch the affected person or equipment if still energized.", "Disconnect power at the main switch or circuit breaker if safe to do so.", "Call for emergency medical assistance if anyone is injured.", "Cordon off the area and report to maintenance immediately."] },
  fall: { title: "Fall / Injury Emergency", steps: ["Do not move the injured person unless they are in immediate danger.", "Call for medical assistance immediately.", "Provide first aid only if trained and qualified.", "Preserve the scene for investigation."] },
  evacuation: { title: "Emergency Evacuation", steps: ["Follow the nearest marked evacuation route.", "Do not stop to collect personal belongings.", "Proceed to the designated assembly point.", "Report to your supervisor for headcount."] }
};
