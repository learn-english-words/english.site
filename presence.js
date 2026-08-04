/* =========================================================
   EnglishWords — تتبع المتواجدين والصفحات
========================================================= */

let presenceUser = null;
let presenceTimer = null;

async function startPresence(pageName) {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error || !data?.user) return;

        presenceUser = data.user;

        await updatePresence(pageName);

        clearInterval(presenceTimer);

        presenceTimer = setInterval(() => {

            updatePresence(pageName);

        }, 15000);

    } catch (error) {

        console.error(
            "Presence error:",
            error
        );

    }

}


async function updatePresence(pageName) {

    if (!presenceUser) return;

    const {
        error
    } = await supabaseClient
        .from("user_presence")
        .upsert({

            user_id:
                presenceUser.id,

            page:
                pageName,

            last_seen:
                new Date().toISOString()

        }, {

            onConflict:
                "user_id"

        });

    if (error) {

        console.error(
            "Update presence error:",
            error
        );

    }

}


/* حذف المستخدم عند إغلاق الصفحة */

window.addEventListener(
    "beforeunload",
    () => {

        if (!presenceUser) return;

        /*
           لا نعتمد على delete هنا،
           لأن beforeunload قد لا ينتظر الطلب.
           last_seen هو الذي يحدد المتصلين فعليًا.
        */

    }
);


/* عند عودة المستخدم للصفحة */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (presenceUser) {

                const page =
                    window.location.pathname
                        .split("/")
                        .pop()
                        .replace(".html", "") ||
                    "index";

                updatePresence(page);

            }

        }

    }
);