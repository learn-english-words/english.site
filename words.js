// ==========================================
// المتغيرات
// ==========================================

let words = [];

let currentIndex = 0;

let favorite = false;


// ==========================================
// قراءة اختيار المستخدم
// ==========================================

const selectedLevel =
    localStorage.getItem("selectedLevel");

const selectedCategory =
    localStorage.getItem("selectedCategory");


// ==========================================
// جلب الكلمات من Supabase
// ==========================================

async function loadWords() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        alert("⚠️ يجب تسجيل الدخول أولاً.");

        window.location.href = "login.html";

        return;
    }


    const {
        data,
        error
    } = await supabaseClient

        .from("words")

        .select("*")

        .eq("level", selectedLevel)

        .eq("category", selectedCategory)

        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Supabase error:",
            error
        );

        alert(
            "❌ حدث خطأ أثناء تحميل الكلمات."
        );

        return;
    }


    words = data || [];


    if (words.length === 0) {

        alert(
            "ما فيه كلمات بهذا المستوى والتصنيف حتى الآن."
        );

        window.location.href = "learn.html";

        return;
    }


    loadWord();
}


// ==========================================
// تحميل الكلمة
// ==========================================

function loadWord() {

    const word =
        words[currentIndex];


    if (!word) return;


    // ==========================================
    // الصورة
    // ==========================================

    const imageBox =
        document.getElementById("wordEmoji");


    if (word.image) {

        imageBox.innerHTML = `

            <img
                src="${word.image}"
                alt="${word.english || ""}"
            >

        `;

    } else {

        imageBox.textContent =
            word.emoji || "🖼️";

    }


    // ==========================================
    // الإنجليزية
    // ==========================================

    document.getElementById(
        "englishWord"
    ).textContent =
        word.english || "";


    // ==========================================
    // العربية
    // ==========================================

    const arabicWord =
        document.getElementById("arabicWord");


    if (arabicWord) {

        arabicWord.textContent =
            word.arabic || "";

    }


    // ==========================================
    // إخفاء ترجمة الكلمة
    // ==========================================

    hideTranslation();


    // ==========================================
    // المثال
    // ==========================================

    document.getElementById(
        "exampleText"
    ).textContent =
        word.example || "";


    const exampleArabic =
        document.getElementById("exampleArabic");


    if (exampleArabic) {

        exampleArabic.textContent =
            word.exampleArabic || "";

    }


    // ==========================================
    // إخفاء ترجمة المثال
    // ==========================================

    hideExampleTranslation();


    // ==========================================
    // التقدم
    // ==========================================

    const number =
        currentIndex + 1;


    document.getElementById(
        "progressText"
    ).textContent =
        number + " / " + words.length;


    const percent =
        (number / words.length) * 100;


    document.getElementById(
        "progressFill"
    ).style.width =
        percent + "%";


    // ==========================================
    // إيقاف النطق السابق
    // ==========================================

    if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

    }


    // ==========================================
    // إعادة زر المفضلة
    // ==========================================

    favorite = false;


    const favoriteBtn =
        document.getElementById("favoriteBtn");


    if (favoriteBtn) {

        favoriteBtn.classList.remove("active");

        favoriteBtn.innerHTML =
            "☆ <span>حفظ</span>";

    }


    checkFavorite();
}


// ==========================================
// إظهار / إخفاء ترجمة الكلمة
// ==========================================

function toggleTranslation() {

    const translation =
        document.getElementById("arabicWord");

    const button =
        document.getElementById("translationBtn");


    if (!translation || !button) return;


    const isHidden =
        translation.classList.contains(
            "hidden-translation"
        );


    if (isHidden) {

        translation.classList.remove(
            "hidden-translation"
        );


        button.textContent =
            "🙈 إخفاء الترجمة";


    } else {

        translation.classList.add(
            "hidden-translation"
        );


        button.textContent =
            "👁️ إظهار الترجمة";

    }

}


// ==========================================
// إخفاء ترجمة الكلمة
// ==========================================

function hideTranslation() {

    const translation =
        document.getElementById("arabicWord");

    const button =
        document.getElementById("translationBtn");


    if (translation) {

        translation.classList.add(
            "hidden-translation"
        );

    }


    if (button) {

        button.textContent =
            "👁️ إظهار الترجمة";

    }

}


