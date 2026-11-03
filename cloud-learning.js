import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, CLOUD_ENABLED } from "./cloud-config.js";

const $ = id => document.getElementById(id);
let supabase = null;
let currentUser = null;
let currentProfile = null;
let authBusy = false;

const setText = (id, message) => { const el = $(id); if (el) el.textContent = message; };
const show = (id, visible = true) => $(id)?.classList.toggle("hidden", !visible);
const errorMessage = error => {
  const message = error?.message || error?.error_description || "Something went wrong. Please try again.";
  return String(message).replace(/^AuthApiError:\s*/i, "");
};
function ready() {
  if (!navigator.onLine) throw new Error("This feature needs an internet connection. Your offline lessons still work.");
  if (!CLOUD_ENABLED || !supabase) throw new Error("Supabase is not configured. Check cloud-config.js and publish the updated file.");
}
function status(message, ok = false) {
  setText("cloudStatus", message);
  $("cloudStatus")?.classList.toggle("ready", ok);
}

const CLASS_KEY = "learnchem_class_level";
const classOptions = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3", "University 100", "University 200", "University 300", "University 400"];
function setClassStatus(message, ok = false) {
  setText("classStatus", message);
  $("classStatus")?.classList.toggle("ready", ok);
}
function applyClass(level) {
  if (!classOptions.includes(level)) return;
  localStorage.setItem(CLASS_KEY, level);
  if ($("learnerClass")) $("learnerClass").value = level;
  if ($("signupClass")) $("signupClass").value = level;
  setClassStatus("Learning: " + level, true);
  setText("classMessage", `Your Learning Centre is set to ${level}. You can change this at any time.`);
  window.dispatchEvent(new CustomEvent("learnchem-class-changed", { detail: { level } }));
}
const savedClass = localStorage.getItem(CLASS_KEY);
if (classOptions.includes(savedClass)) applyClass(savedClass);

function tutorLine(text, kind) {
  const host = $("onlineTutorLog");
  if (!host) return;
  const p = document.createElement("p");
  p.className = kind === "user" ? "user-line" : "ai-line";
  p.textContent = text;
  host.append(p);
  host.scrollTop = host.scrollHeight;
}

if (CLOUD_ENABLED) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    status("Supabase client initialized", true);
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setText("authMessage", "Could not restore your session: " + errorMessage(error));
      return refreshUser(data?.session?.user || null);
    }).catch(error => setText("authMessage", "Session check failed: " + errorMessage(error)));
    supabase.auth.onAuthStateChange((_event, session) => {
      // Defer profile/database work until after Supabase completes its auth callback.
      Promise.resolve().then(() => refreshUser(session?.user || null));
    });
  } catch (error) {
    status("Supabase setup error");
    setText("authMessage", "Supabase could not start: " + errorMessage(error));
    console.error("LEARN CHEM Supabase initialization error:", error);
  }
} else {
  status("Setup required");
  setText("authMessage", "Add your Supabase Project URL and publishable key to cloud-config.js, then publish the site again.");
}

async function refreshUser(user) {
  currentUser = user;
  currentProfile = null;
  if (!user) {
    setText("authMessage", CLOUD_ENABLED ? "You are signed out. Sign in or create an account." : "Add Supabase project settings to enable accounts.");
    show("cloudSignOut", false);
    show("teacherGroupControls", false);
    setText("myGroups", "Sign in to see your school groups.");
    return;
  }
  show("cloudSignOut", true);
  try {
    // This safe RPC creates a missing student profile without allowing a user to choose their role.
    const { error: ensureError } = await supabase.rpc("ensure_my_profile");
    if (ensureError) console.warn("Profile ensure check:", ensureError.message);
    const { data, error } = await supabase.from("profiles")
      .select("id,display_name,role,class_level").eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      setText("authMessage", "You are signed in, but your learner profile is missing. Run migration 003 in Supabase SQL Editor, then refresh this page.");
      show("teacherGroupControls", false);
      return;
    }
    currentProfile = data;
    if (classOptions.includes(data.class_level)) applyClass(data.class_level);
    else if (classOptions.includes(localStorage.getItem(CLASS_KEY))) {
      const { error: classError } = await supabase.from("profiles").update({ class_level: localStorage.getItem(CLASS_KEY) }).eq("id", user.id);
      if (classError) setClassStatus("Class is saved on this device; cloud sync failed: " + errorMessage(classError));
    } else setClassStatus("Choose your class");
    const isTeacher = ["teacher", "admin"].includes(data.role);
    show("teacherGroupControls", isTeacher);
    setText("authMessage", `Signed in as ${data.display_name || user.email} (${data.role}).`);
    await loadGroups();
  } catch (error) {
    setText("authMessage", "Signed in, but your profile could not load: " + errorMessage(error));
    console.error("LEARN CHEM profile load error:", error);
  }
}

