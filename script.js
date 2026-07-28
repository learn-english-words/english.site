
function startLearning() {
    window.location.href = "learn.html";
}


function comingSoon(name) {

    // إذا ضغط على الإعدادات
    if (name === "الإعدادات") {
        window.location.href = "admin.html";
        return;
    }

    // باقي الأزرار مؤقتًا
    alert("ميزة " + name + " بنضيفها قريباً 🚀");
}