// ==========================================
// إظهار / إخفاء ترجمة المثال
// ==========================================

function toggleExampleTranslation() {

    const translation =
        document.getElementById("exampleArabic");

    const button =
        document.getElementById(
            "exampleTranslationBtn"
        );


    if (!translation || !button) return;


    const isHidden =
        translation.classList.contains(
            "hidden-translation"
        );


    if (isHidden) {

        translation.classList.remove(
            "hidden-translation"
        );


        button.textContent =
            "🙈 إخفاء الترجمة";


    } else {

        translation.classList.add(
            "hidden-translation"
        );


        button.textContent =
            "👁️ إظهار الترجمة";

    }

}


// ==========================================
// إخفاء ترجمة المثال
// ==========================================

function hideExampleTranslation() {

    const translation =
        document.getElementById("exampleArabic");

    const button =
        document.getElementById(
            "exampleTranslationBtn"
        );


    if (translation) {

        translation.classList.add(
            "hidden-translation"
        );

    }


    if (button) {

        button.textContent =
            "👁️ إظهار الترجمة";

    }

}


// ==========================================
// التحقق من المفضلة
// ==========================================

async function checkFavorite() {

    const word =
        words[currentIndex];


    if (!word || !word.id) return;


    const {
        data: { user }
    } =
        await supabaseClient
            .auth
            .getUser();


    if (!user) return;


    const {
        data,
        error
    } =
        await supabaseClient

            .from("favorites")

            .select("id")

            .eq("user_id", user.id)

            .eq("word_id", word.id)

            .maybeSingle();


    if (error) {

        console.error(
            "Favorite check error:",
            error
        );

        return;
    }


    if (data) {

        favorite = true;


        const button =
            document.getElementById(
                "favoriteBtn"
            );


        if (button) {

            button.classList.add("active");

            button.innerHTML =
                "★ <span>محفوظة</span>";

        }

    }

}


// ==========================================
// نطق الكلمة
// ==========================================

function speakWord() {

    const word =
        words[currentIndex];


    if (!word || !word.english) return;


    if (!("speechSynthesis" in window)) {

        alert(
            "⚠️ جهازك لا يدعم النطق الصوتي."
        );

        return;
    }


    const speech =
        new SpeechSynthesisUtterance(
            word.english
        );


    speech.lang = "en-US";

    speech.rate = 0.8;

    speech.pitch = 1;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(
        speech
    );

}


// ==========================================
// نطق الجملة
// ==========================================

function speakExample() {

    const word =
        words[currentIndex];


    if (!word || !word.example) {

        alert(
            "⚠️ لا توجد جملة لهذه الكلمة."
        );

        return;
    }


    if (!("speechSynthesis" in window)) {

        alert(
            "⚠️ جهازك لا يدعم النطق الصوتي."
        );

        return;
    }


    const speech =
        new SpeechSynthesisUtterance(
            word.example
        );


    speech.lang = "en-US";

    speech.rate = 0.8;

    speech.pitch = 1;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(
        speech
    );

}


// ==========================================
// نطق الجملة ببطء
// ==========================================

function speakExampleSlow() {

    const word =
        words[currentIndex];


    if (!word || !word.example) {

        alert(
            "⚠️ لا توجد جملة لهذه الكلمة."
        );

        return;
    }


    if (!("speechSynthesis" in window)) {

        alert(
            "⚠️ جهازك لا يدعم النطق الصوتي."
        );

        return;
    }


    const speech =
        new SpeechSynthesisUtterance(
            word.example
        );


    speech.lang = "en-US";

    speech.rate = 0.5;

    speech.pitch = 1;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(
        speech
    );

}


// ==========================================
// أعرف / لا أعرف
// ==========================================