$("cloudSignUp")?.addEventListener("click", async () => {
  const button = $("cloudSignUp");
  if (authBusy) return;
  authBusy = true;
  if (button) button.disabled = true;
  try {
    ready();
    const email = $("cloudEmail")?.value.trim() || "";
    const password = $("cloudPassword")?.value || "";
    const name = $("cloudDisplayName")?.value.trim() || "";
    const classLevel = $("signupClass")?.value || "";
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (password.length < 8) throw new Error("Your password must contain at least 8 characters.");
    if (!name) throw new Error("Enter your full name.");
    if (!classOptions.includes(classLevel)) throw new Error("Choose your current class before creating an account.");

    setText("authMessage", "Creating your account… please wait.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name, class_level: classLevel }, emailRedirectTo: "https://chukzblaq001.github.io/LEARN-CHEM/profile.html" }
    });
    if (error) throw error;
    if (!data?.user) throw new Error("Supabase did not return a user record. Check your Supabase Auth settings and try again.");
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error("This email may already be registered. Try Sign in, or use the password reset option in Supabase Auth.");
    }
    applyClass(classLevel);
    if (data.session) {
      setText("authMessage", "Account created and signed in successfully. Your learner profile is being loaded.");
      await refreshUser(data.user);
    } else {
      setText("authMessage", "Supabase accepted the new account. Email confirmation is enabled: open the confirmation email, confirm your address, then return here and sign in. If this email does not appear in Supabase → Authentication → Users, check the Supabase project URL in cloud-config.js.");
    }
  } catch (error) {
    setText("authMessage", "Registration failed: " + errorMessage(error));
    console.error("LEARN CHEM registration failed:", error);
  } finally {
    authBusy = false;
    if (button) button.disabled = false;
  }
});

$("cloudSignIn")?.addEventListener("click", async () => {
  try {
    ready();
    const email = $("cloudEmail")?.value.trim() || "";
    const password = $("cloudPassword")?.value || "";
    if (!email || !password) throw new Error("Enter your email address and password.");
    setText("authMessage", "Signing in…");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data?.user) throw new Error("Sign-in did not return a user. Please try again.");
    setText("authMessage", "Sign-in successful. Loading your learner profile…");
    await refreshUser(data.user);
  } catch (error) {
    setText("authMessage", "Sign-in failed: " + errorMessage(error));
    console.error("LEARN CHEM sign-in failed:", error);
  }
});

$("cloudSignOut")?.addEventListener("click", async () => {
  try {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setText("authMessage", "You have signed out. Your offline lessons and local progress remain on this device.");
  } catch (error) { setText("authMessage", "Sign-out failed: " + errorMessage(error)); }
});

async function loadGroups() {
  if (!currentUser || !supabase) return [];
  const host = $("myGroups");
  const { data, error } = await supabase.from("group_members")
    .select("group_id,school_groups(id,name,join_code)").eq("user_id", currentUser.id);
  if (error) {
    if (host) host.textContent = "Could not load school groups: " + errorMessage(error) + " — check migration 003 and Supabase permissions.";
    console.error("LEARN CHEM group list error:", error);
    return null;
  }
  if (host) {
    host.replaceChildren();
    const validGroups = (data || []).filter(row => row.school_groups);
    if (!validGroups.length) host.textContent = "You have not joined a school group yet. Ask your teacher for a join code.";
    validGroups.forEach(row => {
      const item = document.createElement("div"); item.className = "group-chip";
      const name = document.createElement("strong"); name.textContent = row.school_groups.name;
      const code = document.createElement("span"); code.textContent = row.school_groups.join_code ? `Code: ${row.school_groups.join_code}` : "Member";
      item.append(name, code); host.append(item);
    });
  }
  if (["teacher", "admin"].includes(currentProfile?.role)) await loadRoster();
  return data || [];
}

