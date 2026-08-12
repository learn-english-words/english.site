// ==========================================
// المتغيرات
// ==========================================

let allWords = [];

let quizWords = [];

let currentQuestion = 0;

let score = 0;

let selectedLevel = "";

const QUESTIONS_COUNT = 20;
let quizMoveCount = 0;

// ==========================================
// اختيار المستوى
// ==========================================

function selectLevel(level) {

    selectedLevel = level;

    document.querySelectorAll(".level-card").forEach(card => {
        card.classList.remove("selected");
    });

    const selectedCard =
        document.querySelector(
            `.level-card[data-level="${level}"]`
        );

    if (selectedCard) {
        selectedCard.classList.add("selected");
    }

    const startButton =
        document.getElementById("startQuizBtn");

    if (startButton) {
        startButton.disabled = false;
    }
}


// ==========================================
// جلب الكلمات من Supabase
// ==========================================

async function getWords() {

    const { data, error } =
        await supabaseClient
            .from("words")
            .select("*")
            .eq("level", selectedLevel)
            .not("image", "is", null)
            .neq("image", "");

    if (error) {

        console.error(
            "Supabase error:",
            error
        );

        alert(
            "❌ حدث خطأ أثناء تحميل الكلمات."
        );

        return [];
    }

    return data || [];
}
// ==========================================
// خلط
// ==========================================

function shuffle(array) {

    const newArray = [...array];

    for (
        let i = newArray.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            newArray[i],
            newArray[j]
        ] = [
            newArray[j],
            newArray[i]
        ];
    }

    return newArray;
}


// ==========================================
// حفظ كلمة للمراجعة
// ==========================================

function addToReview(word) {

    if (!word || !word.id) return;

    let reviewWords =
        JSON.parse(
            localStorage.getItem("reviewWords")
        ) || [];

    const alreadyExists =
        reviewWords.some(
            item =>
                String(item.id) ===
                String(word.id)
        );

    if (!alreadyExists) {

        reviewWords.push(word);

    }

    localStorage.setItem(
        "reviewWords",
        JSON.stringify(reviewWords)
    );
}


// ==========================================
// بدء الاختبار
// ==========================================

async function startQuiz() {

    if (!selectedLevel) {

        alert(
            "⚠️ اختر المستوى أولاً."
        );

        return;
    }

    const startButton =
        document.getElementById(
            "startQuizBtn"
        );

    if (startButton) {

        startButton.disabled = true;

        startButton.textContent =
            "⏳ جاري تجهيز الاختبار...";

    }

    allWords =
        await getWords();

    if (allWords.length < 4) {

        alert(
            "⚠️ نحتاج على الأقل 4 كلمات في هذا المستوى."
        );

        if (startButton) {

            startButton.disabled = false;

            startButton.textContent =
                "🚀 ابدأ الاختبار";

        }

        return;
    }

    const shuffled =
        shuffle(allWords);

    const questionCount =
        Math.min(
            QUESTIONS_COUNT,
            shuffled.length
        );

    quizWords =
        shuffled.slice(
            0,
            questionCount
        );

    currentQuestion = 0;

    score = 0;

    document.getElementById(
        "levelScreen"
    ).style.display =
        "none";

    document.getElementById(
        "quizScreen"
    ).style.display =
        "block";

    document.getElementById(
        "resultScreen"
    ).style.display =
        "none";

    updateScore();

    showQuestion();
}


// ==========================================
// عرض السؤال
// ==========================================

function showQuestion() {

    const word =
        quizWords[currentQuestion];

    if (!word) {

        finishQuiz();

        return;
    }

    document.getElementById(
        "questionNumber"
    ).textContent =
        `السؤال ${currentQuestion + 1} / ${quizWords.length}`;

    const progress =
        (
            currentQuestion /
            quizWords.length
        ) * 100;

    document.getElementById(
        "progressFill"
    ).style.width =
        progress + "%";

    const image =
        document.getElementById(
            "quizImage"
        );

    if (word.image) {

        image.src =
            word.image;

        image.style.display =
            "block";

    } else {

        image.removeAttribute("src");

        image.style.display =
            "none";
    }

    createAnswers(word);

    document.getElementById(
        "nextBtn"
    ).style.display =
        "none";
}


// ==========================================
// إنشاء الخيارات
// ==========================================

function createAnswers(correctWord) {

    const answersContainer =
        document.getElementById(
            "answers"
        );

    answersContainer.innerHTML = "";

    const otherWords =
        allWords.filter(word =>

            String(word.id) !==
            String(correctWord.id)

            &&

            word.english
        );

    const wrongAnswers =
        shuffle(otherWords)
            .slice(0, 3);

    let answers = [
        correctWord,
        ...wrongAnswers
    ];

    answers =
        shuffle(answers);

    answers.forEach(word => {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "answer-btn";

        button.textContent =
            word.english;

        button.onclick =
            () =>
                checkAnswer(
                    button,
                    word,
                    correctWord
                );

        answersContainer.appendChild(
            button
        );

    });
}