async function answer(known) {

    const word =
        words[currentIndex];


    if (!word || !word.id) return;


    const {
        data: { user },
        error: userError
    } =
        await supabaseClient
            .auth
            .getUser();


    if (userError || !user) {

        alert(
            "⚠️ يجب تسجيل الدخول أولاً."
        );

        window.location.href =
            "login.html";

        return;
    }


    // ==========================================
    // أعرف الكلمة
    // ==========================================

    if (known) {

        const {
            error: learnedError
        } =
            await supabaseClient

                .from("learned_words")

                .upsert(

                    {
                        user_id: user.id,

                        word_id: String(word.id)
                    },

                    {
                        onConflict:
                            "user_id,word_id"
                    }

                );


        if (learnedError) {

            console.error(
                "Learned word error:",
                learnedError
            );

            alert(
                "❌ خطأ Supabase:\n\n" +
                "Code: " +
                (learnedError.code || "") +
                "\n\nMessage: " +
                (learnedError.message || "") +
                "\n\nDetails: " +
                (learnedError.details || "") +
                "\n\nHint: " +
                (learnedError.hint || "")
            );

            return;
        }

    }


    // ==========================================
    // لا أعرف الكلمة
    // ==========================================

    if (!known) {

        const {
            data: existing,
            error: checkError
        } =
            await supabaseClient

                .from("review_words")

                .select("id")

                .eq("user_id", user.id)

                .eq(
                    "word_id",
                    String(word.id)
                )

                .maybeSingle();


        if (checkError) {

            console.error(
                "Review check error:",
                checkError
            );

            alert(
                "❌ حدث خطأ أثناء التحقق من كلمة المراجعة:\n" +
                checkError.message
            );

            return;
        }


        if (!existing) {

            const {
                error: insertError
            } =
                await supabaseClient

                    .from("review_words")

                    .insert(

                        {
                            user_id: user.id,

                            word_id:
                                String(word.id)
                        }

                    );


            if (insertError) {

                console.error(
                    "Review insert error:",
                    insertError
                );

                alert(
                    "❌ حدث خطأ أثناء حفظ الكلمة للمراجعة:\n" +
                    insertError.message
                );

                return;
            }

        }

    }


    nextWord();

}


// ==========================================
// حفظ / إزالة المفضلة
// ==========================================

async function toggleFavorite() {

    const button =
        document.getElementById(
            "favoriteBtn"
        );


    const {
        data: { user },
        error: userError
    } =
        await supabaseClient
            .auth
            .getUser();


    if (userError || !user) {

        alert(
            "⚠️ يجب تسجيل الدخول أولاً."
        );

        window.location.href =
            "login.html";

        return;
    }


    const word =
        words[currentIndex];


    if (!word || !word.id) {

        alert(
            "⚠️ لا يمكن حفظ هذه الكلمة."
        );

        return;
    }


    // ==========================================
    // إزالة من المفضلة
    // ==========================================

    if (favorite) {

        const {
            error
        } =
            await supabaseClient

                .from("favorites")

                .delete()

                .eq(
                    "user_id",
                    user.id
                )

                .eq(
                    "word_id",
                    word.id
                );


        if (error) {

            console.error(error);

            alert(
                "❌ حدث خطأ أثناء إزالة الكلمة."
            );

            return;
        }


        favorite = false;

        button.classList.remove("active");

        button.innerHTML =
            "☆ <span>حفظ</span>";

        return;
    }


    // ==========================================
    // حفظ
    // ==========================================

    const {
        error
    } =
        await supabaseClient

            .from("favorites")

            .insert(

                {
                    user_id: user.id,

                    word_id: word.id
                }

            );


    if (error) {

        if (error.code === "23505") {

            favorite = true;

            button.classList.add("active");

            button.innerHTML =
                "★ <span>محفوظة</span>";

            return;
        }


        console.error(error);

        alert(
            "❌ حدث خطأ أثناء حفظ الكلمة."
        );

        return;
    }


    favorite = true;

    button.classList.add("active");

    button.innerHTML =
        "★ <span>محفوظة</span>";

}


// ==========================================
// الكلمة التالية
// ==========================================

function nextWord() {

    if (
        currentIndex <
        words.length - 1
    ) {

        currentIndex++;

        loadWord();

    } else {

        alert(
            "🎉 أحسنت! أنهيت كلمات هذا التصنيف."
        );

        currentIndex = 0;

        loadWord();

    }

}


// ==========================================
// رجوع
// ==========================================

function goBack() {

    window.location.href =
        "learn.html";

}


// ==========================================
// الرئيسية
// ==========================================

function goHome() {

    window.location.href =
        "index.html";

}


// ==========================================
// التشغيل
// ==========================================

loadWords();