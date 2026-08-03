// ==========================================
// EnglishWords — ADMIN.JS
// ==========================================


// ==========================================
// متغيرات
// ==========================================

let words = [];

let selectedImage = "";

let editingWordId = null;


// ==========================================
// التأكد أن المستخدم هو Admin
// ==========================================

async function checkAdmin() {

    const {
        data: { user },
        error
    } =
        await supabaseClient.auth.getUser();


    if (error || !user) {

        alert(
            "⚠️ يجب تسجيل الدخول أولاً."
        );

        window.location.href =
            "login.html";

        return false;
    }


    const ADMIN_ID =
        "a1b0ce48-3846-4af6-a688-05368f6ec9bd";


    if (user.id !== ADMIN_ID) {

        alert(
            "❌ ليس لديك صلاحية دخول لوحة التحكم."
        );

        window.location.href =
            "index.html";

        return false;
    }


    return true;
}



// ==========================================
// تحميل التصنيفات
// مهم:
// قيمة التصنيف التي تحفظ في words.category
// هي name_en مثل:
// body
// food
// cars
// ==========================================

async function loadAdminCategories() {

    const categorySelect =
        document.getElementById(
            "category"
        );


    const container =
        document.getElementById(
            "adminCategoriesList"
        );


    // ==========================================
    // جلب التصنيفات من Supabase
    // ==========================================

    let databaseCategories = [];


    try {

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
                "Load categories error:",
                error
            );

        } else {

            databaseCategories =
                data || [];

        }

    } catch (error) {

        console.error(
            "Unexpected load categories error:",
            error
        );

    }


    // ==========================================
    // التصنيفات القديمة
    // ==========================================

    const oldCategories =

        typeof categories !== "undefined" &&

        Array.isArray(categories)

            ? categories

            : [];


    // ==========================================
    // دمج التصنيفات
    // ==========================================

    const allCategories = [];


    // ==========================================
    // التصنيفات القديمة
    // ==========================================

    oldCategories.forEach(
        category => {

            const oldKey =
                String(
                    category.key ||
                    category.english ||
                    category.name_en ||
                    category.id ||
                    ""
                )
                .trim()
                .toLowerCase();


            const oldNameAr =
                String(
                    category.name_ar ||
                    category.name ||
                    ""
                )
                .trim();


            if (!oldKey) {
                return;
            }


            allCategories.push({

                id:
                    category.id || null,

                name_ar:
                    oldNameAr || oldKey,

                name_en:
                    oldKey,

                icon:
                    category.icon ||
                    "📚"

            });

        }
    );


    // ==========================================
    // التصنيفات الجديدة من Supabase
    // ==========================================

    databaseCategories.forEach(
        category => {

            const categoryNameEn =
                String(
                    category.name_en ||
                    ""
                )
                .trim()
                .toLowerCase();


            if (!categoryNameEn) {
                return;
            }


            const exists =
                allCategories.some(
                    item => {

                        return (

                            String(
                                item.name_en ||
                                ""
                            )
                            .trim()
                            .toLowerCase() ===
                            categoryNameEn

                        );

                    }
                );


            if (!exists) {

                allCategories.push({

                    id:
                        category.id,

                    name_ar:
                        category.name_ar ||
                        categoryNameEn,

                    name_en:
                        categoryNameEn,

                    icon:
                        category.icon ||
                        "📚"

                });

            }

        }
    );


    // ==========================================
    // تحديث قائمة اختيار التصنيف
    // ==========================================
    // مهم جدًا:
    //
    // value = name_en
    //
    // وليس:
    //
    // value = id
    //
    // لذلك عند اختيار Body
    // يتم حفظ:
    //
    // body
    //
    // في words.category
    // ==========================================

    if (categorySelect) {

        categorySelect.innerHTML =
            "";


        const firstOption =
            document.createElement(
                "option"
            );


        firstOption.value =
            "";


        firstOption.textContent =
            "اختر التصنيف...";


        categorySelect.appendChild(
            firstOption
        );


        allCategories.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                // ==========================================
                // أهم سطر في التعديل
                // ==========================================

                option.value =
                    category.name_en;


                option.dataset.categoryId =
                    category.id || "";


                option.textContent =
                    `${category.icon} ${category.name_ar}`;


                categorySelect.appendChild(
                    option
                );

            }
        );

    }


    // ==========================================
    // إذا لا توجد قائمة تصنيفات
    // ==========================================

    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        allCategories.length === 0
    ) {

        container.innerHTML = `

            <div class="categories-error">

                📂 لا توجد تصنيفات حاليًا

            </div>

        `;

        return;
    }


    // ==========================================
    // عرض التصنيفات
    // ==========================================

    allCategories.forEach(
        category => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "admin-category-item";


            const isOldCategory =
                oldCategories.some(
                    oldCategory => {

                        const oldKey =
                            String(
                                oldCategory.key ||
                                oldCategory.english ||
                                oldCategory.name_en ||
                                oldCategory.id ||
                                ""
                            )
                            .trim()
                            .toLowerCase();


                        return (
                            oldKey ===
                            String(
                                category.name_en
                            )
                            .trim()
                            .toLowerCase()
                        );

                    }
                );


            item.innerHTML = `

                <div class="admin-category-icon">

                    ${escapeHtmlAdmin(
                        category.icon ||
                        "📚"
                    )}

                </div>


                <div class="admin-category-info">

                    <strong>

                        ${escapeHtmlAdmin(
                            category.name_ar ||
                            ""
                        )}

                    </strong>


                    <small>

                        ${escapeHtmlAdmin(
                            category.name_en ||
                            ""
                        )}

                    </small>

                </div>


                ${
                    isOldCategory

                        ? `

                            <span
                                style="
                                    font-size:12px;
                                    color:#777;
                                    padding:6px 9px;
                                    background:#f3f3f3;
                                    border-radius:8px;
                                "
                            >

                                أساسي

                            </span>

                        `

                        : `

                            <button
                                type="button"
                                class="delete-category-btn"
                                onclick="deleteCategory('${escapeHtmlAdmin(
                                    category.id
                                )}')"
                            >

                                🗑️ حذف

                            </button>

                        `
                }

            `;


            container.appendChild(
                item
            );

        }
    );

}



