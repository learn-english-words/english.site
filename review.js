
// ==========================================
// المتغيرات
// ==========================================

let reviewWords = [];

let currentIndex = 0;

let favorite = false;

let currentUser = null;


// ==========================================
// الحصول على المستخدم
// ==========================================

async function getCurrentUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href = "login.html";

        return null;
    }


    currentUser = user;

    return user;
}


// ==========================================
// تحميل كلمات المراجعة الخاصة بالحساب
// ==========================================

async function loadReviewWords() {

    const user = await getCurrentUser();

    if (!user) return;


    // جلب كلمات المراجعة الخاصة بهذا الحساب فقط
    const {
        data: reviewData,
        error: reviewError
    } = await supabaseClient
        .from("review_words")
        .select("id, word_id")
        .eq("user_id", user.id);


    if (reviewError) {

        console.error(
            "Review words error:",
            reviewError
        );

        alert(
            "❌ حدث خطأ أثناء تحميل كلمات المراجعة:\n" +
            reviewError.message
        );

        return;
    }


    // لا توجد كلمات
    if (!reviewData || reviewData.length === 0) {

        reviewWords = [];

        showEmptyReview();

        return;
    }


    // استخراج IDs الكلمات
    const wordIds =
        reviewData.map(item => item.word_id);


    // جلب بيانات الكلمات من جدول words
    const {
        data: wordsData,
        error: wordsError
    } = await supabaseClient
        .from("words")
        .select("*")
        .in("id", wordIds);


    if (wordsError) {

        console.error(
            "Words error:",
            wordsError
        );

        alert(
            "❌ حدث خطأ أثناء تحميل الكلمات:\n" +
            wordsError.message
        );

        return;
    }


    // ترتيب الكلمات حسب ترتيب المراجعة
    reviewWords =
        reviewData
            .map(review => {

                const word =
                    wordsData.find(
                        item =>
                            String(item.id) ===
                            String(review.word_id)
                    );


                if (!word) return null;


                return {
                    ...word,
                    review_id: review.id
                };

            })
            .filter(Boolean);


    if (reviewWords.length === 0) {

        showEmptyReview();

        return;
    }


    currentIndex = 0;

    loadWord();
}


// ==========================================
// عرض عدم وجود كلمات
// ==========================================

function showEmptyReview() {

    const container =
        document.querySelector(".container");


    container.innerHTML = `

        <div style="
            background:white;
            border-radius:22px;
            padding:45px 25px;
            text-align:center;
            box-shadow:0 8px 30px rgba(20,30,50,.07);
        ">

            <div style="
                font-size:70px;
                margin-bottom:15px;
            ">
                🎉
            </div>

            <h2 style="
                margin-bottom:12px;
                color:#172033;
            ">
                ما عندك كلمات تحتاج مراجعة
            </h2>

            <p style="
                color:#8992a3;
                line-height:1.8;
                margin-bottom:25px;
            ">
                ممتاز! استمر في تعلم الكلمات
                وستظهر هنا الكلمات التي تحتاج إلى مراجعة.
            </p>

            <button
                onclick="goBack()"
                style="
                    border:none;
                    background:#3478f6;
                    color:white;
                    padding:15px 25px;
                    border-radius:14px;
                    font-size:16px;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                📚 تعلم الكلمات
            </button>

        </div>

    `;
}


// ==========================================
// تحميل الكلمة الحالية
// ==========================================

function loadWord() {

    const word =
        reviewWords[currentIndex];


    if (!word) {

        finishReview();

        return;
    }


    // الصورة

    const imageBox =
        document.getElementById("wordImage");


    if (word.image) {

        imageBox.innerHTML = `

            <img
                src="${word.image}"
                alt="${word.english}"
            >

        `;

    } else {

        imageBox.textContent =
            word.emoji || "🖼️";
    }


    // الإنجليزية

    document.getElementById(
        "englishWord"
    ).textContent =
        word.english || "";


    // العربية

    document.getElementById(
        "arabicWord"
    ).textContent =
        word.arabic || "";


    // المثال

    document.getElementById(
        "exampleText"
    ).textContent =
        word.example || "";


    document.getElementById(
        "exampleArabic"
    ).textContent =
        word.exampleArabic || "";


    // التقدم

    const number =
        currentIndex + 1;


    const total =
        reviewWords.length;


    document.getElementById(
        "progressText"
    ).textContent =
        `${number} / ${total}`;


    const percent =
        (number / total) * 100;


    document.getElementById(
        "progressFill"
    ).style.width =
        percent + "%";


    // إعادة زر المفضلة

    favorite = false;


    const favoriteBtn =
        document.getElementById(
            "favoriteBtn"
        );


    if (favoriteBtn) {

        favoriteBtn.classList.remove("active");

        favoriteBtn.innerHTML =
            "☆ <span>حفظ</span>";
    }


    checkFavorite();
}


