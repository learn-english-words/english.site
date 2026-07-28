
let selectedLevel = null;
let selectedCategory = null;


// اختيار المستوى
function selectLevel(element, level) {

    document.querySelectorAll(".level-card").forEach(card => {
        card.classList.remove("selected");
    });

    element.classList.add("selected");

    selectedLevel = level;

    updateStartButton();
}


// اختيار التصنيف
function selectCategory(element, category) {

    document.querySelectorAll(".category-card").forEach(card => {
        card.classList.remove("selected");
    });

    element.classList.add("selected");

    selectedCategory = category;

    updateStartButton();
}


// تفعيل زر البداية
function updateStartButton() {

    const button = document.getElementById("startBtn");

    if (selectedLevel && selectedCategory) {
        button.disabled = false;
        button.textContent = "ابدأ التعلم 🚀";
    } else {
        button.disabled = true;
    }
}


// بدء التعلم
function startLearning() {

    if (!selectedLevel || !selectedCategory) {
        return;
    }

    localStorage.setItem("selectedLevel", selectedLevel);
    localStorage.setItem("selectedCategory", selectedCategory);

    window.location.href = "words.html";
}


// الرجوع للرئيسية
function goHome() {
    window.location.href = "index.html";
}
