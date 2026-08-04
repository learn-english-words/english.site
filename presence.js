/* =========================================================
   EnglishWords — تتبع المتواجدين + سجل الزيارات
========================================================= */

let presenceUser = null;
let presenceTimer = null;

let currentPresencePage = null;
let currentVisitId = null;


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


    if (file === "games.html") {
        return "games";
    }


    if (file === "battle.html") {
        return "battle";
    }


    if (file === "reading.html") {
        return "reading";
    }


    if (file === "quiz.html") {
        return "quiz";
    }


    if (file === "chat.html") {
        return "chat";
    }


    if (
        file === "learn.html" ||
        file === "learning.html" ||
        file === "words.html"
    ) {
        return "learning";
    }


    return (
        file.replace(".html", "") ||
        "home"
    );

}


/* =========================================================
   إنشاء سجل زيارة
========================================================= */

async function createVisitLog(pageName) {

    if (!presenceUser) {
        return;
    }


    const now =
        new Date().toISOString();


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
                    now,

                last_seen:
                    now

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
   تحديث آخر نشاط
========================================================= */

async function updatePresence(pageName) {

    if (!presenceUser) {
        return;
    }


    const now =
        new Date().toISOString();


    if (!currentVisitId) {

        await createVisitLog(
            pageName
        );

        return;

    }


    const {
        error
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


    if (error) {

        console.error(
            "Update presence error:",
            error
        );

    }

}


/* =========================================================
   بدء التتبع
========================================================= */

async function startPresence(pageName) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (
            error ||
            !data?.user
        ) {

            console.log(
                "Presence: لا يوجد مستخدم مسجل دخول."
            );

            return;

        }


        presenceUser =
            data.user;


        currentPresencePage =
            pageName ||
            getPageName();


        /* ==========================================
           إنشاء زيارة جديدة
        ========================================== */

        await createVisitLog(
            currentPresencePage
        );


        /* ==========================================
           تحديث النشاط مباشرة
        ========================================== */

        await updatePresence(
            currentPresencePage
        );


        /* ==========================================
           إلغاء المؤقت القديم
        ========================================== */

        clearInterval(
            presenceTimer
        );


        /* ==========================================
           تحديث كل 15 ثانية
        ========================================== */

        presenceTimer =
            setInterval(
                async () => {

                    if (
                        document.visibilityState !==
                        "visible"
                    ) {
                        return;
                    }


                    await updatePresence(
                        currentPresencePage ||
                        getPageName()
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


        /* ==========================================
           إذا انتقل المستخدم إلى صفحة أخرى
        ========================================== */

        if (
            currentPresencePage !==
            page
        ) {

            currentPresencePage =
                page;


            currentVisitId =
                null;


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
    async () => {

        if (!presenceUser) {
            return;
        }


        const page =
            getPageName();


        if (
            currentPresencePage !==
            page
        ) {

            currentPresencePage =
                page;


            currentVisitId =
                null;


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
   تشغيل تلقائي
========================================================= */

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