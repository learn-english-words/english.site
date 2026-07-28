
// ==========================================
// قراءة الكلمات من لوحة التحكم
// ==========================================

const allWords =
    JSON.parse(localStorage.getItem("englishWords")) || [];


// ==========================================
// قراءة اختيار المستخدم
// ==========================================

const selectedLevel =
    localStorage.getItem("selectedLevel");

const selectedCategory =
    localStorage.getItem("selectedCategory");


// ==========================================
// فلترة الكلمات
// ==========================================

const words = allWords.filter(word => {

    return (
        word.level === selectedLevel &&
        word.category === selectedCategory
    );

});


// ==========================================
// إذا ما فيه كلمات
// ==========================================

if (words.length === 0) {

    alert(
        "ما فيه كلمات بهذا المستوى والتصنيف حتى الآن."
    );

    window.location.href = "learn.html";
}


// ==========================================
// المتغيرات
// ==========================================

let currentIndex = 0;

let favorite = false;


// ==========================================
// تحميل الكلمة
// ==========================================

function loadWord() {

    const word = words[currentIndex];


    // الصورة

    const imageBox =
        document.getElementById("wordEmoji");


    if (word.image) {

        imageBox.innerHTML = `
            <img
                src="${word.image}"
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
            word.emoji || "🖼️";
    }


    // الإنجليزية

    document.getElementById("englishWord").textContent =
        word.english;


    // العربية

    document.getElementById("arabicWord").textContent =
        word.arabic;


    // المثال

    document.getElementById("exampleText").textContent =
        word.example || "";


    document.getElementById("exampleArabic").textContent =
        word.exampleArabic || "";


    // التقدم

    const number =
        currentIndex + 1;


    document.getElementById("progressText").textContent =
        number + " / " + words.length;


    const percent =
        (number / words.length) * 100;


    document.getElementById("progressFill").style.width =
        percent + "%";


    // إعادة زر الحفظ

    favorite = false;


    const favoriteBtn =
        document.getElementById("favoriteBtn");


    favoriteBtn.classList.remove("active");


    favoriteBtn.innerHTML =
        "☆ <span>حفظ</span>";
}


// ==========================================
// النطق
// ==========================================

function speakWord() {

    const word =
        words[currentIndex].english;


    const speech =
        new SpeechSynthesisUtterance(word);


    speech.lang = "en-US";

    speech.rate = 0.8;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(speech);
}


// ==========================================
// أعرف / لا أعرف
// ==========================================

function answer(known) {

    const word =
        words[currentIndex];


    console.log(
        known ? "أعرف:" : "لا أعرف:",
        word.english
    );


    nextWord();
}


// ==========================================
// حفظ
// ==========================================

function toggleFavorite() {

    favorite = !favorite;


    const button =
        document.getElementById("favoriteBtn");


    if (favorite) {

        button.classList.add("active");

        button.innerHTML =
            "★ <span>محفوظة</span>";

    } else {

        button.classList.remove("active");

        button.innerHTML =
            "☆ <span>حفظ</span>";
    }
}


// ==========================================
// التالي
// ==========================================

function nextWord() {

    if (
        currentIndex <
        words.length - 1
    ) {

        currentIndex++;

        loadWord();

    } else {

        alert(
            "🎉 أحسنت! أنهيت كلمات هذا التصنيف."
        );


        currentIndex = 0;

        loadWord();
    }
}


// ==========================================
// رجوع
// ==========================================

function goBack() {

    window.location.href =
        "learn.html";
}


function goHome() {

    window.location.href =
        "index.html";
}


// ==========================================
// تشغيل
// ==========================================

loadWord();
