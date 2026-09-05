const $ = id => document.getElementById(id);
let currentUser = null;
let toastTimer = null;

function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").classList.toggle("error", isError);
    $("toast").classList.add("show");
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3200);
}

function setSaving(saving, text = "") {
    $("saveBtn").disabled = saving;
    $("saveBtn").textContent = saving ? "جاري الحفظ..." : "حفظ التغييرات";
    $("saveState").textContent = text;
}

function readableDate(value) {
    return value ? new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value)) : "—";
}

async function countRows(table) {
    const { count, error } = await supabaseClient.from(table).select("id", { count: "exact", head: true }).eq("user_id", currentUser.id);
    return error ? 0 : (count || 0);
}

async function loadStats() {
    const [learned, favorites, groups, review] = await Promise.all([countRows("learned_words"), countRows("favorites"), countRows("group_members"), countRows("review_words")]);
    $("learnedCount").textContent = learned;
    $("favoriteCount").textContent = favorites;
    $("groupCount").textContent = groups;
    $("reviewCount").textContent = review;
}

async function loadProfile() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) { location.href = "login.html"; return; }
    currentUser = user;
    const { data: profile, error: profileError } = await supabaseClient.from("profiles").select("display_name,is_public").eq("id", user.id).maybeSingle();
    if (profileError) showToast("تعذر تحميل بعض بيانات الملف التعريفي", true);
    const metadata = user.user_metadata || {};
    const name = profile?.display_name || metadata.name || user.email?.split("@")[0] || "User";
    const level = metadata.learning_level || "";
    $("nameInput").value = name;
    $("bioInput").value = metadata.bio || "";
    $("bioCount").textContent = $("bioInput").value.length;
    $("levelInput").value = level;
    $("goalInput").value = String(metadata.daily_goal || 15);
    $("publicOption").checked = profile?.is_public !== false;
    $("privateOption").checked = profile?.is_public === false;
    $("avatar").textContent = name.charAt(0).toUpperCase();
    $("profileTitle").textContent = name;
    $("profileEmail").textContent = user.email || "";
    $("accountEmail").textContent = user.email || "—";
    $("joinedAt").textContent = readableDate(user.created_at);
    $("levelBadge").textContent = level ? `مستوى ${level}` : "المستوى غير محدد";
    loadStats();
}

async function saveProfile(event) {
    event.preventDefault();
    if (!currentUser) return;
    const name = $("nameInput").value.trim();
    const bio = $("bioInput").value.trim();
    if (!/^[A-Za-z][A-Za-z0-9_]{1,19}$/.test(name)) {
        showToast("الاسم يبدأ بحرف إنجليزي ويقبل الأرقام والشرطة السفلية فقط", true);
        $("nameInput").focus();
        return;
    }
    setSaving(true, "جاري التحقق...");
    const { data: matches, error: checkError } = await supabaseClient.from("profiles").select("id").ilike("display_name", name).neq("id", currentUser.id).limit(1);
    if (checkError) { setSaving(false); showToast("تعذر التحقق من توفر الاسم", true); return; }
    if (matches?.length) { setSaving(false); showToast("اسم المستخدم مستخدم، اختر اسمًا آخر", true); return; }
    const metadata = { name, bio, learning_level: $("levelInput").value, daily_goal: Number($("goalInput").value) };
    const [{ error: authError }, { error: profileError }] = await Promise.all([
        supabaseClient.auth.updateUser({ data: metadata }),
        supabaseClient.from("profiles").upsert({ id: currentUser.id, display_name: name, is_public: $("publicOption").checked }, { onConflict: "id" })
    ]);
    if (authError || profileError) {
        setSaving(false);
        showToast(profileError?.code === "23505" ? "اسم المستخدم مستخدم، اختر اسمًا آخر" : "لم يتم حفظ التغييرات، حاول مرة أخرى", true);
        return;
    }
    $("avatar").textContent = name.charAt(0).toUpperCase();
    $("profileTitle").textContent = name;
    $("levelBadge").textContent = metadata.learning_level ? `مستوى ${metadata.learning_level}` : "المستوى غير محدد";
    setSaving(false, "تم الحفظ ✓");
    showToast("تم حفظ ملفك التعريفي");
    setTimeout(() => { $("saveState").textContent = ""; }, 2500);
}

async function logout() {
    $("logoutBtn").disabled = true;
    $("logoutBtn").textContent = "جاري تسجيل الخروج...";
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        $("logoutBtn").disabled = false;
        $("logoutBtn").innerHTML = "<span>↪</span> تسجيل الخروج";
        showToast("تعذر تسجيل الخروج، حاول مرة أخرى", true);
        return;
    }
    location.replace("login.html");
}

async function sendPasswordReset() {
    if (!currentUser?.email) return;
    $("passwordBtn").disabled = true;
    $("passwordBtn").textContent = "جاري الإرسال...";
    const redirectTo = new URL("reset-password.html", location.href).href;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(currentUser.email, { redirectTo });
    $("passwordBtn").disabled = false;
    $("passwordBtn").textContent = "إرسال رابط تغيير كلمة المرور";
    showToast(error ? "تعذر إرسال الرابط، حاول مرة أخرى" : "أرسلنا رابط تغيير كلمة المرور إلى بريدك", Boolean(error));
}

$("profileForm").addEventListener("submit", saveProfile);
$("logoutBtn").addEventListener("click", logout);
$("passwordBtn").addEventListener("click", sendPasswordReset);
$("bioInput").addEventListener("input", () => { $("bioCount").textContent = $("bioInput").value.length; });
loadProfile();