// ==========================================
// معاينة الصورة
// ==========================================

function previewImage(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        function () {

            selectedImage =
                reader.result;


            document.getElementById(
                "imagePreview"
            ).innerHTML = `

                <img
                    src="${selectedImage}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:contain;
                        border-radius:15px;
                    "
                >

            `;

        };


    reader.readAsDataURL(file);

}



// ==========================================
// رفع الصورة إلى Supabase Storage
// ==========================================

async function uploadImage(file) {

    if (!file) return null;


    const extension =
        file.name
            .split(".")
            .pop();


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const {
        error
    } =
        await supabaseClient

            .storage

            .from("word-images")

            .upload(
                fileName,
                file
            );


    if (error) {

        console.error(error);


        alert(
            "❌ حدث خطأ أثناء رفع الصورة."
        );


        return null;
    }


    const {
        data
    } =
        supabaseClient

            .storage

            .from("word-images")

            .getPublicUrl(
                fileName
            );


    return data.publicUrl;

}



// ==========================================
// تعبئة النموذج عند التعديل
// ==========================================

function editWord(id) {

    const word =
        words.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!word) {

        alert(
            "❌ لم يتم العثور على الكلمة."
        );

        return;
    }


    editingWordId =
        word.id;


    document.getElementById(
        "english"
    ).value =
        word.english || "";


    document.getElementById(
        "arabic"
    ).value =
        word.arabic || "";


    document.getElementById(
        "level"
    ).value =
        word.level || "A1";


    document.getElementById(
        "category"
    ).value =
        word.category || "";


    document.getElementById(
        "example"
    ).value =
        word.example || "";


    document.getElementById(
        "exampleArabic"
    ).value =
        word.exampleArabic || "";


    selectedImage =
        word.image || "";


    if (word.image) {

        document.getElementById(
            "imagePreview"
        ).innerHTML = `

            <img
                src="${escapeAdminHtml(
                    word.image
                )}"
                style="
                    width:100%;
                    height:100%;
                    object-fit:contain;
                    border-radius:15px;
                "
            >

        `;

    } else {

        document.getElementById(
            "imagePreview"
        ).innerHTML = `

            <span>
                🖼️
            </span>

            <p>
                لا توجد صورة
            </p>

        `;

    }


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    if (saveButton) {

        saveButton.textContent =
            "✏️ حفظ التعديلات";

    }


    const title =
        document.querySelector(
            ".admin-header h1"
        );


    if (title) {

        title.textContent =
            "تعديل الكلمة ✏️";

    }


    const formCard =
        document.querySelector(
            ".form-card"
        );


    if (formCard) {

        formCard.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    }

}



// ==========================================
// حفظ كلمة جديدة أو تعديل
// ==========================================

