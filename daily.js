// ==========================================
// تحدي اليوم
// ==========================================

let questions = [];
let currentQuestion = 0;
let score = 0;

const TOTAL_QUESTIONS = 10;

// ==========================================
// تشغيل التحدي
// ==========================================

async function startDailyChallenge() {


const {
    data: { user },
    error: userError
} = await supabaseClient.auth.getUser();

if (userError || !user) {
    window.location.href = "login.html";
    return;
}


// ==========================================
// هل أنهى المستخدم تحدي اليوم؟
// ==========================================

const today = getToday();

const {
    data: completed,
    error: completedError
} = await supabaseClient
    .from("daily_challenges")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_date", today)
    .maybeSingle();


if (completedError) {

    console.error(
        "Daily challenge check error:",
        completedError
    );

    alert(
        "❌ حدث خطأ أثناء التحقق من تحدي اليوم."
    );

    return;
}


if (completed) {

    showAlreadyCompleted(completed);

    return;
}


// ==========================================
// جلب الكلمات
// ==========================================

const {
    data: words,
    error: wordsError
} = await supabaseClient
    .from("words")
    .select("*");


if (wordsError) {

    console.error(
        "Words error:",
        wordsError
    );

    alert(
        "❌ حدث خطأ أثناء تحميل الكلمات."
    );

    return;
}


if (
    !words ||
    words.length < TOTAL_QUESTIONS
) {

    alert(
        "⚠️ نحتاج إلى 10 كلمات على الأقل لإنشاء تحدي اليوم."
    );

    return;
}


// ==========================================
// اختيار 10 كلمات
// ==========================================

questions =
    shuffleArray(words)
        .slice(0, TOTAL_QUESTIONS);


currentQuestion = 0;
score = 0;


document.getElementById(
    "loading"
).style.display = "none";


document.getElementById(
    "quizBox"
).style.display = "block";


loadQuestion();


}

// ==========================================
// تحميل السؤال
// ==========================================

function loadQuestion() {


const word =
    questions[currentQuestion];


if (!word) {

    finishChallenge();

    return;
}


// ==========================================
// رقم السؤال
// ==========================================

document.getElementById(
    "questionNumber"
).textContent =
    "Question " +
    (currentQuestion + 1) +
    " / " +
    TOTAL_QUESTIONS;


// ==========================================
// النتيجة
// ==========================================

document.getElementById(
    "scoreText"
).textContent =
    "Score: " + score;


// ==========================================
// شريط التقدم
// ==========================================

const percent =
    (
        (currentQuestion + 1) /
        TOTAL_QUESTIONS
    ) * 100;


document.getElementById(
    "progressFill"
).style.width =
    percent + "%";


// ==========================================
// الصورة
// ==========================================

const imageBox =
    document.getElementById(
        "wordImage"
    );


if (word.image) {

    imageBox.innerHTML = `
        <img
            src="${word.image}"
            alt="${word.english}"
            style="
                width:100%;
                height:100%;
                object-fit:contain;
                border-radius:20px;
            "
        >
    `;

} else {

    imageBox.textContent = "🖼️";
}


// ==========================================
// السؤال
// ==========================================

document.getElementById(
    "questionText"
).textContent =
    "Choose the correct word";


// ==========================================
// صندوق الإجابات
// ==========================================

const answersBox =
    document.getElementById(
        "answers"
    );


answersBox.innerHTML = "";


// الإجابة الصحيحة
const correctAnswer =
    word.english;


// ==========================================
// الإجابات الخاطئة
// ==========================================

const otherWords =
    questions.filter(
        w => w.id !== word.id
    );


const wrongAnswers =
    shuffleArray(otherWords)
        .slice(0, 3)
        .map(
            w => w.english
        );


// ==========================================
// خلط الإجابات
// ==========================================

const answers =
    shuffleArray([
        correctAnswer,
        ...wrongAnswers
    ]);


// ==========================================
// إنشاء الأزرار
// ==========================================

answers.forEach(answer => {

    const button =
        document.createElement("button");


    button.textContent =
        answer;


    button.style.cssText = `
        border: none;
        padding: 15px;
        border-radius: 12px;
        background: #f3f4f6;
        cursor: pointer;
        font-size: 17px;
        transition: .2s;
        direction: ltr;
    `;


    button.onclick = () => {

        checkAnswer(
            answer,
            correctAnswer,
            button
        );

    };


    answersBox.appendChild(
        button
    );

});


}

