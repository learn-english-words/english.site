/* =========================================================
   EnglishWords — الإشعارات العامة للرسائل
   notifications.js

   المطلوب:
   1) تحميل supabase.js قبل هذا الملف
   2) وجود جدول messages في Supabase
   3) تفعيل Realtime على جدول messages
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       المتغيرات
    ===================================================== */

    let notificationCurrentUser = null;

    let notificationChannel = null;

    let notificationTimer = null;

    let notificationSender = null;


    /* =====================================================
       CSS الإشعار
    ===================================================== */

    const style = document.createElement("style");

    style.textContent = `

        #globalMessageNotification {

            position: fixed;

            top: max(15px, env(safe-area-inset-top));

            left: 15px;

            right: 15px;

            max-width: 430px;

            margin: auto;

            background: white;

            border-radius: 17px;

            padding: 13px 15px;

            box-shadow:
                0 8px 30px rgba(0,0,0,.18);

            z-index: 999999;

            display: none;

            align-items: center;

            gap: 12px;

            cursor: pointer;

            direction: rtl;

            font-family:
                Arial,
                Tahoma,
                sans-serif;

        }


        #globalMessageNotification.show {

            display: flex;

            animation:
                globalNotificationIn .25s ease;

        }


        @keyframes globalNotificationIn {

            from {

                opacity: 0;

                transform:
                    translateY(-18px);

            }

            to {

                opacity: 1;

                transform:
                    translateY(0);

            }

        }


        #globalNotificationAvatar {

            width: 45px;

            height: 45px;

            min-width: 45px;

            border-radius: 50%;

            background:
                linear-gradient(
                    135deg,
                    #6254eb,
                    #8374ed
                );

            color: white;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 18px;

            font-weight: bold;

        }


        #globalNotificationInfo {

            flex: 1;

            min-width: 0;

        }


        #globalNotificationName {

            font-weight: bold;

            font-size: 14px;

            color: #171827;

            white-space: nowrap;

            overflow: hidden;

            text-overflow: ellipsis;

        }


        #globalNotificationMessage {

            margin-top: 4px;

            color: #777;

            font-size: 12px;

            white-space: nowrap;

            overflow: hidden;

            text-overflow: ellipsis;

        }


        #globalNotificationClose {

            width: 28px;

            height: 28px;

            min-width: 28px;

            border: none;

            background: #f2f3f7;

            color: #777;

            border-radius: 50%;

            cursor: pointer;

            font-size: 15px;

        }

    `;

    document.head.appendChild(style);


    /* =====================================================
       إنشاء HTML الإشعار
    ===================================================== */

    function createNotificationElement() {

        if (
            document.getElementById(
                "globalMessageNotification"
            )
        ) {

            return;

        }


        const notification =
            document.createElement("div");

        notification.id =
            "globalMessageNotification";


        notification.innerHTML = `

            <div id="globalNotificationAvatar">
                ؟
            </div>


            <div id="globalNotificationInfo">

                <div id="globalNotificationName">
                    رسالة جديدة
                </div>

                <div id="globalNotificationMessage">
                    لديك رسالة جديدة 💬
                </div>

            </div>


            <button
                id="globalNotificationClose"
                type="button">

                ✕

            </button>

        `;


        document.body.appendChild(
            notification
        );


        /*
           الضغط على الإشعار
        */

        notification.addEventListener(
            "click",
            function (event) {

                /*
                   إذا ضغط على زر الإغلاق
                   لا نفتح الدردشة
                */

                if (
                    event.target.id ===
                    "globalNotificationClose"
                ) {

                    hideNotification();

                    return;

                }


                openNotificationConversation();

            }
        );


        /*
           زر الإغلاق
        */

        document
            .getElementById(
                "globalNotificationClose"
            )
            .addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    hideNotification();

                }
            );

    }


    /* =====================================================
       إخفاء الإشعار
    ===================================================== */

    function hideNotification() {

        const notification =
            document.getElementById(
                "globalMessageNotification"
            );


        if (!notification)
            return;


        notification.classList.remove(
            "show"
        );


        clearTimeout(
            notificationTimer
        );

    }


    /* =====================================================
       إظهار الإشعار
    ===================================================== */

    function showNotification(
        sender,
        message
    ) {

        if (!sender)
            return;


        notificationSender =
            sender;


        const name =
            sender.display_name ||
            "مستخدم";


        const notification =
            document.getElementById(
                "globalMessageNotification"
            );


        const avatar =
            document.getElementById(
                "globalNotificationAvatar"
            );


        const nameElement =
            document.getElementById(
                "globalNotificationName"
            );


        const messageElement =
            document.getElementById(
                "globalNotificationMessage"
            );


        if (!notification)
            return;


        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();


        nameElement.textContent =
            name;


        messageElement.textContent =
            message;


        notification.classList.add(
            "show"
        );


        clearTimeout(
            notificationTimer
        );


        notificationTimer =
            setTimeout(
                function () {

                    hideNotification();

                },
                5000
            );

    }


    /* =====================================================
       إشعار Windows / المتصفح
    ===================================================== */

    async function requestBrowserNotificationPermission() {

        if (
            !("Notification" in window)
        ) {

            return;

        }


        if (
            Notification.permission ===
            "default"
        ) {

            try {

                await Notification.requestPermission();

            }

            catch (error) {

                console.log(
                    "Notification permission error:",
                    error
                );

            }

        }

    }


    /* =====================================================
       إرسال إشعار المتصفح
    ===================================================== */

    function sendBrowserNotification(
        senderName,
        message
    ) {

        if (
            !("Notification" in window)
        ) {

            return;

        }


        if (
            Notification.permission !==
            "granted"
        ) {

            return;

        }


        try {

            const notification =
                new Notification(
                    "💬 " +
                    senderName,
                    {
                        body: message,

                        icon: "icon.png",

                        tag:
                            "englishwords-message-" +
                            Date.now()
                    }
                );


            notification.onclick =
                function () {

                    window.focus();

                    openNotificationConversation();

                    notification.close();

                };

        }

        catch (error) {

            console.log(
                "Browser notification error:",
                error
            );

        }

    }


    /* =====================================================
       معرفة هل نحن داخل نفس المحادثة
    ===================================================== */

    function isSameChat(
        message
    ) {

        /*
           إذا كان chat.html مفتوحًا
           والكود الموجود فيه عنده
           currentConversation
        */

        try {

            if (
                typeof currentConversation !==
                "undefined" &&
                currentConversation &&
                currentConversation.id ===
                message.conversation_id
            ) {

                return true;

            }

        }

        catch (error) {

            /*
               لا يوجد currentConversation
               في الصفحة الحالية
            */

        }


        return false;

    }


    /* =====================================================
       فتح المحادثة عند الضغط على الإشعار
    ===================================================== */

    function openNotificationConversation() {

        hideNotification();


        if (!notificationSender)
            return;


        /*
           إذا كانت الدالة openConversation
           موجودة في chat.html
        */

        try {

            if (
                typeof openConversation ===
                "function"
            ) {

                openConversation(
                    notificationSender
                );

                return;

            }

        }

        catch (error) {

            console.log(
                "openConversation error:",
                error
            );

        }


        /*
           إذا لم نكن في chat.html
           ننتقل إلى صفحة الدردشة
        */

        const userId =
            notificationSender.id;


        if (!userId) {

            window.location.href =
                "chat.html";

            return;

        }


        /*
           نحفظ المستخدم مؤقتًا
           حتى تستطيع chat.html
           فتحه بعد التحميل
        */

        try {

            localStorage.setItem(
                "openChatUserId",
                userId
            );

        }

        catch (error) {

            console.log(
                "localStorage error:",
                error
            );

        }


        window.location.href =
            "chat.html";

    }


    /* =====================================================
       جلب بيانات المرسل
    ===================================================== */

    async function getNotificationSender(
        senderId
    ) {

        /*
           إذا كان لدينا allUsers
           نستخدمه أولًا
        */

        try {

            if (
                typeof allUsers !==
                "undefined" &&
                Array.isArray(allUsers)
            ) {

                const localUser =
                    allUsers.find(
                        user =>
                            user.id ===
                            senderId
                    );


                if (localUser) {

                    return localUser;

                }

            }

        }

        catch (error) {

            console.log(
                "Local users error:",
                error
            );

        }


        /*
           جلب المستخدم من Supabase
        */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, display_name, is_public"
                )
                .eq(
                    "id",
                    senderId
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Get sender profile error:",
                error
            );

            return null;

        }


        return data;

    }


    /* =====================================================
       استقبال الرسائل الجديدة
    ===================================================== */

    function subscribeToNotifications() {

        /*
           منع إنشاء أكثر من قناة
        */

        if (notificationChannel) {

            try {

                supabaseClient.removeChannel(
                    notificationChannel
                );

            }

            catch (error) {

                console.log(error);

            }

        }


        notificationChannel =
            supabaseClient
                .channel(
                    "global-notifications-" +
                    notificationCurrentUser.id +
                    "-" +
                    Date.now()
                )
                .on(

                    "postgres_changes",

                    {

                        event:
                            "INSERT",

                        schema:
                            "public",

                        table:
                            "messages"

                    },

                    async function (payload) {

                        const message =
                            payload.new;


                        /*
                           رسائلنا نحن لا نحتاج
                           إشعار لها
                        */

                        if (
                            message.sender_id ===
                            notificationCurrentUser.id
                        ) {

                            return;

                        }


                        /*
                           إذا كنا داخل نفس
                           المحادثة لا نطلع
                           إشعار منبثق
                        */

                        if (
                            isSameChat(message)
                        ) {

                            return;

                        }


                        /*
                           جلب صاحب الرسالة
                        */

                        const sender =
                            await getNotificationSender(
                                message.sender_id
                            );


                        if (!sender)
                            return;


                        /*
                           حفظه للضغط على الإشعار
                        */

                        notificationSender =
                            sender;


                        /*
                           إشعار داخل الموقع
                        */

                        showNotification(
                            sender,
                            message.message
                        );


                        /*
                           إشعار النظام
                        */

                        sendBrowserNotification(
                            sender.display_name ||
                            "مستخدم",
                            message.message
                        );

                    }

                )
                .subscribe(
                    function (status) {

                        console.log(
                            "Global notifications:",
                            status
                        );

                    }
                );

    }


    /* =====================================================
       تحميل المستخدم الحالي
    ===================================================== */

    async function initNotifications() {

        /*
           نتأكد أن supabase.js
           تم تحميله
        */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "❌ supabaseClient غير موجود. تأكد من تحميل supabase.js قبل notifications.js"
            );

            return;

        }


        /*
           الحصول على المستخدم
        */

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {

            console.error(
                "Notification auth error:",
                error
            );

            return;

        }


        if (!data || !data.user) {

            /*
               المستخدم غير مسجل الدخول
               لذلك لا نشترك في الإشعارات
            */

            return;

        }


        notificationCurrentUser =
            data.user;


        /*
           إنشاء واجهة الإشعار
        */

        createNotificationElement();


        /*
           طلب إذن إشعارات المتصفح
        */

        requestBrowserNotificationPermission();


        /*
           تشغيل Realtime
        */

        subscribeToNotifications();


        console.log(
            "✅ نظام الإشعارات يعمل"
        );

    }


    /* =====================================================
       تنظيف القناة
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        function () {

            if (notificationChannel) {

                try {

                    supabaseClient.removeChannel(
                        notificationChannel
                    );

                }

                catch (error) {

                    console.log(error);

                }

            }

        }
    );


    /* =====================================================
       تشغيل النظام بعد تحميل الصفحة
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                initNotifications();

            }
        );

    }

    else {

        initNotifications();

    }


})();