async function saveWord() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    const english =
        document.getElementById(
            "english"
        ).value.trim();


    const arabic =
        document.getElementById(
            "arabic"
        ).value.trim();


    const level =
        document.getElementById(
            "level"
        ).value;


    // ==========================================
    // التصنيف
    // ==========================================

    const category =
        document.getElementById(
            "category"
        ).value
        .trim()
        .toLowerCase();


    const example =
        document.getElementById(
            "example"
        ).value.trim();


    const exampleArabic =
        document.getElementById(
            "exampleArabic"
        ).value.trim();


    const imageInput =
        document.getElementById(
            "image"
        );


    const file =
        imageInput.files[0];


    if (
        !english ||
        !arabic
    ) {

        alert(
            "⚠️ اكتب الكلمة الإنجليزية والمعنى بالعربي."
        );

        return;
    }


    if (!category) {

        alert(
            "⚠️ اختر التصنيف."
        );

        return;
    }


    if (
        !editingWordId &&
        !file &&
        !selectedImage
    ) {

        alert(
            "⚠️ اختر صورة للكلمة."
        );

        return;
    }


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    if (saveButton) {

        saveButton.disabled =
            true;


        saveButton.textContent =
            editingWordId

                ? "⏳ جاري تعديل الكلمة..."

                : "⏳ جاري الحفظ...";

    }


    let imageUrl =
        selectedImage;


    if (file) {

        imageUrl =
            await uploadImage(
                file
            );


        if (!imageUrl) {

            if (saveButton) {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    editingWordId

                        ? "✏️ حفظ التعديلات"

                        : "💾 حفظ الكلمة";

            }


            return;
        }

    }


    // ==========================================
    // البيانات التي ستدخل جدول words
    // ==========================================

    const wordData = {

        english:
            english,

        arabic:
            arabic,

        level:
            level,

        // ==========================================
        // مهم:
        // هنا يتم حفظ body وليس UUID
        // ==========================================

        category:
            category,

        image:
            imageUrl,

        example:
            example,

        exampleArabic:
            exampleArabic

    };


    // ==========================================
    // تعديل كلمة
    // ==========================================

    if (editingWordId) {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("words")

                .update(
                    wordData
                )

                .eq(
                    "id",
                    editingWordId
                )

                .select()
                .single();


        if (error) {

            console.error(error);


            alert(
                "❌ حدث خطأ أثناء تعديل الكلمة:\n" +
                error.message
            );


            if (saveButton) {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "✏️ حفظ التعديلات";

            }


            return;
        }


        console.log(
            "تم تعديل:",
            data
        );


        alert(
            "✅ تم تعديل الكلمة بنجاح!"
        );


        resetForm();


        await loadWords();


        return;
    }


    // ==========================================
    // إضافة كلمة جديدة
    // ==========================================

    const {
        data,
        error
    } =
        await supabaseClient

            .from("words")

            .insert(
                wordData
            )

            .select()
            .single();


    if (error) {

        console.error(error);


        alert(
            "❌ حدث خطأ أثناء حفظ الكلمة:\n" +
            error.message
        );


        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "💾 حفظ الكلمة";

        }


        return;
    }


    console.log(
        "تم حفظ:",
        data
    );


    alert(
        "✅ تم حفظ الكلمة في قاعدة البيانات!"
    );


    resetForm();


    await loadWords();

}



// ==========================================
// إعادة النموذج
// ==========================================

function resetForm() {

    editingWordId =
        null;


    selectedImage =
        "";


    document.getElementById(
        "english"
    ).value = "";


    document.getElementById(
        "arabic"
    ).value = "";


    document.getElementById(
        "example"
    ).value = "";


    document.getElementById(
        "exampleArabic"
    ).value = "";


    document.getElementById(
        "image"
    ).value = "";


    document.getElementById(
        "level"
    ).value =
        "A1";


    document.getElementById(
        "category"
    ).value =
        "";


    document.getElementById(
        "imagePreview"
    ).innerHTML = `

        <span>
            🖼️
        </span>

        <p>
            ستظهر معاينة الصورة هنا
        </p>

    `;


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    if (saveButton) {

        saveButton.disabled =
            false;


        saveButton.textContent =
            "💾 حفظ الكلمة";

    }


    const title =
        document.querySelector(
            ".admin-header h1"
        );


    if (title) {

        title.textContent =
            "إضافة كلمة جديدة 📚";

    }

}



// ==========================================
// تحميل الكلمات
// ==========================================

async function loadWords() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    const {
        data,
        error
    } =
        await supabaseClient

            .from("words")

            .select("*")

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);


        alert(
            "❌ لم نتمكن من تحميل الكلمات:\n" +
            error.message
        );


        return;
    }


    words =
        data || [];


    renderWords();

}



// ==========================================
// عرض الكلمات
// ==========================================

function renderWords(
    displayWords = words
) {

    const wordsList =
        document.getElementById(
            "wordsList"
        );


    const count =
        document.getElementById(
            "wordCount"
        );


    if (!wordsList) return;


    if (count) {

        count.textContent =
            words.length +
            " كلمة";

    }


    if (
        displayWords.length === 0
    ) {

        wordsList.innerHTML = `

            <div class="word-item">

                لا توجد كلمات.

            </div>

        `;


        return;
    }


    wordsList.innerHTML =
        "";


    displayWords.forEach(
        word => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "word-item";


            const categoryName =
                getCategoryName(
                    word.category
                );


            item.innerHTML = `

                <img
                    src="${escapeAdminHtml(
                        word.image || ""
                    )}"
                    alt="${escapeAdminHtml(
                        word.english || ""
                    )}"
                >


                <div class="word-info">

                    <h3>

                        ${escapeAdminHtml(
                            word.english || ""
                        )}

                    </h3>


                    <p>

                        ${escapeAdminHtml(
                            word.arabic || ""
                        )}

                    </p>


                    <div class="word-tags">

                        <span class="tag">

                            ${escapeAdminHtml(
                                word.level || ""
                            )}

                        </span>


                        <span class="tag">

                            ${escapeAdminHtml(
                                categoryName
                            )}

                        </span>

                    </div>

                </div>


                <div class="word-actions">

                    <button
                        class="edit-btn"
                        onclick="editWord('${escapeAdminHtml(
                            word.id
                        )}')"
                    >

                        ✏️ تعديل

                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteWord('${escapeAdminHtml(
                            word.id
                        )}')"
                    >

                        🗑️ حذف

                    </button>

                </div>

            `;


            wordsList.appendChild(
                item
            );

        }
    );

}



