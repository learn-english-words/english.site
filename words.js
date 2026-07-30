
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


    // لازم يكون مسجل دخول
    if (userError || !user) {

        alert("⚠️ يجب تسجيل الدخول أولاً.");

        window.location.href = "login.html";

        return;
    }


    const { data, error } =
        await supabaseClient
            .from("words")
            .select("*")
            .eq("level", selectedLevel)
            .eq("category", selectedCategory)
            .order("created_at", {
                ascending: true
            });


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


    // ==========================================
    // إذا ما فيه كلمات
    // ==========================================

    if (words.length === 0) {

        alert(
            "ما فيه كلمات بهذا المستوى والتصنيف حتى الآن."
        );

        window.location.href =
            "learn.html";

        return;
    }


    // تحميل أول كلمة

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
                alt="${word.english}"
                style="
                    width:100%;
                    height:100%;
                    object-fit:contain;
                    border-radius:20px;
                "
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
        word.english;


    // ==========================================
    // العربية
    // ==========================================

    document.getElementById(
        "arabicWord"
    ).textContent =
        word.arabic;


    // ==========================================
    // المثال
    // ==========================================

    document.getElementById(
        "exampleText"
    ).textContent =
        word.example || "";


    document.getElementById(
        "exampleArabic"
    ).textContent =
        word.exampleArabic || "";


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
    // إعادة زر الحفظ
    // ==========================================

    favorite = false;


    const favoriteBtn =
        document.getElementById(
            "favoriteBtn"
        );


    if (favoriteBtn) {

        favoriteBtn.classList.remove(
            "active"
        );


        favoriteBtn.innerHTML =
            "☆ <span>حفظ</span>";
    }


    // التأكد هل الكلمة محفوظة

    checkFavorite();
}


// ==========================================
// التحقق من الكلمة المحفوظة
// ==========================================

async function checkFavorite() {

    const word =
        words[currentIndex];


    if (!word || !word.id) return;


    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


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

            button.classList.add(
                "active"
            );


            button.innerHTML =
                "★ <span>محفوظة</span";
        }
    }
}


// ==========================================
// النطق
// ==========================================

function speakWord() {

    const word =
        words[currentIndex];


    if (!word) return;


    const speech =
        new SpeechSynthesisUtterance(
            word.english
        );


    speech.lang =
        "en-US";


    speech.rate =
        0.8;


    window.speechSynthesis.cancel();


    window.speechSynthesis.speak(
        speech
    );
}

async function answer(known) {


const word =
    words[currentIndex];


if (!word || !word.id) {
    return;
}


// ==========================================
// الحصول على الحساب الحالي
// ==========================================

const {
    data: { user },
    error: userError
} =
    await supabaseClient.auth.getUser();


if (userError || !user) {

    alert(
        "⚠️ يجب تسجيل الدخول أولاً."
    );

    window.location.href =
        "login.html";

    return;
}


// ==========================================
// ✅ أعرف الكلمة
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
        "Code: " + (learnedError.code || "") + "\n\n" +
        "Message: " + (learnedError.message || "") + "\n\n" +
        "Details: " + (learnedError.details || "") + "\n\n" +
        "Hint: " + (learnedError.hint || "")
    );

    return;
}

}


// ==========================================
// ❌ لا أعرف الكلمة
// ==========================================

if (!known) {

    const {
        data: existing,
        error: checkError
    } =
        await supabaseClient
            .from("review_words")
            .select("id")
            .eq(
                "user_id",
                user.id
            )
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


    // إذا غير موجودة، أضفها

    if (!existing) {

        const {
            error: insertError
        } =
            await supabaseClient
                .from("review_words")
                .insert({

                    user_id:
                        user.id,

                    word_id:
                        String(word.id)

                });


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


// ==========================================
// الانتقال للكلمة التالية
// ==========================================

nextWord();

}

// ==========================================
// حفظ / إزالة من المفضلة
// ==========================================

async function toggleFavorite() {

    const button =
        document.getElementById(
            "favoriteBtn"
        );


    // التأكد من تسجيل الدخول

    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


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
    // إذا كانت محفوظة → حذف
    // ==========================================

    if (favorite) {

        const { error } =
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


        button.classList.remove(
            "active"
        );


        button.innerHTML =
            "☆ <span>حفظ</span>";


        return;
    }


    // ==========================================
    // حفظ الكلمة
    // ==========================================

    const { error } =
        await supabaseClient
            .from("favorites")
            .insert({

                user_id: user.id,

                word_id: word.id

            });


    if (error) {

        // موجودة مسبقًا

        if (
            error.code ===
            "23505"
        ) {

            favorite = true;


            button.classList.add(
                "active"
            );


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


    button.classList.add(
        "active"
    );


    button.innerHTML =
        "★ <span>محفوظة</span>";
}


// ==========================================
// التالي
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


function goHome() {

    window.location.href =
        "index.html";
}


// ==========================================
// تشغيل
// ==========================================

loadWords();

