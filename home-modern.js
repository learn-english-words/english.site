const $ = id => document.getElementById(id);
let currentUser = null;
let roomChannels = [];
let deferredInstallPrompt = null;

const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

function weekDates() {
    const formatter = new Intl.DateTimeFormat("ar-SA", { weekday: "short" });
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        return { date, label: formatter.format(date).replace("،", "") };
    });
}

function localDateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function renderWeek(activeKeys = new Set()) {
    $("week").innerHTML = weekDates().map(({ date, label }) => {
        const done = activeKeys.has(localDateKey(date));
        return `<div class="day ${done ? "done" : ""}">${label}<i>${done ? "✓" : ""}</i></div>`;
    }).join("");
}

function renderChart(minutes = []) {
    const days = weekDates();
    const values = days.map((_, index) => Math.max(0, Math.round(minutes[index] || 0)));
    const maximum = Math.max(1, ...values);
    $("chart").innerHTML = values.map((value, index) => {
        const height = value ? Math.max(12, Math.round((value / maximum) * 100)) : 3;
        return `<div class="bar" style="--h:${height}%" data-v="${value}" data-d="${escapeHtml(days[index].label)}" title="${value} دقيقة"></div>`;
    }).join("");
}

async function loadVocabulary() {
    const wordsRequest = supabaseClient.from("words").select("id,english,arabic,image,example", { count: "exact" }).not("english", "is", null).limit(80);
    const learnedRequest = currentUser
        ? supabaseClient.from("learned_words").select("word_id", { count: "exact", head: true }).eq("user_id", currentUser.id)
        : Promise.resolve({ count: 0 });
    const reviewRequest = currentUser
        ? supabaseClient.from("review_words").select("word_id", { count: "exact", head: true }).eq("user_id", currentUser.id)
        : Promise.resolve({ count: 0 });

    const [{ data: words, count: total }, learnedResult, reviewResult] = await Promise.all([wordsRequest, learnedRequest, reviewRequest]);
    const mastered = learnedResult.count || 0;
    const learning = reviewResult.count || 0;
    const percent = total ? Math.min(100, Math.round((mastered / total) * 100)) : 0;

    $("wordCount").textContent = total ?? "—";
    $("mastered").textContent = mastered;
    $("learning").textContent = learning;
    $("vocabPercent").textContent = `${percent}%`;
    $("vocabRing").style.setProperty("--vocab-progress", `${percent}%`);
    $("vocabHint").textContent = learning ? `لديك ${learning} كلمة تحتاج مراجعة` : "ابدأ تعلّم كلمات جديدة اليوم";

    if (words?.length) {
        const word = words[Math.floor(Date.now() / 86400000) % words.length];
        $("wordEn").textContent = word.english || "Learn something new today.";
        $("wordAr").textContent = word.arabic || "";
        $("wordExample").textContent = word.example || "استمع إلى الكلمة وكرر نطقها.";
        if (word.image) {
            $("lessonImg").style.backgroundImage = `linear-gradient(rgba(5,11,30,.15),rgba(5,11,30,.45)),url("${String(word.image).replace(/"/g, "")}")`;
            $("lessonImg").style.backgroundSize = "cover";
            $("lessonImg").style.backgroundPosition = "center";
            $("lessonImg").innerHTML = "";
        }
    }
}

async function loadFavoritesCount() {
    if (!currentUser) return;
    const { count } = await supabaseClient.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", currentUser.id);
    $("favoritesQuickCount").textContent = count ? `${count} كلمة محفوظة` : "احفظ كلماتك هنا";
}

async function loadWeeklyActivity() {
    if (!currentUser) {
        renderChart();
        renderWeek();
        return;
    }
    const days = weekDates();
    const start = days[0].date.toISOString();
    const { data, error } = await supabaseClient
        .from("user_visit_logs")
        .select("entered_at,last_seen")
        .eq("user_id", currentUser.id)
        .gte("entered_at", start)
        .order("entered_at", { ascending: true });

    if (error) {
        console.warn("Visit activity could not be loaded; trying learned words:", error.message);
        const { data: learned } = await supabaseClient
            .from("learned_words")
            .select("created_at")
            .eq("user_id", currentUser.id)
            .gte("created_at", start);
        const learnedTotals = new Map(days.map(({ date }) => [localDateKey(date), 0]));
        (learned || []).forEach(item => {
            const key = localDateKey(item.created_at);
            if (learnedTotals.has(key)) learnedTotals.set(key, learnedTotals.get(key) + 1);
        });
        const learnedValues = days.map(({ date }) => learnedTotals.get(localDateKey(date)) || 0);
        renderChart(learnedValues);
        renderWeek(new Set(days.filter((_, index) => learnedValues[index] > 0).map(({ date }) => localDateKey(date))));
        return;
    }

    const totals = new Map(days.map(({ date }) => [localDateKey(date), 0]));
    (data || []).forEach(visit => {
        const key = localDateKey(visit.entered_at);
        if (!totals.has(key)) return;
        const startTime = new Date(visit.entered_at).getTime();
        const endTime = new Date(visit.last_seen || visit.entered_at).getTime();
        const minutes = Math.max(1, Math.min(240, (endTime - startTime) / 60000));
        totals.set(key, totals.get(key) + minutes);
    });
    const values = days.map(({ date }) => totals.get(localDateKey(date)) || 0);
    renderChart(values);
    renderWeek(new Set(days.filter((_, index) => values[index] > 0).map(({ date }) => localDateKey(date))));
}

