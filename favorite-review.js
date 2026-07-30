// ==========================================
// الكلمات المحفوظة
// ==========================================

let favoriteWords = [];

let currentIndex = 0;


// ==========================================
// قراءة الكلمات المحفوظة
// ==========================================

function loadFavoriteWords() {

    const saved =
        localStorage.getItem("favoriteReviewWords");


    if (!saved) {

        alert("⚠️ لا توجد كلمات للمراجعة.");

        window.location.href =
            "favorites.html";

        return;
    }


    try {

        favoriteWords =
            JSON.parse(saved);

    } catch (error) {

        console.error(error);

        alert("❌ حدث خطأ في تحميل الكلمات.");

        window.location.href =
            "favorites.html";

        return;
    }


    if (
        !Array.isArray(favoriteWords) ||
        favoriteWords.length === 0
    ) {

        alert("⚠️ لا توجد كلمات للمراجعة.");

        window.location.href =
            "favorites.html";

        return;
    }


    // الكلمة التي ضغط عليها المستخدم

    const savedIndex =
        Number(
            localStorage.getItem(
                "favoriteReviewIndex"
            )
        );


    if (
        !isNaN(savedIndex) &&
        savedIndex >= 0 &&
        savedIndex < favoriteWords.length
    ) {

        currentIndex =
            savedIndex;

    } else {

        currentIndex = 0;

    }


    loadWord();
}


// ==========================================
// تحميل الكلمة
// ==========================================

function loadWord() {

    const word =
        favoriteWords[currentIndex];


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
            "🖼️";

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

    document.getElementById(
        "arabicWord"
    ).textContent =
        word.arabic || "";


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
        number +
        " / " +
        favoriteWords.length;


    const percent =
        (number / favoriteWords.length) * 100;


    document.getElementById(
        "progressFill"
    ).style.width =
        percent + "%";


    // ==========================================
    // زر المحفوظة
    // ==========================================

    const button =
        document.getElementById(
            "favoriteBtn"
        );


    button.classList.add("active");


    button.innerHTML =
        "★ <span>محفوظة</span>";
}


// ==========================================
// النطق
// ==========================================

function speakWord() {

    const word =
        favoriteWords[currentIndex];


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


// ==========================================
// إزالة من المحفوظة
// ==========================================

async function removeFavorite() {

    const word =
        favoriteWords[currentIndex];


    if (!word || !word.id) return;


    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (
        userError ||
        !user
    ) {

        alert(
            "⚠️ يجب تسجيل الدخول أولاً."
        );

        return;
    }


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


    // حذفها من القائمة الحالية

    favoriteWords.splice(
        currentIndex,
        1
    );


    // ==========================================
    // إذا ما بقيت كلمات
    // ==========================================

    if (
        favoriteWords.length === 0
    ) {

        localStorage.removeItem(
            "favoriteReviewWords"
        );

        localStorage.removeItem(
            "favoriteReviewIndex"
        );


        alert(
            "⭐ تمت إزالة آخر كلمة محفوظة."
        );


        window.location.href =
            "favorites.html";

        return;
    }


    // إذا حذفنا آخر كلمة
    if (
        currentIndex >=
        favoriteWords.length
    ) {

        currentIndex =
            favoriteWords.length - 1;

    }


    // تحديث التخزين

    localStorage.setItem(
        "favoriteReviewWords",
        JSON.stringify(
            favoriteWords
        )
    );


    localStorage.setItem(
        "favoriteReviewIndex",
        currentIndex
    );


    loadWord();
}


// ==========================================
// الكلمة التالية
// ==========================================

function nextWord() {

    if (
        currentIndex <
        favoriteWords.length - 1
    ) {

        currentIndex++;

    } else {

        currentIndex = 0;

    }


    localStorage.setItem(
        "favoriteReviewIndex",
        currentIndex
    );


    loadWord();
}


// ==========================================
// الرجوع إلى كلماتي
// ==========================================

function goBack() {

    window.location.href =
        "favorites.html";

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

loadFavoriteWords();