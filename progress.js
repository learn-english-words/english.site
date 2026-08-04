// ==========================================
// EnglishWords — USER PRESENCE
// تسجيل المستخدم المتصل ومكانه الحالي
// ==========================================

let presenceTimer = null;


// ==========================================
// معرفة الصفحة الحالية
// ==========================================

function getCurrentPresencePage() {

    const file =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (file === "games.html") {
        return "games";
    }

    if (file === "battle.html") {
        return "battle";
    }

    if (
        file === "learn.html" ||
        file === "learning.html" ||
        file === "words.html"
    ) {
        return "learning";
    }

    if (
        file === "reading.html" ||
        file === "read.html"
    ) {
        return "reading";
    }

    if (
        file === "quiz.html"
    ) {
        return "quiz";
    }

    if (
        file === "chat.html"
    ) {
        return "chat";
    }

    return "home";
}


// ==========================================
// تحديث وجود المستخدم
// ==========================================

async function updatePresence() {

    try {

        const {
            data: {
                user
            }
        } =
            await supabaseClient.auth.getUser();


        // إذا لم يكن مسجل الدخول
        if (!user) {
            return;
        }


        const page =
            getCurrentPresencePage();


        const {
            error
        } =
            await supabaseClient

                .from("user_presence")

                .upsert({

                    user_id:
                        user.id,

                    page:
                        page,

                    last_seen:
                        new Date().toISOString()

                }, {

                    onConflict:
                        "user_id"

                });


        if (error) {

            console.error(
                "Presence update error:",
                error
            );

        }

    } catch (error) {

        console.error(
            "Presence error:",
            error
        );

    }

}


// ==========================================
// تشغيل تسجيل الوجود
// ==========================================

async function startPresence() {

    await updatePresence();


    // تحديث كل 15 ثانية

    clearInterval(
        presenceTimer
    );


    presenceTimer =
        setInterval(
            updatePresence,
            15000
        );

}


// ==========================================
// تشغيل بعد تحميل الصفحة
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        startPresence();

    }
);