// ==========================================
// اسم التصنيف
// ==========================================

function getCategoryName(
    categoryKey
) {

    if (!categoryKey) {
        return "";
    }


    const key =
        String(
            categoryKey
        )
        .trim()
        .toLowerCase();


    // ==========================================
    // البحث في categories.js
    // ==========================================

    if (
        typeof categories !== "undefined" &&
        Array.isArray(categories)
    ) {

        const oldCategory =
            categories.find(
                item => {

                    const itemKey =
                        String(
                            item.key ||
                            item.english ||
                            item.name_en ||
                            item.id ||
                            ""
                        )
                        .trim()
                        .toLowerCase();


                    return (
                        itemKey ===
                        key
                    );

                }
            );


        if (oldCategory) {

            return (

                oldCategory.icon
                    ? oldCategory.icon + " "
                    : ""

            ) +

                (
                    oldCategory.name_ar ||
                    oldCategory.name ||
                    oldCategoryKey ||
                    key
                );

        }

    }


    // ==========================================
    // البحث في قائمة Supabase
    // ==========================================

    const categorySelect =
        document.getElementById(
            "category"
        );


    if (categorySelect) {

        const option =
            Array.from(
                categorySelect.options
            ).find(
                item => {

                    return (
                        String(
                            item.value
                        )
                        .trim()
                        .toLowerCase() ===
                        key
                    );

                }
            );


        if (option) {

            return option.textContent;

        }

    }


    // ==========================================
    // إذا لم نجد الاسم
    // ==========================================

    return categoryKey || "";

}



// ==========================================
// البحث
// ==========================================