// ==========================================
// التحقق من الإجابة
// ==========================================

function checkAnswer(
    button,
    selectedWord,
    correctWord
) {

    const buttons =
        document.querySelectorAll(
            ".answer-btn"
        );

    buttons.forEach(btn => {

        btn.disabled = true;

    });

    // ==========================================
    // صحيحة
    // ==========================================

    if (
        String(selectedWord.id) ===
        String(correctWord.id)
    ) {

        button.classList.add(
            "correct"
        );

        score++;

        updateScore();

    }

    // ==========================================
    // خاطئة
    // ==========================================

    else {

        button.classList.add(
            "wrong"
        );

        addToReview(correctWord);

        buttons.forEach(btn => {

            if (
                btn.textContent.trim() ===
                correctWord.english.trim()
            ) {

                btn.classList.add(
                    "correct"
                );

            }

        });

    }

    const nextButton =
        document.getElementById(
            "nextBtn"
        );

    nextButton.style.display =
        "block";

    if (
        currentQuestion >=
        quizWords.length - 1
    ) {

        nextButton.textContent =
            "🏆 عرض النتيجة";

    } else {

        nextButton.textContent =
            "الكلمة التالية ←";

    }
}


// ==========================================
// السؤال التالي
// ==========================================

function nextQuestion() {

    quizMoveCount++;

    // كل 5 انتقالات يظهر الإعلان
    if (quizMoveCount % 5 === 0) {

        showQuizAd();

        return;
    }

    currentQuestion++;

    if (currentQuestion >= quizWords.length) {

        finishQuiz();

        return;
    }

    showQuestion();
}


// ==========================================
// تحديث النتيجة
// ==========================================

function updateScore() {

    const scoreElement =
        document.getElementById(
            "score"
        );

    if (scoreElement) {

        scoreElement.textContent =
            `⭐ ${score}`;

    }
}


// ==========================================
// النتيجة + حفظ الاختبار
// ==========================================

async function finishQuiz() {

    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    if (userError || !user) {

        window.location.href =
            "login.html";

        return;
    }


    // ==========================================
    // حفظ نتيجة الاختبار
    // ==========================================

    const {
        error: saveError
    } =
        await supabaseClient
            .from("quiz_results")
            .insert({

                user_id:
                    user.id,

                score:
                    score,

                total_questions:
                    quizWords.length

            });


    if (saveError) {

        console.error(
            "Quiz result save error:",
            saveError
        );

        alert(
            "❌ انتهى الاختبار ولكن حدث خطأ أثناء حفظ النتيجة:\n" +
            saveError.message
        );

        return;
    }


    // ==========================================
    // إظهار النتيجة
    // ==========================================

    document.getElementById(
        "quizScreen"
    ).style.display =
        "none";

    document.getElementById(
        "resultScreen"
    ).style.display =
        "block";

    document.getElementById(
        "finalScore"
    ).textContent =
        `${score} / ${quizWords.length}`;

    document.getElementById(
        "progressFill"
    ).style.width =
        "100%";
}


// ==========================================
// إعادة الاختبار
// ==========================================

function restartQuiz() {

    currentQuestion = 0;

    score = 0;

    const shuffled =
        shuffle(allWords);

    const questionCount =
        Math.min(
            QUESTIONS_COUNT,
            shuffled.length
        );

    quizWords =
        shuffled.slice(
            0,
            questionCount
        );

    document.getElementById(
        "resultScreen"
    ).style.display =
        "none";

    document.getElementById(
        "quizScreen"
    ).style.display =
        "block";

    updateScore();

    showQuestion();
}


// ==========================================
// الرئيسية
// ==========================================

function goHome() {

    window.location.href =
        "index.html";
}

function showQuizAd() {

    const image =
        document.getElementById("quizImage");

    const adContainer =
        document.getElementById("quizAdContainer");

    if (!image || !adContainer) {
        console.log("Ad elements not found");
        return;
    }

    // نخفي الصورة
    image.style.display = "none";

    // نظهر الإعلان
    adContainer.innerHTML = "";
    adContainer.style.display = "flex";

    // كود الإعلان
    const configScript =
        document.createElement("script");

    configScript.textContent = `
        atOptions = {
            'key' : '0a02ffbb864c2862a09fc1d5f9486047',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
        };
    `;

    adContainer.appendChild(configScript);

    const adScript =
        document.createElement("script");

    adScript.src =
        "https://www.highperformanceformat.com/0a02ffbb864c2862a09fc1d5f9486047/invoke.js";

    adScript.async = true;

    adContainer.appendChild(adScript);

    // بعد 8 ثواني ننتقل للسؤال التالي
    setTimeout(() => {

        adContainer.style.display = "none";
        adContainer.innerHTML = "";

        image.style.display = "block";

        currentQuestion++;

        if (currentQuestion >= quizWords.length) {

            finishQuiz();

        } else {

            showQuestion();

        }

    }, 8000);
}