
// ==========================================
// تقدمي
// ==========================================

async function loadProgress() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        window.location.href = "login.html";

        return;
    }


    // ==========================================
    // الكلمات المتعلمة
    // ==========================================

    const {
        data: learnedWords,
        error: learnedError
    } = await supabaseClient
        .from("learned_words")
        .select("id")
        .eq("user_id", user.id);


    if (learnedError) {

        console.error(
            "Learned words error:",
            learnedError
        );

    }


    const learnedCount =
        learnedWords
            ? learnedWords.length
            : 0;


    document.getElementById(
        "learnedWords"
    ).textContent =
        learnedCount;


    // ==========================================
    // الكلمات المحفوظة
    // ==========================================

    const {
        data: favorites,
        error: favoritesError
    } = await supabaseClient
        .from("favorites")
        .select("id")
        .eq("user_id", user.id);


    if (favoritesError) {

        console.error(
            "Favorites error:",
            favoritesError
        );

    }


    const favoritesCount =
        favorites
            ? favorites.length
            : 0;


    document.getElementById(
        "favoriteWords"
    ).textContent =
        favoritesCount;


    // ==========================================
    // كلمات المراجعة
    // ==========================================

    const {
        data: reviews,
        error: reviewsError
    } = await supabaseClient
        .from("review_words")
        .select("id")
        .eq("user_id", user.id);


    if (reviewsError) {

        console.error(
            "Review words error:",
            reviewsError
        );

    }


    const reviewsCount =
        reviews
            ? reviews.length
            : 0;


    document.getElementById(
        "reviewWords"
    ).textContent =
        reviewsCount;


    // ==========================================
    // الاختبارات المكتملة
    // ==========================================

    const {
        data: quizzes,
        error: quizzesError
    } = await supabaseClient
        .from("quiz_results")
        .select("id, score, total_questions")
        .eq("user_id", user.id);


    if (quizzesError) {

        console.error(
            "Quiz results error:",
            quizzesError
        );

    }


    const quizzesCount =
        quizzes
            ? quizzes.length
            : 0;


    const completedQuizzes =
        document.getElementById(
            "completedQuizzes"
        );


    if (completedQuizzes) {

        completedQuizzes.textContent =
            quizzesCount;

    }


    // ==========================================
    // تحديات اليوم
    // ==========================================

    const {
        data: challenges,
        error: challengesError
    } = await supabaseClient
        .from("daily_challenges")
        .select("*")
        .eq("user_id", user.id);


    if (challengesError) {

        console.error(
            "Daily challenges error:",
            challengesError
        );

    }


    const challengesCount =
        challenges
            ? challenges.length
            : 0;


    document.getElementById(
        "dailyChallenges"
    ).textContent =
        challengesCount;


    // ==========================================
    // متوسط نتيجة الاختبارات + التحديات
    // ==========================================

    let totalScore = 0;

    let totalQuestions = 0;


    if (quizzes) {

        quizzes.forEach(quiz => {

            totalScore +=
                Number(
                    quiz.score || 0
                );

            totalQuestions +=
                Number(
                    quiz.total_questions || 0
                );

        });

    }


    if (challenges) {

        challenges.forEach(challenge => {

            totalScore +=
                Number(
                    challenge.score || 0
                );

            totalQuestions +=
                Number(
                    challenge.total_questions || 0
                );

        });

    }


    let average = 0;


    if (totalQuestions > 0) {

        average =
            Math.round(
                (
                    totalScore /
                    totalQuestions
                ) * 100
            );

    }


    document.getElementById(
        "averageScore"
    ).textContent =
        average + "%";


    // ==========================================
    // أفضل نتيجة
    // ==========================================

    let bestScore = 0;

    let bestTotal = 10;


    if (quizzes) {

        quizzes.forEach(quiz => {

            const quizScore =
                Number(
                    quiz.score || 0
                );


            const quizTotal =
                Number(
                    quiz.total_questions || 10
                );


            if (
                quizScore >
                bestScore
            ) {

                bestScore =
                    quizScore;

                bestTotal =
                    quizTotal;

            }

        });

    }


    if (challenges) {

        challenges.forEach(challenge => {

            const challengeScore =
                Number(
                    challenge.score || 0
                );


            const challengeTotal =
                Number(
                    challenge.total_questions || 10
                );


            if (
                challengeScore >
                bestScore
            ) {

                bestScore =
                    challengeScore;

                bestTotal =
                    challengeTotal;

            }

        });

    }


    document.getElementById(
        "bestScore"
    ).textContent =
        bestScore +
        " / " +
        bestTotal;


    // ==========================================
    // التقدم العام
    // ==========================================

    const {
        data: allWords,
        error: allWordsError
    } = await supabaseClient
        .from("words")
        .select("id");


    if (allWordsError) {

        console.error(
            "All words error:",
            allWordsError
        );

    }


    const totalWords =
        allWords
            ? allWords.length
            : 0;


    let progress = 0;


    if (totalWords > 0) {

        progress =
            Math.round(
                (
                    learnedCount /
                    totalWords
                ) * 100
            );

    }


    if (progress > 100) {

        progress = 100;

    }


    document.getElementById(
        "progressPercent"
    ).textContent =
        progress + "%";


    document.getElementById(
        "overallProgressFill"
    ).style.width =
        progress + "%";

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

loadProgress();

