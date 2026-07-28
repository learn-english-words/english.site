
// ==========================================
// الكلمات المخزنة
// ==========================================

let words =
    JSON.parse(localStorage.getItem("englishWords")) || [];

let selectedImage = "";


// ==========================================
// معاينة الصورة
// ==========================================

function previewImage(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {

        selectedImage = reader.result;

        const preview =
            document.getElementById("imagePreview");

        preview.innerHTML = `
            <img src="${selectedImage}">
        `;
    };

    reader.readAsDataURL(file);
}


// ==========================================
// حفظ كلمة
// ==========================================

function saveWord() {

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


    // التحقق

    if (!english || !arabic) {

        alert(
            "⚠️ اكتب الكلمة الإنجليزية والمعنى بالعربي."
        );

        return;
    }


    if (!selectedImage) {

        alert(
            "⚠️ اختر صورة للكلمة."
        );

        return;
    }


    // إنشاء الكلمة

    const word = {

        id: Date.now(),

        english: english,

        arabic: arabic,

        level: level,

        category: category,

        image: selectedImage,

        example: example,

        exampleArabic: exampleArabic
    };


    // إضافة للكلمات

    words.push(word);


    // حفظ

    localStorage.setItem(
        "englishWords",
        JSON.stringify(words)
    );


    // تنظيف الحقول

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


    // إعادة عرض الكلمات

    renderWords();


    alert("✅ تم حفظ الكلمة!");
}


// ==========================================
// عرض الكلمات
// ==========================================

function renderWords(displayWords = words) {

    const wordsList =
        document.getElementById("wordsList");

    const count =
        document.getElementById("wordCount");


    // عدد جميع الكلمات

    count.textContent =
        words.length + " كلمة";


    // لا توجد كلمات

    if (displayWords.length === 0) {

        wordsList.innerHTML = `
            <div class="word-item">
                لا توجد نتائج.
            </div>
        `;

        return;
    }


    // تنظيف القائمة

    wordsList.innerHTML = "";


    // عرض الكلمات

    displayWords.forEach(word => {

        const item =
            document.createElement("div");


        item.className =
            "word-item";


        item.innerHTML = `

            <img src="${word.image}">

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
        class="edit-btn"
        onclick="editWord(${word.id})">
        ✏️ تعديل
    </button>

    <button
        class="delete-btn"
        onclick="deleteWord(${word.id})">
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


    // إذا ما فيه مربع بحث
    if (!input) return;


    const search =
        input.value
        .toLowerCase()
        .trim();


    // إذا البحث فاضي
    if (!search) {

        renderWords();

        return;
    }


    // البحث بالإنجليزي أو العربي

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

function deleteWord(id) {

    if (
        !confirm(
            "هل تريد حذف هذه الكلمة؟"
        )
    ) {
        return;
    }


    words =
        words.filter(
            word => word.id !== id
        );


    // حفظ القائمة الجديدة

    localStorage.setItem(
        "englishWords",
        JSON.stringify(words)
    );


    // إعادة العرض

    renderWords();
}


// ==========================================
// تعديل كلمة
// ==========================================

function editWord(id) {

    const word =
        words.find(
            item => item.id === id
        );


    if (!word) return;


    // تعبئة البيانات في النموذج

    document.getElementById("english").value =
        word.english;

    document.getElementById("arabic").value =
        word.arabic;

    document.getElementById("level").value =
        word.level;

    document.getElementById("category").value =
        word.category;

    document.getElementById("example").value =
        word.example || "";

    document.getElementById("exampleArabic").value =
        word.exampleArabic || "";


    // الصورة الحالية

    selectedImage =
        word.image;


    document.getElementById("imagePreview").innerHTML = `
        <img src="${word.image}">
    `;


    // حذف الكلمة القديمة مؤقتًا

    words =
        words.filter(
            item => item.id !== id
        );


    localStorage.setItem(
        "englishWords",
        JSON.stringify(words)
    );


    renderWords();


    // نغير زر الحفظ مؤقتًا

    const saveButton =
        document.querySelector(".save-btn");


    saveButton.textContent =
        "💾 حفظ التعديل";


    saveButton.onclick =
        function () {

            saveWord();

            saveButton.textContent =
                "💾 حفظ الكلمة";

            saveButton.onclick =
                saveWord;
        };


    // نرجع للأعلى

    window.scrollTo({
        top: 0,
        behavior: "smooth"
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
// تشغيل القائمة عند فتح الصفحة
// ==========================================

renderWords();