// ==========================================
// التحقق من المفضلة
// ==========================================

async function checkFavorite() {

    const word =
        reviewWords[currentIndex];


    if (!word || !word.id) return;


    const user =
        currentUser || await getCurrentUser();


    if (!user) return;


    const {
        data,
        error
    } = await supabaseClient
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("word_id", word.id)
        .maybeSingle();


    if (error) {

        console.error(
            "Favorite error:",
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
// النطق
// ==========================================

function speakWord() {

    const word =
        reviewWords[currentIndex];


    if (!word || !word.english) return;


    const speech =
        new SpeechSynthesisUtterance(
            word.english
        );


    speech.lang = "en-US";

    speech.rate = 0.8;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(speech);
}


// ==========================================
// أعرف / لا أعرف
// ==========================================

async function answer(known) {

    const word =
        reviewWords[currentIndex];


    if (!word) return;


    // ==========================================
    // إذا عرفها الآن
    // نحذفها من مراجعة هذا الحساب فقط
    // ==========================================

    if (known) {

        const user =
            currentUser || await getCurrentUser();


        if (!user) return;


        const {
            error
        } = await supabaseClient
            .from("review_words")
            .delete()
            .eq("user_id", user.id)
            .eq("word_id", word.id);


        if (error) {

            console.error(error);

            alert(
                "❌ حدث خطأ أثناء إزالة الكلمة من المراجعة."
            );

            return;
        }


        // حذفها من القائمة الحالية
        reviewWords =
            reviewWords.filter(
                item =>
                    String(item.id) !==
                    String(word.id)
            );


        // إذا خلصت
        if (reviewWords.length === 0) {

            finishReview();

            return;
        }


        // تصحيح index

        if (
            currentIndex >=
            reviewWords.length
        ) {

            currentIndex =
                reviewWords.length - 1;
        }


        loadWord();

        return;
    }


    // ==========================================
    // إذا ما زال ما يعرفها
    // تبقى في Supabase وننتقل للتالية
    // ==========================================

    nextWord();
}


// ==========================================
// الكلمة التالية
// ==========================================

function nextWord() {

    if (reviewWords.length === 0) {

        finishReview();

        return;
    }


    if (
        currentIndex <
        reviewWords.length - 1
    ) {

        currentIndex++;

        loadWord();

        return;
    }


    // نرجع لأول كلمة
    currentIndex = 0;

    loadWord();
}


// ==========================================
// حفظ / إزالة من المفضلة
// ==========================================

async function toggleFavorite() {

    const button =
        document.getElementById(
            "favoriteBtn"
        );


    const user =
        currentUser || await getCurrentUser();


    if (!user) return;


    const word =
        reviewWords[currentIndex];


    if (!word || !word.id) {

        alert(
            "⚠️ لا يمكن حفظ هذه الكلمة."
        );

        return;
    }


    // إزالة

    if (favorite) {

        const {
            error
        } = await supabaseClient
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("word_id", word.id);


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


    // حفظ

    const {
        error
    } = await supabaseClient
        .from("favorites")
        .insert({

            user_id: user.id,

            word_id: word.id

        });


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
// انتهاء المراجعة
// ==========================================

function finishReview() {

    const container =
        document.querySelector(
            ".container"
        );


    container.innerHTML = `

        <div style="
            background:white;
            border-radius:22px;
            padding:45px 25px;
            text-align:center;
            box-shadow:0 8px 30px rgba(20,30,50,.07);
        ">

            <div style="
                font-size:75px;
                margin-bottom:15px;
            ">
                🎉
            </div>

            <h1 style="
                color:#172033;
                margin-bottom:12px;
            ">
                أحسنت!
            </h1>

            <p style="
                color:#8992a3;
                line-height:1.8;
                margin-bottom:25px;
            ">
                راجعت كل الكلمات التي كانت تحتاج إلى تثبيت.
            </p>

            <button
                onclick="goBack()"
                style="
                    border:none;
                    background:#3478f6;
                    color:white;
                    padding:15px 28px;
                    border-radius:14px;
                    font-size:16px;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                📚 العودة لتعلم الكلمات
            </button>

        </div>

    `;
}


// ==========================================
// رجوع
// ==========================================

function goBack() {

    window.location.href =
        "index.html";
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

(async function () {

    await loadReviewWords();

})();

