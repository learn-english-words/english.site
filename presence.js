/* =========================================================
   EnglishWords — تتبع المتواجدين + سجل الزيارات
========================================================= */

let presenceUser = null;
let presenceTimer = null;

let currentPresencePage = null;
let currentVisitId = null;


/* =========================================================
   بدء التتبع
========================================================= */

async function startPresence(pageName) {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();


        if (error || !data?.user) {

            console.log(
                "Presence: لا يوجد مستخدم مسجل دخول."
            );

            return;

        }


        presenceUser =
            data.user;


        currentPresencePage =
            pageName || getPageName();


        /* ==========================================
           تسجيل الزيارة
        ========================================== */

        await createVisitLog(
            currentPresencePage
        );


        /* ==========================================
           تحديث المتصل الآن
        ========================================== */

        await updatePresence(
            currentPresencePage
        );


        clearInterval(
            presenceTimer
        );


        /*
           تحديث كل 15 ثانية
        */

        presenceTimer =
            setInterval(
                () => {

                    updatePresence(
                        currentPresencePage
                    );

                },
                15000
            );


    } catch (error) {

        console.error(
            "Presence start error:",
            error
        );

    }

}


/* =========================================================
   معرفة الصفحة الحالية
========================================================= */

function getPageName() {

    const file =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (
        !file ||
        file === "index.html"
    ) {

        return "home";

    }


    if (
        file === "games.html"
    ) {

        return "games";

    }


    if (
        file === "battle.html"
    ) {

        return "battle";

    }


    if (
        file === "reading.html"
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


    if (
        file === "learn.html" ||
        file === "learning.html" ||
        file === "words.html"
    ) {

        return "learning";

    }


    return file.replace(
        ".html",
        ""
    ) || "home";

}


/* =========================================================
   إنشاء سجل زيارة جديد
========================================================= */

async function createVisitLog(
    pageName
) {

    if (!presenceUser) return;


    const {
        data,
        error
    } =
        await supabaseClient

            .from("user_visit_logs")

            .insert({

                user_id:
                    presenceUser.id,

                page:
                    pageName,

                entered_at:
                    new Date().toISOString(),

                last_seen:
                    new Date().toISOString()

            })

            .select("id")

            .single();


    if (error) {

        console.error(
            "Create visit log error:",
            error
        );


        return;

    }


    currentVisitId =
        data?.id || null;

}


/* =========================================================
   تحديث المتواجد الآن
========================================================= */

async function updatePresence(
    pageName
) {

    if (!presenceUser) return;


    const now =
        new Date().toISOString();


    /* ==========================================
       user_presence
    ========================================== */

    const {
        error: presenceError
    } =
        await supabaseClient

            .from("user_presence")

            .upsert({

                user_id:
                    presenceUser.id,

                page:
                    pageName,

                last_seen:
                    now

            }, {

                onConflict:
                    "user_id"

            });


    if (presenceError) {

        console.error(
            "Update presence error:",
            presenceError
        );

    }


    /* ==========================================
       user_visit_logs
    ========================================== */

    if (currentVisitId) {

        const {
            error: visitError
        } =
            await supabaseClient

                .from("user_visit_logs")

                .update({

                    last_seen:
                        now

                })

                .eq(
                    "id",
                    currentVisitId
                );


        if (visitError) {

            console.error(
                "Update visit log error:",
                visitError
            );

        }

    }

}


/* =========================================================
   عند العودة للصفحة
========================================================= */

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }


        if (!presenceUser) {

            return;

        }


        const page =
            getPageName();


        /*
           إذا انتقل إلى صفحة مختلفة
           نبدأ سجل زيارة جديد
        */

        if (
            currentPresencePage !==
            page
        ) {

            currentPresencePage =
                page;


            await createVisitLog(
                page
            );

        }


        await updatePresence(
            page
        );

    }
);


/* =========================================================
   عند التركيز على الصفحة
========================================================= */

window.addEventListener(
    "focus",
    () => {

        if (!presenceUser) return;


        updatePresence(
            currentPresencePage ||
            getPageName()
        );

    }
);


/* =========================================================
   تشغيل تلقائي
========================================================= */

/*
   إذا كنت تستدعي startPresence("home")
   أو startPresence("games")
   من صفحاتك، لا تحتاج هذا الجزء.

   أما إذا لم تكن تستدعيها من الصفحة،
   سيتم تشغيلها تلقائيًا.
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const page =
            getPageName();


        startPresence(
            page
        );

    }
);