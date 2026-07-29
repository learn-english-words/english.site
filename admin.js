// ==========================================
// متغيرات
// ==========================================

let words = [];
let selectedImage = "";


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

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {

        selectedImage = reader.result;

        document.getElementById("imagePreview").innerHTML = `
            <img src="${selectedImage}">
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
            .upload(fileName, file);


    if (error) {

        console.error(error);

        alert("❌ حدث خطأ أثناء رفع الصورة.");

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
// حفظ كلمة
// ==========================================

async function saveWord() {

    const isAdmin = await checkAdmin();

    if (!isAdmin) return;


    const english =
        document.getElementById("english").value.trim();

    const arabic =
        document.getElementById("arabic").value.trim();

    const level =
        document.getElementById("level").value;

    const category =
        document.getElementById("category").value;

    const example =
        document.getElementById("example").value.trim();

    const exampleArabic =
        document.getElementById("exampleArabic").value.trim();

    const imageInput =
        document.getElementById("image");

    const file =
        imageInput.files[0];


    // التحقق

    if (!english || !arabic) {

        alert(
            "⚠️ اكتب الكلمة الإنجليزية والمعنى بالعربي."
        );

        return;
    }


    if (!file && !selectedImage) {

        alert(
            "⚠️ اختر صورة للكلمة."
        );

        return;
    }


    // تعطيل الزر أثناء الحفظ

    const saveButton =
        document.querySelector(".save-btn");

    saveButton.disabled = true;

    saveButton.textContent =
        "⏳ جاري الحفظ...";


    // رفع الصورة

    let imageUrl = selectedImage;

    if (file) {

        imageUrl =
            await uploadImage(file);

        if (!imageUrl) {

            saveButton.disabled = false;

            saveButton.textContent =
                "💾 حفظ الكلمة";

            return;
        }
    }


    // إنشاء الكلمة

    const word = {

        english: english,

        arabic: arabic,

        level: level,

        category: category,

        image: imageUrl,

        example: example,

        exampleArabic: exampleArabic
    };


    // إرسال إلى Supabase

    const { data, error } =
        await supabaseClient
            .from("words")
            .insert(word)
            .select()
            .single();


    if (error) {

        console.error(error);

        alert(
            "❌ حدث خطأ أثناء حفظ الكلمة:\n" +
            error.message
        );

        saveButton.disabled = false;

        saveButton.textContent =
            "💾 حفظ الكلمة";

        return;
    }


    console.log("تم حفظ:", data);


    // تنظيف النموذج

    document.getElementById("english").value = "";

    document.getElementById("arabic").value = "";

    document.getElementById("example").value = "";

    document.getElementById("exampleArabic").value = "";

    document.getElementById("image").value = "";

    selectedImage = "";


    document.getElementById("imagePreview").innerHTML = `
        <span>🖼️</span>
        <p>ستظهر معاينة الصورة هنا</p>
    `;


    saveButton.disabled = false;

    saveButton.textContent =
        "💾 حفظ الكلمة";


    alert("✅ تم حفظ الكلمة في قاعدة البيانات!");


    // تحديث القائمة

    loadWords();
}


// ==========================================
// جلب الكلمات من Supabase
// ==========================================

async function loadWords() {

    const isAdmin = await checkAdmin();

    if (!isAdmin) return;


    const { data, error } =
        await supabaseClient
            .from("words")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        alert(
            "❌ لم نتمكن من تحميل الكلمات:\n" +
            error.message
        );

        return;
    }


    words = data || [];

    renderWords();
}


// ==========================================
// عرض الكلمات
// ==========================================

function renderWords(displayWords = words) {

    const wordsList =
        document.getElementById("wordsList");

    const count =
        document.getElementById("wordCount");


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


    wordsList.innerHTML = "";


    displayWords.forEach(word => {

        const item =
            document.createElement("div");

        item.className =
            "word-item";


        item.innerHTML = `

            <img src="${word.image || ""}">

            <div class="word-info">

                <h3>${word.english}</h3>

                <p>${word.arabic}</p>

                <div class="word-tags">

                    <span class="tag">
                        ${word.level}
                    </span>

                    <span class="tag">
                        ${word.category}
                    </span>

                </div>

            </div>

            <div class="word-actions">

                <button
                    class="delete-btn"
                    onclick="deleteWord('${word.id}')">

                    🗑️ حذف

                </button>

            </div>
        `;


        wordsList.appendChild(item);

    });
}


// ==========================================
// البحث
// ==========================================

function searchWords() {

    const input =
        document.getElementById("searchInput");

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
        words.filter(word =>

            word.english
                .toLowerCase()
                .includes(search)

            ||

            word.arabic
                .toLowerCase()
                .includes(search)

        );


    renderWords(filtered);
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


    const { error } =
        await supabaseClient
            .from("words")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "❌ حدث خطأ أثناء حذف الكلمة:\n" +
            error.message
        );

        return;
    }


    alert("🗑️ تم حذف الكلمة.");

    loadWords();
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