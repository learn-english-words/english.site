// ==========================================
// جلب الكلمات المحفوظة
// ==========================================

async function loadFavorites() {

    const countElement =
        document.getElementById("favoritesCount");

    const listElement =
        document.getElementById("favoritesList");


    // التأكد من تسجيل الدخول
    const { data: { user }, error: userError } =
        await supabaseClient.auth.getUser();


    if (userError || !user) {

        countElement.textContent =
            "⚠️ يجب تسجيل الدخول أولاً.";

        listElement.innerHTML = `
            <button class="menu-card" onclick="goLogin()">
                <div class="card-icon">🔐</div>

                <div class="card-text">
                    <h3>تسجيل الدخول</h3>
                    <p>سجل دخولك لرؤية كلماتك المحفوظة</p>
                </div>

                <span class="arrow">←</span>
            </button>
        `;

        return;
    }


    // جلب المفضلات الخاصة بالمستخدم
    const { data: favorites, error } =
        await supabaseClient
            .from("favorites")
            .select("word_id")
            .eq("user_id", user.id);


    if (error) {

        console.error(error);

        countElement.textContent =
            "❌ حدث خطأ أثناء تحميل الكلمات.";

        return;
    }


    // لا توجد كلمات
    if (!favorites || favorites.length === 0) {

        countElement.textContent =
            "0 كلمة محفوظة";

        listElement.innerHTML = `
            <div class="menu-card">

                <div class="card-icon">
                    ⭐
                </div>

                <div class="card-text">

                    <h3>لا توجد كلمات محفوظة</h3>

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
    // جلب الكلمات من LocalStorage
    // ==========================================

    const allWords =
        JSON.parse(
            localStorage.getItem("englishWords")
        ) || [];


    const favoriteIds =
        favorites.map(item =>
            String(item.word_id)
        );


    const favoriteWords =
        allWords.filter(word =>
            favoriteIds.includes(String(word.id))
        );


    countElement.textContent =
        favoriteWords.length + " كلمة محفوظة";


    // ==========================================
    // عرض الكلمات
    // ==========================================

    listElement.innerHTML = "";


    if (favoriteWords.length === 0) {

        listElement.innerHTML = `
            <div class="menu-card">

                <div class="card-icon">
                    ⚠️
                </div>

                <div class="card-text">

                    <h3>لم نجد بيانات الكلمات</h3>

                    <p>
                        المفضلة موجودة في حسابك،
                        لكن بيانات الكلمات غير موجودة على هذا الجهاز.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    favoriteWords.forEach(word => {

        const card =
            document.createElement("div");

        card.className =
            "menu-card";


        card.innerHTML = `

            <div class="card-icon">

                ${
                    word.image
                    ? `<img
                        src="${word.image}"
                        style="
                            width:60px;
                            height:60px;
                            object-fit:contain;
                            border-radius:12px;
                        "
                    >`
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

            </div>


            <span class="arrow">
                ★
            </span>

        `;


        listElement.appendChild(card);

    });

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