function searchWords() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) return;


    const search =
        input.value
            .toLowerCase()
            .trim();


    if (!search) {

        renderWords();

        return;
    }


    const filtered =
        words.filter(
            word => {

                return (

                    (
                        word.english ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    (
                        word.arabic ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    (
                        word.category ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    renderWords(
        filtered
    );

}



// ==========================================
// حذف كلمة
// ==========================================

async function deleteWord(id) {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    if (
        !confirm(
            "هل تريد حذف هذه الكلمة؟"
        )
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient

            .from("words")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);


        alert(
            "❌ حدث خطأ أثناء حذف الكلمة:\n" +
            error.message
        );


        return;
    }


    alert(
        "🗑️ تم حذف الكلمة."
    );


    if (
        String(editingWordId) ===
        String(id)
    ) {

        resetForm();

    }


    await loadWords();

}



// ==========================================
// الرئيسية
// ==========================================

function goHome() {

    window.location.href =
        "index.html";

}



// ==========================================
// رسائل الأدمن
// ==========================================

async function saveAdminMessage() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    const title =
        document.getElementById(
            "adminMessageTitle"
        )
            .value
            .trim();


    const message =
        document.getElementById(
            "adminMessageText"
        )
            .value
            .trim();


    const startsInput =
        document.getElementById(
            "messageStartsAt"
        ).value;


    const endsInput =
        document.getElementById(
            "messageEndsAt"
        ).value;


    if (
        !title ||
        !message ||
        !startsInput ||
        !endsInput
    ) {

        alert(
            "⚠️ املأ جميع بيانات الرسالة."
        );


        return;
    }


    const startsAt =
        new Date(
            startsInput
        ).toISOString();


    const endsAt =
        new Date(
            endsInput
        ).toISOString();


    if (
        new Date(endsAt) <=
        new Date(startsAt)
    ) {

        alert(
            "⚠️ وقت الانتهاء يجب أن يكون بعد وقت البداية."
        );


        return;
    }


    const {
        error
    } =
        await supabaseClient

            .from("admin_messages")

            .insert({

                title:
                    title,

                message:
                    message,

                starts_at:
                    startsAt,

                ends_at:
                    endsAt,

                is_active:
                    true

            });


    if (error) {

        console.error(error);


        alert(
            "❌ حدث خطأ أثناء نشر الرسالة:\n" +
            error.message
        );


        return;
    }


    alert(
        "✅ تم نشر الرسالة بنجاح!"
    );


    document.getElementById(
        "adminMessageTitle"
    ).value = "";


    document.getElementById(
        "adminMessageText"
    ).value = "";


    document.getElementById(
        "messageStartsAt"
    ).value = "";


    document.getElementById(
        "messageEndsAt"
    ).value = "";


    await loadAdminMessages();

}



// ==========================================
// تحميل رسائل الأدمن
// ==========================================

async function loadAdminMessages() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    const {
        data,
        error
    } =
        await supabaseClient

            .from("admin_messages")

            .select("*")

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);


        const container =
            document.getElementById(
                "adminMessagesList"
            );


        if (container) {

            container.textContent =
                "❌ حدث خطأ في تحميل الرسائل.";

        }


        return;
    }


    const container =
        document.getElementById(
            "adminMessagesList"
        );


    if (!container) return;


    container.innerHTML =
        "";


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `

            <div class="word-item">

                لا توجد رسائل حتى الآن.

            </div>

        `;


        return;
    }


    data.forEach(
        msg => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "word-item";


            const start =
                new Date(
                    msg.starts_at
                )
                    .toLocaleString(
                        "ar-SA"
                    );


            const end =
                new Date(
                    msg.ends_at
                )
                    .toLocaleString(
                        "ar-SA"
                    );


            const now =
                new Date();


            const active =
                msg.is_active &&
                new Date(
                    msg.starts_at
                ) <= now &&
                new Date(
                    msg.ends_at
                ) > now;


            item.innerHTML = `

                <div class="word-info">

                    <h3>

                        📢

                        ${escapeHtml(
                            msg.title
                        )}

                    </h3>


                    <p>

                        ${escapeHtml(
                            msg.message
                        )}

                    </p>


                    <div class="word-tags">

                        <span class="tag">

                            🕐

                            ${start}

                        </span>


                        <span class="tag">

                            ⏰

                            ${end}

                        </span>


                        <span class="tag">

                            ${
                                active
                                    ? "🟢 فعالة"
                                    : "⚪ غير فعالة"
                            }

                        </span>

                    </div>

                </div>


                <div class="word-actions">

                    <button
                        class="delete-btn"
                        onclick="
                            deleteAdminMessage(
                                '${msg.id}'
                            )
                        "
                    >

                        🗑️ حذف

                    </button>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}



// ==========================================
// حذف رسالة
// ==========================================

async function deleteAdminMessage(id) {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    if (
        !confirm(
            "هل تريد حذف هذه الرسالة؟"
        )
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient

            .from("admin_messages")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);


        alert(
            "❌ حدث خطأ أثناء حذف الرسالة:\n" +
            error.message
        );


        return;
    }


    alert(
        "🗑️ تم حذف الرسالة."
    );


    await loadAdminMessages();

}



// ==========================================
// رسائل HTML
// ==========================================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text || "";


    return div.innerHTML;

}


function escapeAdminHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text || "";


    return div.innerHTML;

}



// ==================================================
// READING ADMIN
// ==================================================


// ==================================================
// حفظ قصة
// ==================================================

async function saveReadingStory() {

    const title =
        document.getElementById(
            "readingTitle"
        ).value.trim();


    const description =
        document.getElementById(
            "readingDescription"
        ).value.trim();


    const level =
        document.getElementById(
            "readingLevel"
        ).value;


    const icon =
        document.getElementById(
            "readingIcon"
        ).value.trim() ||
        "📖";


    const readingTime =
        parseInt(
            document.getElementById(
                "readingTime"
            ).value
        ) || 3;


    const content =
        document.getElementById(
            "readingContent"
        ).value.trim();


    const translation =
        document.getElementById(
            "readingTranslation"
        ).value.trim();


    const isPublished =
        document.getElementById(
            "readingPublished"
        ).checked;


    if (!title) {

        alert(
            "اكتب عنوان القصة."
        );


        return;
    }


    if (!content) {

        alert(
            "اكتب نص القصة بالإنجليزية."
        );


        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient

            .from("reading_stories")

            .insert({

                title:
                    title,

                description:
                    description,

                level:
                    level,

                icon:
                    icon,

                reading_time:
                    readingTime,

                content:
                    content,

                translation:
                    translation,

                is_published:
                    isPublished

            })

            .select()

            .single();


    if (error) {

        console.error(
            "Reading story error:",
            error
        );


        alert(
            "حدث خطأ أثناء حفظ القصة:\n" +
            error.message
        );


        return;
    }


    alert(
        "✅ تم حفظ القصة بنجاح"
    );


    clearReadingStoryForm();


    loadReadingStories();

}



// ==================================================
// تنظيف نموذج القصة
// ==================================================

function clearReadingStoryForm() {

    document.getElementById(
        "readingTitle"
    ).value = "";


    document.getElementById(
        "readingDescription"
    ).value = "";


    document.getElementById(
        "readingLevel"
    ).value =
        "A1";


    document.getElementById(
        "readingIcon"
    ).value =
        "📖";


    document.getElementById(
        "readingTime"
    ).value =
        "3";


    document.getElementById(
        "readingContent"
    ).value = "";


    document.getElementById(
        "readingTranslation"
    ).value = "";


    document.getElementById(
        "readingPublished"
    ).checked =
        true;

}



// ==================================================
// تحميل القصص
// ==================================================

async function loadReadingStories() {

    const container =
        document.getElementById(
            "readingStoriesList"
        );


    if (!container) return;


    container.innerHTML =
        "جاري تحميل القصص...";


    const {
        data,
        error
    } =
        await supabaseClient

            .from("reading_stories")

            .select("*")

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Load reading stories error:",
            error
        );


        container.innerHTML =
            "❌ حدث خطأ أثناء تحميل القصص.";


        return;
    }


    const stories =
        data || [];


    const count =
        document.getElementById(
            "readingStoryCount"
        );


    if (count) {

        count.textContent =
            stories.length +
            " قصة";

    }


    if (
        stories.length === 0
    ) {

        container.innerHTML =
            "لا توجد قصص حتى الآن.";


        updateReadingStorySelects(
            []
        );


        return;
    }


    container.innerHTML =
        "";


    stories.forEach(
        story => {

            const card =
                document.createElement(
                    "div"
                );


            card.style.cssText = `

                background:white;
                border:1px solid #eee;
                border-radius:15px;
                padding:15px;
                margin-bottom:10px;

            `;


            const publishedText =
                story.is_published
                    ? "🟢 منشورة"
                    : "🔴 مخفية";


            card.innerHTML = `

                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:10px;
                    align-items:flex-start;
                ">

                    <div>

                        <strong style="
                            font-size:17px;
                        ">

                            ${escapeAdminHtml(
                                story.icon ||
                                "📖"
                            )}

                            ${escapeAdminHtml(
                                story.title
                            )}

                        </strong>


                        <div style="
                            color:#777;
                            font-size:12px;
                            margin-top:7px;
                        ">

                            المستوى:

                            ${escapeAdminHtml(
                                story.level
                            )}

                            ·

                            ⏱

                            ${
                                story.reading_time ||
                                3
                            }

                            دقائق

                            ·

                            ${publishedText}

                        </div>


                        <p style="
                            color:#777;
                            margin:8px 0 0;
                            line-height:1.6;
                        ">

                            ${escapeAdminHtml(
                                story.description ||
                                ""
                            )}

                        </p>

                    </div>


                    <button
                        onclick="
                            deleteReadingStory(
                                ${story.id}
                            )
                        "
                        style="
                            border:none;
                            background:#fff0f3;
                            color:#d63f59;
                            border-radius:10px;
                            padding:8px 11px;
                            cursor:pointer;
                        "
                    >

                        🗑️ حذف

                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    updateReadingStorySelects(
        stories
    );

}



