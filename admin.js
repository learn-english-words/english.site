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
    } = await supabaseClient.auth.getUser();

    if (error || !user) {

        alert("⚠️ يجب تسجيل الدخول أولاً.");

        window.location.href = "login.html";

        return false;
    }

    const ADMIN_ID =
        "a1b0ce48-3846-4af6-a688-05368f6ec9bd";

    if (user.id !== ADMIN_ID) {

        alert("❌ ليس لديك صلاحية دخول لوحة التحكم.");

        window.location.href = "index.html";

        return false;
    }

    return true;
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

    reader.onload = function () {

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
        file.name.split(".").pop();

    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const { error } =
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


    const { data } =
        supabaseClient
            .storage
            .from("word-images")
            .getPublicUrl(fileName);


    return data.publicUrl;
}


// ==========================================
// تعبئة النموذج عند التعديل
// ==========================================

function editWord(id) {

    const word =
        words.find(
            item => String(item.id) === String(id)
        );

    if (!word) {

        alert(
            "❌ لم يتم العثور على الكلمة."
        );

        return;
    }


    // حفظ ID الكلمة التي نعدلها

    editingWordId =
        word.id;


    // تعبئة البيانات

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
        word.category || "food";


    document.getElementById(
        "example"
    ).value =
        word.example || "";


    document.getElementById(
        "exampleArabic"
    ).value =
        word.exampleArabic || "";


    // الصورة الحالية

    selectedImage =
        word.image || "";


    if (word.image) {

        document.getElementById(
            "imagePreview"
        ).innerHTML = `

            <img
                src="${word.image}"
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

            <span>🖼️</span>

            <p>
                لا توجد صورة
            </p>

        `;
    }


    // تغيير شكل زر الحفظ

    const saveButton =
        document.querySelector(".save-btn");

    saveButton.textContent =
        "✏️ حفظ التعديلات";


    // تغيير عنوان الصفحة

    const title =
        document.querySelector(".admin-header h1");

    if (title) {

        title.textContent =
            "تعديل الكلمة ✏️";
    }


    // الانتقال للنموذج

    document.querySelector(
        ".form-card"
    ).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// حفظ كلمة جديدة أو تعديل كلمة
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


    const category =
        document.getElementById(
            "category"
        ).value;


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


    // ======================================
    // التحقق
    // ======================================

    if (!english || !arabic) {

        alert(
            "⚠️ اكتب الكلمة الإنجليزية والمعنى بالعربي."
        );

        return;
    }


    // إذا كانت كلمة جديدة لازم صورة

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


    // ======================================
    // تعطيل الزر
    // ======================================

    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    saveButton.disabled =
        true;


    saveButton.textContent =
        editingWordId
            ? "⏳ جاري تعديل الكلمة..."
            : "⏳ جاري الحفظ...";


    // ======================================
    // الصورة
    // ======================================

    let imageUrl =
        selectedImage;


    // إذا اختار صورة جديدة

    if (file) {

        imageUrl =
            await uploadImage(file);


        if (!imageUrl) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingWordId
                    ? "✏️ حفظ التعديلات"
                    : "💾 حفظ الكلمة";

            return;
        }
    }


    // ======================================
    // البيانات
    // ======================================

    const wordData = {

        english: english,

        arabic: arabic,

        level: level,

        category: category,

        image: imageUrl,

        example: example,

        exampleArabic: exampleArabic
    };


    // ======================================
    // تعديل كلمة موجودة
    // ======================================

    if (editingWordId) {

        const {
            data,
            error
        } = await supabaseClient

            .from("words")

            .update(wordData)

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


            saveButton.disabled =
                false;


            saveButton.textContent =
                "✏️ حفظ التعديلات";


            return;
        }


        console.log(
            "تم تعديل:",
            data
        );


        alert(
            "✅ تم تعديل الكلمة بنجاح!"
        );


        // إنهاء وضع التعديل

        resetForm();


        // تحديث القائمة

        await loadWords();

        return;
    }


    // ======================================
    // إضافة كلمة جديدة
    // ======================================

    const {
        data,
        error
    } = await supabaseClient

        .from("words")

        .insert(wordData)

        .select()
        .single();


    if (error) {

        console.error(error);

        alert(
            "❌ حدث خطأ أثناء حفظ الكلمة:\n" +
            error.message
        );


        saveButton.disabled =
            false;


        saveButton.textContent =
            "💾 حفظ الكلمة";


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
// إعادة النموذج للوضع الطبيعي
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
    ).value = "A1";


    document.getElementById(
        "category"
    ).value = "food";


    document.getElementById(
        "imagePreview"
    ).innerHTML = `

        <span>🖼️</span>

        <p>
            ستظهر معاينة الصورة هنا
        </p>

    `;


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    saveButton.disabled =
        false;


    saveButton.textContent =
        "💾 حفظ الكلمة";


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
// جلب الكلمات من Supabase
// ==========================================

async function loadWords() {

    const isAdmin =
        await checkAdmin();

    if (!isAdmin) return;


    const {
        data,
        error
    } = await supabaseClient

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


    count.textContent =
        words.length + " كلمة";


    if (displayWords.length === 0) {

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


            item.innerHTML = `

                <img
                    src="${word.image || ""}"
                    alt="${word.english || ""}"
                >


                <div class="word-info">

                    <h3>
                        ${word.english || ""}
                    </h3>

                    <p>
                        ${word.arabic || ""}
                    </p>


                    <div class="word-tags">

                        <span class="tag">
                            ${word.level || ""}
                        </span>

                        <span class="tag">
                            ${word.category || ""}
                        </span>

                    </div>

                </div>


                <div class="word-actions">

                    <button
                        class="edit-btn"
                        onclick="editWord('${word.id}')"
                    >
                        ✏️ تعديل
                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteWord('${word.id}')"
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

                    (word.english || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    (word.arabic || "")
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
    } = await supabaseClient

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


    // إذا كان المستخدم يعدل كلمة وحذفها

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
// التشغيل
// ==========================================

(async function () {

    const isAdmin =
        await checkAdmin();


    if (isAdmin) {

        await loadWords();

    }

})();