// ==========================================
// التحقق من الإجابة
// ==========================================

function checkAnswer(
selected,
correct,
selectedButton
) {


const buttons =
    document.querySelectorAll(
        "#answers button"
    );


// منع الضغط أكثر من مرة
buttons.forEach(button => {

    button.disabled = true;

});


// ==========================================
// صحيحة
// ==========================================

if (selected === correct) {

    score++;


    selectedButton.style.background =
        "#d1fae5";


    selectedButton.textContent =
        "✅ " + selected;

}


// ==========================================
// خاطئة
// ==========================================

else {

    selectedButton.style.background =
        "#fee2e2";


    selectedButton.textContent =
        "❌ " + selected;


    // إظهار الصحيحة
    buttons.forEach(button => {

        if (
            button.textContent ===
            correct
        ) {

            button.style.background =
                "#d1fae5";


            button.textContent =
                "✅ " + correct;

        }

    });

}


// تحديث النتيجة
document.getElementById(
    "scoreText"
).textContent =
    "Score: " + score;


// ==========================================
// السؤال التالي
// ==========================================

setTimeout(() => {

    currentQuestion++;

    loadQuestion();

}, 1000);


}

// ==========================================
// إنهاء التحدي
// ==========================================

async function finishChallenge() {


const {
    data: { user },
    error
} = await supabaseClient.auth.getUser();


if (error || !user) {

    window.location.href =
        "login.html";

    return;
}


const today =
    getToday();


// ==========================================
// حفظ النتيجة
// ==========================================

const {
    error: saveError
} =
    await supabaseClient
        .from("daily_challenges")
        .insert({

            user_id: user.id,

            challenge_date: today,

            score: score,

            total_questions:
                TOTAL_QUESTIONS

        });


if (saveError) {

    console.error(
        "Save challenge error:",
        saveError
    );


    alert(
        "❌ انتهى التحدي ولكن حدث خطأ أثناء حفظ النتيجة:\n" +
        saveError.message
    );

    return;
}


// ==========================================
// إخفاء التحدي
// ==========================================

document.getElementById(
    "quizBox"
).style.display = "none";


// ==========================================
// إظهار النتيجة
// ==========================================

document.getElementById(
    "resultBox"
).style.display = "block";


document.getElementById(
    "finalScore"
).textContent =
    score +
    " / " +
    TOTAL_QUESTIONS;


// ==========================================
// الرسالة
// ==========================================

let message = "";


if (score === 10) {

    message =
        "🔥 Perfect! Excellent work!";

} else if (score >= 8) {

    message =
        "👏 Great job! Keep going!";

} else if (score >= 5) {

    message =
        "💪 Good job! Keep practicing!";

} else {

    message =
        "📚 Keep learning and try again tomorrow!";

}


document.getElementById(
    "resultMessage"
).textContent =
    message;


}

// ==========================================
// التحدي مكتمل مسبقًا
// ==========================================

function showAlreadyCompleted(data) {

document.getElementById(
    "loading"
).style.display = "none";


document.getElementById(
    "resultBox"
).style.display = "block";


document.getElementById(
    "finalScore"
).textContent =
    data.score +
    " / " +
    data.total_questions;


document.getElementById(
    "resultMessage"
).textContent =
    "✅ You already completed today's challenge. Come back tomorrow!";


}

// ==========================================
// تاريخ اليوم
// ==========================================

function getToday() {


const now =
    new Date();


const year =
    now.getFullYear();


const month =
    String(
        now.getMonth() + 1
    ).padStart(2, "0");


const day =
    String(
        now.getDate()
    ).padStart(2, "0");


return (
    year +
    "-" +
    month +
    "-" +
    day
);


}

// ==========================================
// خلط الكلمات
// ==========================================

function shuffleArray(array) {

return [...array].sort(
    () => Math.random() - 0.5
);


}

// ==========================================
// العودة للرئيسية
// ==========================================

function goHome() {

window.location.href =
    "index.html";


}

// ==========================================
// تشغيل
// ==========================================

startDailyChallenge();