// ==================================================
// تحديث قوائم القصص
// ==================================================

function updateReadingStorySelects(
    stories
) {

    const questionStory =
        document.getElementById(
            "questionStory"
        );


    const filterStory =
        document.getElementById(
            "questionsFilterStory"
        );


    if (questionStory) {

        questionStory.innerHTML = `

            <option value="">
                اختر قصة...
            </option>

        `;

    }


    if (filterStory) {

        filterStory.innerHTML = `

            <option value="">
                اختر قصة...
            </option>

        `;

    }


    stories.forEach(
        story => {

            const option1 =
                document.createElement(
                    "option"
                );


            option1.value =
                story.id;


            option1.textContent =
                `${
                    story.icon ||
                    "📖"
                } ${
                    story.title
                } (${
                    story.level
                })`;


            const option2 =
                option1.cloneNode(
                    true
                );


            if (questionStory) {

                questionStory.appendChild(
                    option1
                );

            }


            if (filterStory) {

                filterStory.appendChild(
                    option2
                );

            }

        }
    );

}



// ==================================================
// حذف قصة
// ==================================================

async function deleteReadingStory(id) {

    const confirmed =
        confirm(
            "⚠️ هل أنت متأكد من حذف هذه القصة؟\n\n" +
            "سيتم حذف أسئلتها وكلماتها المهمة أيضًا."
        );


    if (!confirmed) return;


    const {
        error
    } =
        await supabaseClient

            .from("reading_stories")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Delete story error:",
            error
        );


        alert(
            "❌ حدث خطأ أثناء حذف القصة:\n" +
            error.message
        );


        return;
    }


    alert(
        "✅ تم حذف القصة."
    );


    loadReadingStories();


    const questionsList =
        document.getElementById(
            "readingQuestionsList"
        );


    if (questionsList) {

        questionsList.innerHTML =
            "اختر قصة لعرض الأسئلة.";

    }

}



// ==================================================
// حفظ سؤال
// ==================================================