function roomLink(group) {
    return `voice-room.html?group=${encodeURIComponent(group.id)}&name=${encodeURIComponent(group.name || "مجموعة صوتية")}`;
}

function updateRoomPresence(groupId, count) {
    const badge = document.querySelector(`[data-room-status="${groupId}"]`);
    const people = document.querySelector(`[data-room-count="${groupId}"]`);
    if (!badge || !people) return;
    badge.textContent = count ? "مباشر الآن" : "جاهزة للصوت";
    badge.classList.toggle("waiting", !count);
    people.textContent = count ? `${count} في الغرفة` : "ابدأ المحادثة";
}

function watchRoom(group) {
    const channel = supabaseClient.channel(`voice-group-${group.id}`, { config: { presence: { key: `home-${currentUser.id}` } } });
    channel.on("presence", { event: "sync" }, () => {
        const count = Object.values(channel.presenceState()).reduce((sum, entries) => sum + entries.length, 0);
        updateRoomPresence(group.id, count);
    }).subscribe();
    roomChannels.push(channel);
}

async function loadGroups() {
    if (!currentUser) {
        $("liveRooms").innerHTML = '<div class="rooms-empty"><span>سجّل دخولك لعرض مجموعاتك الصوتية</span><a href="login.html">تسجيل الدخول</a></div>';
        return;
    }
    const { data, error } = await supabaseClient
        .from("group_members")
        .select("group_id,groups(id,name,description)")
        .eq("user_id", currentUser.id)
        .order("joined_at", { ascending: false })
        .limit(3);
    const groups = (data || []).map(item => item.groups).filter(Boolean);
    if (error || !groups.length) {
        $("liveRooms").innerHTML = '<div class="rooms-empty"><span>لا توجد مجموعات لديك حتى الآن</span><a href="groups.html">أنشئ مجموعة صوتية</a></div>';
        return;
    }
    $("liveRooms").innerHTML = groups.map(group => `
        <article>
            <span class="live waiting" data-room-status="${escapeHtml(group.id)}">جاهزة للصوت</span>
            <div><h3>${escapeHtml(group.name)}</h3><p>${escapeHtml(group.description || "محادثة صوتية مع أعضاء المجموعة")}</p></div>
            <span class="faces-count" data-room-count="${escapeHtml(group.id)}">ابدأ المحادثة</span>
            <button type="button" data-room-link="${escapeHtml(roomLink(group))}">دخول</button>
        </article>`).join("");
    $("liveRooms").querySelectorAll("[data-room-link]").forEach(button => button.addEventListener("click", () => { location.href = button.dataset.roomLink; }));
    groups.forEach(watchRoom);
}

async function init() {
    setupAppInstall();
    renderWeek();
    renderChart();
    const hour = new Date().getHours();
    $("greeting").textContent = hour < 12 ? "صباح الخير" : "مساء الخير";
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user;
    if (user) {
        const { data: profile } = await supabaseClient.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        const name = profile?.display_name || user.user_metadata?.name || user.email?.split("@")[0] || "مستخدم";
        $("profileName").textContent = name;
        $("avatarLetter").textContent = name[0].toUpperCase();
        $("welcomeText").textContent = `أهلًا ${name}، جاهز لتطوير لغتك الإنجليزية اليوم؟`;
    }
    await Promise.allSettled([loadVocabulary(), loadFavoritesCount(), loadWeeklyActivity(), loadGroups()]);
}

function isStandaloneApp() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function showInstallInstructions() {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    $("installSteps").innerHTML = isIOS
        ? "1. اضغط زر المشاركة في Safari.<br>2. اختر «إضافة إلى الشاشة الرئيسية».<br>3. اضغط «إضافة»."
        : "1. افتح قائمة المتصفح ⋮ أو زر المشاركة.<br>2. اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».<br>3. وافق على التثبيت.";
    $("installHelp").showModal();
}

async function installApp() {
    if (!deferredInstallPrompt) {
        showInstallInstructions();
        return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (outcome === "accepted") $("installAppBtn").hidden = true;
}

function setupAppInstall() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("service-worker.js").catch(error => console.warn("Service worker registration failed:", error));
    }
    if (isStandaloneApp()) {
        $("installAppBtn").hidden = true;
        return;
    }
    $("installAppBtn").hidden = false;
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        $("installAppBtn").hidden = false;
    });
    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        $("installAppBtn").hidden = true;
    });
    $("installAppBtn").addEventListener("click", installApp);
    $("installCloseBtn").addEventListener("click", () => $("installHelp").close());
    $("installHelp").addEventListener("click", event => {
        if (event.target === $("installHelp")) $("installHelp").close();
    });
}

$("profileBtn").onclick = () => { location.href = currentUser ? "profile.html" : "login.html"; };
window.addEventListener("beforeunload", () => roomChannels.forEach(channel => supabaseClient.removeChannel(channel)));
init();