async function loadRoster() {
  const host = $("teacherRoster");
  if (!host || !currentUser) return;
  host.replaceChildren();
  const { data: groups, error } = await supabase.from("school_groups").select("id,name,join_code").eq("teacher_id", currentUser.id);
  if (error) { host.textContent = "Could not load your teacher groups: " + errorMessage(error); return; }
  if (!groups?.length) { host.textContent = "You have not created a group yet."; return; }
  for (const group of groups) {
    const heading = document.createElement("h4"); heading.textContent = `${group.name} · Join code: ${group.join_code}`; host.append(heading);
    const { data: members, error: memberError } = await supabase.from("group_members").select("user_id,profiles(display_name)").eq("group_id", group.id);
    if (memberError) { const p = document.createElement("p"); p.textContent = "Could not load members: " + errorMessage(memberError); host.append(p); continue; }
    const table = document.createElement("table"), head = document.createElement("thead"), body = document.createElement("tbody"), header = document.createElement("tr");
    ["Student", "Completed topics"].forEach(label => { const th = document.createElement("th"); th.textContent = label; header.append(th); });
    head.append(header);
    for (const member of members || []) {
      const { count, error: progressError } = await supabase.from("learner_progress").select("id", { count: "exact", head: true }).eq("user_id", member.user_id).eq("completed", true);
      const tr = document.createElement("tr"), name = document.createElement("td"), progress = document.createElement("td");
      name.textContent = member.profiles?.display_name || "Student";
      progress.textContent = progressError ? "Unavailable" : String(count || 0);
      tr.append(name, progress); body.append(tr);
    }
    table.append(head, body); host.append(table);
  }
}

$("createGroupBtn")?.addEventListener("click", async () => {
  const button = $("createGroupBtn");
  if (button) button.disabled = true;
  try {
    ready();
    if (!currentUser || !currentProfile) throw new Error("Sign in before creating a school group.");
    if (!["teacher", "admin"].includes(currentProfile.role)) throw new Error("Your account is currently a student account. A project administrator must approve your account as a teacher before you can create school groups. Ask the administrator to run the teacher-approval SQL in the setup guide.");
    const name = $("newGroupName")?.value.trim() || "";
    if (name.length < 3 || name.length > 80) throw new Error("Enter a group name between 3 and 80 characters.");
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const code = Array.from(bytes, value => (value % 36).toString(36)).join("").toUpperCase();
    const { data: group, error } = await supabase.from("school_groups").insert({ name, join_code: code, teacher_id: currentUser.id }).select("id,name,join_code").single();
    if (error) throw error;
    const { error: memberError } = await supabase.from("group_members").insert({ group_id: group.id, user_id: currentUser.id });
    if (memberError) {
      await supabase.from("school_groups").delete().eq("id", group.id);
      throw memberError;
    }
    setText("groupMessage", `Group created successfully. Share this join code with your students: ${group.join_code}`);
    if ($("newGroupName")) $("newGroupName").value = "";
    await loadGroups();
  } catch (error) {
    setText("groupMessage", "Group creation failed: " + errorMessage(error));
    console.error("LEARN CHEM group creation failed:", error);
  } finally { if (button) button.disabled = false; }
});

$("joinGroupBtn")?.addEventListener("click", async () => {
  const button = $("joinGroupBtn");
  if (button) button.disabled = true;
  try {
    ready();
    if (!currentUser) throw new Error("Sign in to your student account before joining a group.");
    const code = $("groupJoinCode")?.value.trim().toUpperCase() || "";
    if (!code) throw new Error("Enter the join code given to you by your teacher.");
    const { data: groupId, error } = await supabase.rpc("join_school_group", { p_join_code: code });
    if (error) throw error;
    if (!groupId) throw new Error("Supabase did not confirm the group membership. Please check the code and try again.");
    const groups = await loadGroups();
    const joined = Array.isArray(groups) && groups.some(row => row.group_id === groupId);
    if (!joined) throw new Error("The join request was accepted, but your group list did not refresh. Refresh the page and check again.");
    setText("groupMessage", "You have successfully joined the school group.");
    if ($("groupJoinCode")) $("groupJoinCode").value = "";
  } catch (error) {
    setText("groupMessage", "Could not join group: " + errorMessage(error));
    console.error("LEARN CHEM group join failed:", error);
  } finally { if (button) button.disabled = false; }
});