async function saveReadingQuestion() {

    const storyId =
        document.getElementById(
            "questionStory"
        ).value;


    const question =
        document.getElementById(
            "readingQuestion"
        ).value.trim();


    const option1 =
        document.getElementById(
            "readingOption1"
        ).value.trim();


    const option2 =
        document.getElementById(
            "readingOption2"
        ).value.trim();


    const option3 =
        document.getElementById(
            "readingOption3"
        ).value.trim();


    const option4 =
        document.getElementById(
            "readingOption4"
        ).value.trim();


    const correctAnswer =
        parseInt(
            document.getElementById(
                "readingCorrectAnswer"
            ).value
        );


    if (!storyId) {

        alert(
            "اختر القصة أولًا."
        );


        return;
    }


    if (!question) {

        alert(
            "اكتب السؤال."
        );


        return;
    }


    if (
        !option1 ||
        !option2 ||
        !option3
    ) {

        alert(
            "اكتب أول 3 إجابات على الأقل."
        );


        return;
    }


    if (
        correctAnswer === 4 &&
        !option4
    ) {

        alert(
            "أنت اخترت الإجابة الرابعة كصحيحة، اكتبها أولًا."
        );


        return;
    }


    const {
        error
    } =
        await supabaseClient

            .from("reading_questions")

            .insert({

                story_id:
                    Number(storyId),

                question:
                    question,

                option1:
                    option1,

                option2:
                    option2,

                option3:
                    option3,

                option4:
                    option4 ||
                    null,

                correct_answer:
                    correctAnswer

            });


    if (error) {

        console.error(
            "Save question error:",
            error
        );


        alert(
            "❌ حدث خطأ أثناء حفظ السؤال:\n" +
            error.message
        );


        return;
    }


    alert(
        "✅ تم إضافة السؤال."
    );


    document.getElementById(
        "readingQuestion"
    ).value = "";


    document.getElementById(
        "readingOption1"
    ).value = "";


    document.getElementById(
        "readingOption2"
    ).value = "";


    document.getElementById(
        "readingOption3"
    ).value = "";


    document.getElementById(
        "readingOption4"
    ).value = "";


    document.getElementById(
        "questionsFilterStory"
    ).value =
        storyId;


    await loadReadingQuestions();

}



// ==================================================
// تحميل أسئلة القصة
// ==================================================

async function loadReadingQuestions() {

    const storyId =
        document.getElementById(
            "questionsFilterStory"
        ).value;


    const container =
        document.getElementById(
            "readingQuestionsList"
        );


    if (!container) return;


    if (!storyId) {

        container.innerHTML =
            "اختر قصة لعرض الأسئلة.";


        return;
    }


    container.innerHTML =
        "جاري تحميل الأسئلة...";


    const {
        data,
        error
    } =
        await supabaseClient

            .from("reading_questions")

            .select("*")

            .eq(
                "story_id",
                Number(storyId)
            )

            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Load questions error:",
            error
        );


        container.innerHTML =
            "❌ حدث خطأ أثناء تحميل الأسئلة.";


        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "لا توجد أسئلة لهذه القصة.";


        return;
    }


    container.innerHTML =
        "";


    data.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.style.cssText = `

                background:white;
                border:1px solid #eee;
                border-radius:15px;
                padding:15px;
                margin-bottom:10px;

            `;


            const correctText =
                item[
                    "option" +
                    item.correct_answer
                ] || "";


            card.innerHTML = `

                <div style="
                    font-weight:bold;
                    margin-bottom:10px;
                ">

                    ${index + 1}.

                    ${escapeAdminHtml(
                        item.question
                    )}

                </div>


                <div style="
                    font-size:13px;
                    color:#666;
                    line-height:2;
                ">

                    1️⃣

                    ${escapeAdminHtml(
                        item.option1
                    )}

                    <br>


                    2️⃣

                    ${escapeAdminHtml(
                        item.option2
                    )}

                    <br>


                    3️⃣

                    ${escapeAdminHtml(
                        item.option3
                    )}


                    ${
                        item.option4
                            ? `

                                <br>

                                4️⃣

                                ${escapeAdminHtml(
                                    item.option4
                                )}

                            `
                            : ""
                    }


                    <br>


                    <strong style="
                        color:#20855a;
                    ">

                        ✅ الصحيحة:

                        ${escapeAdminHtml(
                            correctText
                        )}

                    </strong>

                </div>


                <button
                    onclick="
                        deleteReadingQuestion(
                            ${item.id}
                        )
                    "
                    style="
                        margin-top:12px;
                        border:none;
                        background:#fff0f3;
                        color:#d63f59;
                        border-radius:10px;
                        padding:8px 11px;
                        cursor:pointer;
                    "
                >

                    🗑️ حذف السؤال

                </button>

            `;


            container.appendChild(
                card
            );

        }
    );

}



// ==================================================
// حذف سؤال
// ==================================================

async function deleteReadingQuestion(
    id
) {

    const confirmed =
        confirm(
            "هل تريد حذف هذا السؤال؟"
        );


    if (!confirmed) return;


    const {
        error
    } =
        await supabaseClient

            .from("reading_questions")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Delete question error:",
            error
        );


        alert(
            "❌ حدث خطأ أثناء حذف السؤال:\n" +
            error.message
        );


        return;
    }


    loadReadingQuestions();

}



