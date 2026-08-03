// =========================================================
// EnglishWords — صفحة اختيار المستوى والتصنيف
// =========================================================


// =========================================================
// المتغيرات
// =========================================================

let selectedLevel = null;
let selectedCategory = null;


// =========================================================
// التصنيفات القديمة
// مهم جدًا:
// لا نحذفها لأن الكلمات القديمة في words تستخدم هذه القيم
// =========================================================

const oldCategories = [

    {
        key: "home",
        name_ar: "المنزل",
        name_en: "Home",
        icon: "🏠"
    },

    {
        key: "food",
        name_ar: "الطعام",
        name_en: "Food",
        icon: "🍔"
    },

    {
        key: "cars",
        name_ar: "السيارات",
        name_en: "Cars",
        icon: "🚗"
    },

    {
        key: "clothes",
        name_ar: "الملابس",
        name_en: "Clothes",
        icon: "👕"
    },

    {
        key: "family",
        name_ar: "العائلة",
        name_en: "Family",
        icon: "👨‍👩‍👧"
    },

    {
        key: "nature",
        name_ar: "الطبيعة",
        name_en: "Nature",
        icon: "🌳"
    },

    {
        key: "animals",
        name_ar: "الحيوانات",
        name_en: "Animals",
        icon: "🐾"
    },

    {
        key: "colors",
        name_ar: "الألوان",
        name_en: "Colors",
        icon: "🎨"
    }

];


// =========================================================
// التصنيفات النهائية
// سيتم دمج القديمة مع القادمة من Supabase
// =========================================================

let categories = [
    ...oldCategories
];


// =========================================================
// عند فتح الصفحة
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadCategories();

        restoreSelections();

    }
);


// =========================================================
// تحميل التصنيفات
// =========================================================
// القديمة + الجديدة من Supabase
// =========================================================

async function loadCategories() {

    const container =
        document.getElementById(
            "categoriesContainer"
        );


    if (!container) {

        console.error(
            "❌ لم يتم العثور على categoriesContainer"
        );

        return;
    }


    // نبدأ بالتصنيفات القديمة
    categories = [
        ...oldCategories
    ];


    container.innerHTML = `

        <div class="loading-categories">

            <span>⏳</span>

            جاري تحميل التصنيفات...

        </div>

    `;


    try {

        // =================================================
        // جلب التصنيفات من Supabase
        // =================================================

        const {
            data,
            error
        } =
            await supabaseClient

                .from("categories")

                .select(
                    "id, name_ar, name_en, icon, created_at"
                )

                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "❌ خطأ في تحميل التصنيفات من Supabase:",
                error
            );


            // إذا فشل Supabase
            // نعرض التصنيفات القديمة بدل ترك الصفحة فارغة

            renderCategories();

            return;
        }


        // =================================================
        // إضافة التصنيفات الجديدة
        // =================================================

        if (
            data &&
            Array.isArray(data)
        ) {

            data.forEach(
                function (category) {

                    const nameEn =
                        String(
                            category.name_en || ""
                        )
                            .trim()
                            .toLowerCase();


                    const nameAr =
                        String(
                            category.name_ar || ""
                        )
                            .trim();


                    if (!nameEn) {

                        return;

                    }


                    // =================================================
                    // منع تكرار التصنيف
                    // =================================================

                    const alreadyExists =
                        categories.some(
                            function (item) {

                                return (
                                    String(
                                        item.key
                                    )
                                        .toLowerCase() ===
                                    nameEn
                                );

                            }
                        );


                    if (alreadyExists) {

                        return;

                    }


                    categories.push({

                        key:
                            nameEn,

                        name_ar:
                            nameAr,

                        name_en:
                            nameEn,

                        icon:
                            category.icon ||
                            "📚",

                        id:
                            category.id

                    });

                }
            );

        }


        // =================================================
        // عرض التصنيفات
        // =================================================

        renderCategories();


    } catch (error) {

        console.error(
            "❌ خطأ غير متوقع أثناء تحميل التصنيفات:",
            error
        );


        // نعرض القديمة حتى لو صار خطأ

        renderCategories();

    }

}


// =========================================================
// عرض التصنيفات على الصفحة
// =========================================================

function renderCategories() {

    const container =
        document.getElementById(
            "categoriesContainer"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        !categories ||
        categories.length === 0
    ) {

        container.innerHTML = `

            <div class="loading-categories">

                📂 لا توجد تصنيفات حاليًا.

            </div>

        `;


        return;

    }


    categories.forEach(
        function (category) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "category-card";


            // =================================================
            // مهم جدًا
            // هذه القيمة هي التي ستذهب إلى words.category
            // =================================================

            button.dataset.category =
                category.key;


            button.onclick =
                function () {

                    selectCategory(
                        this,
                        category.key
                    );

                };


            button.innerHTML = `

                <div class="category-icon">

                    ${escapeHtml(
                        category.icon
                    )}

                </div>


                <div class="category-info">

                    <strong>

                        ${escapeHtml(
                            category.name_ar
                        )}

                    </strong>


                    <small>

                        ${escapeHtml(
                            category.name_en
                        )}

                    </small>

                </div>


                <span class="category-check">

                    ✓

                </span>

            `;


            container.appendChild(
                button
            );

        }
    );

}


