
import { useState } from "react";
import { router } from "@inertiajs/react";

import { supabase } from "@/lib/supabase";




export default function AdminLoginPage() {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(`Login failed: ${signInError.message}`);
        return;
      }

      const user = data?.user;
      if (!user) {
        setError("Authentication succeeded but no user was returned. Please check your Supabase auth settings.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Supabase login: profile lookup failed", profileError, profile, user.id);
        await supabase.auth.signOut();
        setError(
          "Login succeeded but the user profile was not found. Please verify the Supabase users table contains this user ID and a valid role."
        );
        return;
      }

      const role = profile.role;
      const allowedRoles = ["admin", "super_admin", "frontoffice", "reservation", "housekeeper"];

      if (!allowedRoles.includes(role)) {
        console.error("Supabase login: unauthorized role", role);
        await supabase.auth.signOut();
        setError(
          `Your account role is '${role ?? "unknown"}', which is not allowed. Ask the system admin to set your role to one of: ${allowedRoles.join(", ")}.`
        );
        return;
      }

      if (role === "reservation") {
        router.visit("/reservation");
        return;
      }

      if (role === "housekeeper") {
        router.visit("/room");
        return;
      }

      router.visit("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen font-sans`}>
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/loginchtmbg.jpg')" }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-2 overflow-hidden">
              <img src="/chtmlogo.png" alt="CHTM Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center">
              <h1
                className="text-6xl font-bold tracking-tight"
                style={{ fontFamily: "Montserrat, serif", color: "#FF0080" }}
              >
                CHTM-RRS
              </h1>
              <p className="text-base font-medium mt-1 tracking-wide">
                ROOM RESERVATION SYSTEM
              </p>
            </div>

            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-2 overflow-hidden">
              <img src="/gclogo.png" alt="GC Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <p
            className="text-left flex items-center mt-8"
            style={{
              width: "430px",
              height: "96px",
              fontWeight: 500,
              fontSize: "20px",
              lineHeight: "32px",
              textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
            }}
          >
            "Enhancing service excellence through the College of Hospitality and Tourism Management"
          </p>

          <div className="w-48 h-1 bg-pink-600 mt-4 self-start" />
          <p className="mt-6 text-white text-sm font-semibold self-start">CHTM Department</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-2xl px-8">
          <div className="mb-12">
            <h2
              className={`text-7xl font-light mb-2 font-serif`}
              style={{ color: "#3D5A4C" }}
            >
              Admin Login
            </h2>
            <div className="w-64 h-1 bg-pink-600 mb-4"></div>
            <p className="text-gray-600 text-base font-medium">
              Sign in to access the admin dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className={`block text-lg font-medium mb-2 font-serif`}
                style={{ color: "#3D5A4C" }}
              >
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-gray-50 text-black"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-lg font-medium mb-2 font-serif`}
                style={{ color: "#3D5A4C" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-gray-50 text-black"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-4 px-4 text-lg rounded-md transition-colors font-medium ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: "#3D5A4C" }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#2d4339";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#3D5A4C";
              }}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}