// =========================================================
// إضافة تصنيف جديد
// =========================================================

async function saveCategory() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {
        return;
    }


    const nameArInput =
        document.getElementById(
            "categoryNameAr"
        );


    const nameEnInput =
        document.getElementById(
            "categoryNameEn"
        );


    const iconInput =
        document.getElementById(
            "categoryIcon"
        );


    if (
        !nameArInput ||
        !nameEnInput ||
        !iconInput
    ) {

        console.error(
            "لم يتم العثور على حقول إضافة التصنيف."
        );

        return;
    }


    const nameAr =
        nameArInput.value.trim();


    const nameEn =
        nameEnInput.value
            .trim()
            .toLowerCase();


    const icon =
        iconInput.value.trim() ||
        "📚";


    // ==========================================
    // التحقق
    // ==========================================

    if (!nameAr) {

        alert(
            "⚠️ اكتب اسم التصنيف بالعربي."
        );

        nameArInput.focus();

        return;
    }


    if (!nameEn) {

        alert(
            "⚠️ اكتب اسم التصنيف بالإنجليزي."
        );

        nameEnInput.focus();

        return;
    }


    if (/\s/.test(nameEn)) {

        alert(
            "⚠️ اسم التصنيف بالإنجليزي لا يحتوي على مسافات.\n\nمثال: travel"
        );

        nameEnInput.focus();

        return;
    }


    try {

        // ==========================================
        // فحص التصنيف في Supabase
        // ==========================================

        const {
            data: existingCategory,
            error: checkError
        } =
            await supabaseClient

                .from("categories")

                .select("id")

                .eq(
                    "name_en",
                    nameEn
                )

                .maybeSingle();


        if (checkError) {

            console.error(
                "Category check error:",
                checkError
            );


            alert(
                "❌ حدث خطأ أثناء التحقق من التصنيف:\n" +
                checkError.message
            );


            return;
        }


        // ==========================================
        // فحص التصنيفات القديمة
        // ==========================================

        const oldCategoryExists =

            typeof categories !== "undefined" &&

            Array.isArray(categories) &&

            categories.some(
                category => {

                    const categoryKey =
                        String(
                            category.key ||
                            category.id ||
                            category.english ||
                            category.name_en ||
                            ""
                        )
                        .trim()
                        .toLowerCase();


                    return (
                        categoryKey ===
                        nameEn
                    );

                }
            );


        if (
            existingCategory ||
            oldCategoryExists
        ) {

            alert(
                "⚠️ هذا التصنيف موجود بالفعل."
            );

            return;
        }


        // ==========================================
        // إضافة التصنيف
        // ==========================================

        const {
            data,
            error
        } =
            await supabaseClient

                .from("categories")

                .insert([

                    {

                        name_ar:
                            nameAr,

                        name_en:
                            nameEn,

                        icon:
                            icon

                    }

                ])

                .select()

                .single();


        if (error) {

            console.error(
                "Save category error:",
                error
            );


            alert(
                "❌ حدث خطأ أثناء إضافة التصنيف:\n" +
                error.message
            );


            return;
        }


        console.log(
            "Category added:",
            data
        );


        alert(
            "✅ تمت إضافة التصنيف بنجاح!"
        );


        // ==========================================
        // تنظيف الحقول
        // ==========================================

        nameArInput.value =
            "";


        nameEnInput.value =
            "";


        iconInput.value =
            "📚";


        // ==========================================
        // تحديث التصنيفات
        // ==========================================

        await loadAdminCategories();

    } catch (error) {

        console.error(
            "Unexpected save category error:",
            error
        );


        alert(
            "❌ حدث خطأ غير متوقع أثناء إضافة التصنيف."
        );

    }

}



// =========================================================
// حذف تصنيف
// =========================================================

async function deleteCategory(
    categoryId
) {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {
        return;
    }


    if (!categoryId) {
        return;
    }


    const confirmed =
        confirm(

            "هل أنت متأكد من حذف هذا التصنيف؟\n\n" +

            "⚠️ لا تحذف تصنيفًا مستخدمًا مع كلمات."

        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient

                .from("categories")

                .delete()

                .eq(
                    "id",
                    categoryId
                );


        if (error) {

            console.error(
                "Delete category error:",
                error
            );


            alert(
                "❌ لم يتم حذف التصنيف:\n" +
                error.message
            );


            return;
        }


        alert(
            "✅ تم حذف التصنيف."
        );


        await loadAdminCategories();

    } catch (error) {

        console.error(
            "Unexpected delete category error:",
            error
        );


        alert(
            "❌ حدث خطأ أثناء حذف التصنيف."
        );

    }

}



// =========================================================
// تشغيل لوحة الأدمن
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadAdminCategories();

        await loadReadingStories();

    }
);



// =========================================================
// تشغيل البيانات الأساسية
// =========================================================

(async function () {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    await loadWords();


    await loadAdminMessages();

})();