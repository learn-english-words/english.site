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
// مهم: لا نحذفها ولا نعتمد على جدول categories
// لأن كلماتك في words مرتبطة بهذه القيم
// =========================================================

const categories = [
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
// عند فتح الصفحة
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCategories();

        restoreSelections();

    }
);


// =========================================================
// تحميل التصنيفات
// =========================================================
// لا نستخدم جدول categories هنا.
// نستخدم نفس قيم category الموجودة أصلًا في words.
// =========================================================

function loadCategories() {

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


    container.innerHTML = "";


    categories.forEach(
        function (category) {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";


            button.className =
                "category-card";


            // مهم جدًا
            // هذه هي القيمة الموجودة في جدول words

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


    // مثال:
    // food
    // home
    // cars
    // animals

    selectedCategory =
        category;


    localStorage.setItem(
        "selectedCategory",
        selectedCategory
    );


    // نحذف ID القديم إن وجد
    // حتى لا يسبب تعارضًا

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

                return item.key ===
                    categoryKey;

            }
        );


    if (!category) {

        return categoryKey;

    }


    return category.name_ar;

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
                    cardCategory ===
                    savedCategory
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
    // حفظ التصنيف بنفس الطريقة القديمة
    // =====================================================

    localStorage.setItem(
        "selectedCategory",
        selectedCategory
    );


    // =====================================================
    // مهم:
    // لا نرسل category ID
    // لأن words تستخدم category مثل food/home/cars
    // =====================================================

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