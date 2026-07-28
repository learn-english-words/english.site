
// التأكد من حالة تسجيل الدخول
async function checkUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {

        window.location.href = "login.html";

        return null;
    }

    return user;
}


// إظهار بيانات المستخدم
async function showUser() {

    const user = await checkUser();

    if (!user) return;


    // الاسم الذي حفظناه أثناء التسجيل
    const name =
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "مستخدم";


    const userName =
        document.getElementById("userName");

    const userEmail =
        document.getElementById("userEmail");


    if (userName) {

        userName.textContent =
            name;

    }


    if (userEmail) {

        userEmail.textContent =
            user.email;

    }

}


// تسجيل الخروج
async function logout() {

    const { error } =
        await supabaseClient.auth.signOut();


    if (error) {

        alert("حدث خطأ أثناء تسجيل الخروج");

        return;
    }


    window.location.href =
        "login.html";

}

