// ==========================================
// جلب الكلمات المحفوظة
// ==========================================

async function loadFavorites() {

    const countElement =
        document.getElementById("favoritesCount");

    const listElement =
        document.getElementById("favoritesList");


    // ==========================================
    // التأكد من تسجيل الدخول
    // ==========================================

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        countElement.textContent =
            "⚠️ يجب تسجيل الدخول أولاً.";

        listElement.innerHTML = `
            <button class="menu-card" onclick="goLogin()">

                <div class="card-icon">
                    🔐
                </div>

                <div class="card-text">

                    <h3>تسجيل الدخول</h3>

                    <p>
                        سجل دخولك لرؤية كلماتك المحفوظة
                    </p>

                </div>

                <span class="arrow">
                    ←
                </span>

            </button>
        `;

        return;
    }


    // ==========================================
    // جلب الكلمات المحفوظة
    // ==========================================

    const {
        data: favorites,
        error
    } = await supabaseClient
        .from("favorites")
        .select(`
            id,
            word_id,
            words (
                id,
                english,
                arabic,
                level,
                category,
                image,
                example,
                exampleArabic
            )
        `)
        .eq("user_id", user.id);


    // ==========================================
    // خطأ
    // ==========================================

    if (error) {

        console.error(
            "Favorites error:",
            error
        );

        countElement.textContent =
            "❌ حدث خطأ أثناء تحميل الكلمات.";

        listElement.innerHTML = `
            <div class="menu-card">

                <div class="card-icon">
                    ⚠️
                </div>

                <div class="card-text">

                    <h3>حدث خطأ</h3>

                    <p>
                        ${error.message}
                    </p>

                </div>

            </div>
        `;

        return;
    }


    // ==========================================
    // لا توجد كلمات
    // ==========================================

    if (!favorites || favorites.length === 0) {

        countElement.textContent =
            "0 كلمة محفوظة";

        listElement.innerHTML = `
            <div class="menu-card">

                <div class="card-icon">
                    ⭐
                </div>

                <div class="card-text">

                    <h3>
                        لا توجد كلمات محفوظة
                    </h3>

                    <p>
                        عندما تضغط ⭐ حفظ على أي كلمة،
                        ستظهر هنا.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    // ==========================================
    // استخراج الكلمات فقط
    // ==========================================

    const favoriteWords = favorites
        .map(item => item.words)
        .filter(word => word);


    countElement.textContent =
        favoriteWords.length + " كلمة محفوظة";


    listElement.innerHTML = "";


    // ==========================================
    // عرض الكلمات
    // ==========================================

    favoriteWords.forEach((word, index) => {

        const card =
            document.createElement("div");


        card.className =
            "menu-card";


        // يجعل البطاقة قابلة للضغط
        card.style.cursor = "pointer";


        card.innerHTML = `

            <div class="card-icon">

                ${
                    word.image

                    ? `
                        <img
                            src="${word.image}"
                            alt="${word.english}"
                            style="
                                width:60px;
                                height:60px;
                                object-fit:contain;
                                border-radius:12px;
                            "
                        >
                    `

                    : "⭐"
                }

            </div>


            <div class="card-text">

                <h3>
                    ${word.english}
                </h3>

                <p>
                    ${word.arabic}
                </p>

                <small>
                    ${word.level || ""}
                </small>

            </div>


            <span class="arrow">
                →
            </span>

        `;


        // ==========================================
        // عند الضغط على الكلمة
        // ==========================================

        card.addEventListener("click", function () {

            openFavoriteWord(index);

        });


        listElement.appendChild(card);

    });


    // حفظ الكلمات مؤقتًا لاستخدامها في صفحة المراجعة

    window.favoriteWords =
        favoriteWords;
}


// ==========================================
// فتح صفحة مراجعة الكلمات المحفوظة
// ==========================================

function openFavoriteWord(index) {

    const favoriteWords =
        window.favoriteWords || [];


    if (!favoriteWords.length) return;


    localStorage.setItem(
        "favoriteReviewWords",
        JSON.stringify(favoriteWords)
    );


    localStorage.setItem(
        "favoriteReviewIndex",
        index
    );


    window.location.href =
        "favorite-review.html";
}


// ==========================================
// الرئيسية
// ==========================================

function goHome() {

    window.location.href =
        "index.html";

}


// ==========================================
// تسجيل الدخول
// ==========================================

function goLogin() {

    window.location.href =
        "login.html";

}


// ==========================================
// تشغيل
// ==========================================

loadFavorites();