$("saveLearnerClass")?.addEventListener("click", async () => {
  const level = $("learnerClass")?.value || "";
  if (!classOptions.includes(level)) { setText("classMessage", "Please choose one of the available classes."); return; }
  applyClass(level);
  if (!navigator.onLine) { setText("classMessage", `Saved on this device as ${level}. Sign in while online to sync this class to your account.`); return; }
  if (currentUser && supabase) {
    const { error } = await supabase.from("profiles").update({ class_level: level }).eq("id", currentUser.id);
    if (error) { setText("classMessage", "Saved on this device, but cloud update failed: " + errorMessage(error)); return; }
    if (currentProfile) currentProfile.class_level = level;
    setText("classMessage", `Your class (${level}) is saved on this device and in your account.`);
  } else setText("classMessage", `Your class (${level}) is saved on this device. Sign in to sync it across devices.`);
});

$("syncProgressBtn")?.addEventListener("click", async () => {
  try {
    ready(); if (!currentUser) throw new Error("Sign in before syncing.");
    const state = JSON.parse(localStorage.getItem("learnchem_progress_v1") || '{"completed":[],"bookmarks":[],"scores":[]}');
    const { data: remote, error: readError } = await supabase.from("learner_progress").select("lesson_id,completed,bookmarked").eq("user_id", currentUser.id);
    if (readError) throw readError;
    const completed = new Set([...(state.completed || []), ...(remote || []).filter(row => row.completed).map(row => row.lesson_id)]);
    const bookmarks = new Set([...(state.bookmarks || []), ...(remote || []).filter(row => row.bookmarked).map(row => row.lesson_id)]);
    const allIds = new Set([...completed, ...bookmarks]);
    if (!allIds.size) throw new Error("Complete or bookmark a lesson before syncing.");
    const rows = [...allIds].map(id => ({ user_id: currentUser.id, lesson_id: String(id), completed: completed.has(id), bookmarked: bookmarks.has(id) }));
    const { error } = await supabase.from("learner_progress").upsert(rows, { onConflict: "user_id,lesson_id" });
    if (error) throw error;
    state.completed = [...completed]; state.bookmarks = [...bookmarks];
    localStorage.setItem("learnchem_progress_v1", JSON.stringify(state));
    setText("syncMessage", `Merged and synced ${rows.length} lesson records. Local and cloud progress are now combined.`);
    window.dispatchEvent(new CustomEvent("learnchem-cloud-progress-updated"));
  } catch (error) { setText("syncMessage", errorMessage(error)); }
});

$("askOnlineTutorBtn")?.addEventListener("click", async () => {
  const question = $("onlineTutorQuestion")?.value.trim() || "";
  try {
    ready(); if (!currentUser) throw new Error("Sign in to use the online tutor.");
    if (question.length < 4 || question.length > 3000) throw new Error("Question must be between 4 and 3,000 characters.");
    tutorLine(question, "user"); $("onlineTutorQuestion").value = ""; setText("aiTutorMessage", "The AI tutor is thinking…"); $("askOnlineTutorBtn").disabled = true;
    const { data, error } = await supabase.functions.invoke("chemistry-tutor", { body: { question } });
    if (error) throw error;
    tutorLine(data?.answer || "No answer returned. Please try again.", "ai");
    setText("aiTutorMessage", "Answer generated. Check important calculations against your notes or teacher.");
  } catch (error) { setText("aiTutorMessage", errorMessage(error)); }
  finally { if ($("askOnlineTutorBtn")) $("askOnlineTutorBtn").disabled = false; }
});

window.addEventListener("online", () => { if (CLOUD_ENABLED) status("Internet connected — cloud features available", true); });
window.addEventListener("offline", () => status("Offline — local learning remains available"));