// =========================================================
// حماية النصوص
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// اختيار المستوى
// =========================================================

function selectLevel(
    element,
    level
) {

    document
        .querySelectorAll(
            ".level-card"
        )
        .forEach(
            function (card) {

                card.classList.remove(
                    "selected"
                );

            }
        );


    element.classList.add(
        "selected"
    );


    selectedLevel =
        level;


    localStorage.setItem(
        "selectedLevel",
        selectedLevel
    );


    updateStartButton();

}


// =========================================================
// اختيار التصنيف
// =========================================================

function selectCategory(
    element,
    category
) {

    document
        .querySelectorAll(
            ".category-card"
        )
        .forEach(
            function (card) {

                card.classList.remove(
                    "selected"
                );

            }
        );


    element.classList.add(
        "selected"
    );


    selectedCategory =
        category;


    // =================================================
    // مثال:
    // home
    // food
    // cars
    // travel
    // sports
    // technology
    // =================================================

    localStorage.setItem(
        "selectedCategory",
        selectedCategory
    );


    // لا نستخدم ID
    // لأن words.category تعتمد على الاسم الإنجليزي

    localStorage.removeItem(
        "selectedCategoryId"
    );


    updateStartButton();

}


// =========================================================
// تحديث زر البداية
// =========================================================

function updateStartButton() {

    const button =
        document.getElementById(
            "startBtn"
        );


    const message =
        document.getElementById(
            "selectionMessage"
        );


    if (!button) {

        return;

    }


    if (
        selectedLevel &&
        selectedCategory
    ) {

        button.disabled =
            false;


        button.innerHTML = `

            <span>
                ابدأ التعلم 🚀
            </span>

            <span class="start-arrow">
                ←
            </span>

        `;


        if (message) {

            message.textContent =
                `ممتاز! ${selectedLevel} — ${getCategoryName(selectedCategory)} جاهز للبدء 🚀`;


            message.classList.add(
                "ready"
            );

        }

    } else {

        button.disabled =
            true;


        button.innerHTML = `

            <span>
                ابدأ التعلم
            </span>

            <span class="start-arrow">
                ←
            </span>

        `;


        if (message) {

            message.textContent =
                "اختر المستوى والتصنيف للبدء 👆";


            message.classList.remove(
                "ready"
            );

        }

    }

}


// =========================================================
// اسم التصنيف بالعربي
// =========================================================

function getCategoryName(
    categoryKey
) {

    const category =
        categories.find(
            function (item) {

                return (
                    String(item.key)
                        .toLowerCase() ===
                    String(categoryKey)
                        .toLowerCase()
                );

            }
        );


    if (!category) {

        return categoryKey;

    }


    return (
        category.name_ar ||
        categoryKey
    );

}


// =========================================================
// استرجاع الاختيارات السابقة
// =========================================================

function restoreSelections() {

    const savedLevel =
        localStorage.getItem(
            "selectedLevel"
        );


    const savedCategory =
        localStorage.getItem(
            "selectedCategory"
        );


    // =====================================================
    // المستوى
    // =====================================================

    if (savedLevel) {

        document
            .querySelectorAll(
                ".level-card"
            )
            .forEach(
                function (card) {

                    const onclickValue =
                        card.getAttribute(
                            "onclick"
                        );


                    if (
                        onclickValue &&
                        onclickValue.includes(
                            "'" +
                            savedLevel +
                            "'"
                        )
                    ) {

                        card.classList.add(
                            "selected"
                        );


                        selectedLevel =
                            savedLevel;

                    }

                }
            );

    }


    // =====================================================
    // التصنيف
    // =====================================================

    if (savedCategory) {

        const categoryCards =
            document.querySelectorAll(
                ".category-card"
            );


        categoryCards.forEach(
            function (card) {

                const cardCategory =
                    card.dataset.category;


                if (
                    String(cardCategory)
                        .toLowerCase() ===
                    String(savedCategory)
                        .toLowerCase()
                ) {

                    card.classList.add(
                        "selected"
                    );


                    selectedCategory =
                        cardCategory;

                }

            }
        );

    }


    updateStartButton();

}


// =========================================================
// بدء التعلم
// =========================================================

function startLearning() {

    if (
        !selectedLevel ||
        !selectedCategory
    ) {

        return;

    }


    // =====================================================
    // حفظ المستوى
    // =====================================================

    localStorage.setItem(
        "selectedLevel",
        selectedLevel
    );


    // =====================================================
    // حفظ التصنيف
    // =====================================================

    localStorage.setItem(
        "selectedCategory",
        selectedCategory
    );


    // لا نرسل ID
    // words تستخدم category مثل:
    // home / food / cars / travel

    localStorage.removeItem(
        "selectedCategoryId"
    );


    // =====================================================
    // الانتقال للكلمات
    // =====================================================

    window.location.href =
        "words.html";

}


// =========================================================
// الرجوع للرئيسية
// =========================================================

function goHome() {

    window.location.href =
        "index.html";

}