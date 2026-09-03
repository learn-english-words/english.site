let currentUser = null;
let currentProfile = null;
let groups = [];
let selectedGroup = null;
let profilesById = new Map();
let messagesChannel = null;

const byId = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const displayName = profile => profile?.display_name || "مستخدم";
const formatTime = value => new Date(value).toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" });

function showModal(id) { byId(id).classList.add("show"); }
function hideModal(id) { byId(id).classList.remove("show"); }
function showError(message) { alert(message || "حدث خطأ غير متوقع، حاول مرة أخرى."); }

async function init() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) { location.href = "login.html"; return; }
    currentUser = user;
    const { data: profile } = await supabaseClient.from("profiles").select("id, display_name, is_public").eq("id", user.id).maybeSingle();
    currentProfile = profile || { id: user.id, display_name: user.user_metadata?.name || user.email?.split("@")[0] || "مستخدم" };
    profilesById.set(currentUser.id, currentProfile);
    await Promise.all([loadGroups(), loadInvitations()]);
}

async function loadGroups(selectId = null) {
    const { data, error } = await supabaseClient
        .from("group_members")
        .select("role, joined_at, groups(id, name, description, owner_id, created_at)")
        .eq("user_id", currentUser.id)
        .order("joined_at", { ascending: false });
    if (error) { byId("groupsList").innerHTML = '<div class="empty-state">تعذّر تحميل المجموعات. تأكد من تنفيذ ملف إعداد قاعدة البيانات.</div>'; return; }
    groups = (data || []).map(item => ({ ...item.groups, role: item.role })).filter(item => item.id);
    renderGroups();
    const groupToOpen = groups.find(group => group.id === (selectId || selectedGroup?.id));
    if (groupToOpen) await openGroup(groupToOpen);
}

function renderGroups() {
    byId("groupsCount").textContent = groups.length;
    if (!groups.length) {
        byId("groupsList").innerHTML = '<div class="empty-state"><span class="emoji">🌱</span><strong>ما عندك مجموعات حتى الآن</strong><p>أنشئ أول مجموعة وادعُ أصدقاءك للتدرّب معًا.</p></div>';
        return;
    }
    byId("groupsList").innerHTML = groups.map(group => `
        <button class="group-card ${selectedGroup?.id === group.id ? "active" : ""}" type="button" data-group-id="${group.id}">
            <h3>${escapeHtml(group.name)}</h3>
            <p>${escapeHtml(group.description || "مجموعة للتعلّم والمحادثة")}</p>
        </button>`).join("");
    byId("groupsList").querySelectorAll("[data-group-id]").forEach(button => button.addEventListener("click", () => {
        const group = groups.find(item => item.id === button.dataset.groupId);
        if (group) openGroup(group);
    }));
}

async function loadInvitations() {
    const { data, error } = await supabaseClient
        .from("group_invitations")
        .select("id, group_id, inviter_id, created_at, groups(name)")
        .eq("invitee_id", currentUser.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
    if (error || !data?.length) {
        byId("invitesSection").classList.add("hidden");
        return;
    }
    const inviterIds = [...new Set(data.map(item => item.inviter_id))];
    const { data: inviters } = await supabaseClient.from("profiles").select("id, display_name").in("id", inviterIds);
    (inviters || []).forEach(profile => profilesById.set(profile.id, profile));
    byId("invitesCount").textContent = data.length;
    byId("invitesSection").classList.remove("hidden");
    byId("invitesList").innerHTML = data.map(invite => `
        <article class="invite-card">
            <strong>${escapeHtml(invite.groups?.name || "مجموعة")}</strong>
            <span>دعوة من ${escapeHtml(displayName(profilesById.get(invite.inviter_id)))}</span>
            <div class="invite-actions">
                <button class="primary-btn small-btn" data-accept="${invite.id}" data-group="${invite.group_id}" type="button">قبول</button>
                <button class="ghost-btn small-btn" data-decline="${invite.id}" type="button">رفض</button>
            </div>
        </article>`).join("");
    byId("invitesList").querySelectorAll("[data-accept]").forEach(button => button.addEventListener("click", () => answerInvitation(button.dataset.accept, "accepted", button.dataset.group)));
    byId("invitesList").querySelectorAll("[data-decline]").forEach(button => button.addEventListener("click", () => answerInvitation(button.dataset.decline, "declined")));
}

async function answerInvitation(invitationId, status, groupId = null) {
    const { error } = await supabaseClient.from("group_invitations").update({ status, responded_at: new Date().toISOString() }).eq("id", invitationId).eq("invitee_id", currentUser.id);
    if (error) { showError(error.message); return; }
    await Promise.all([loadInvitations(), loadGroups(groupId)]);
}

async function openGroup(group) {
    selectedGroup = group;
    renderGroups();
    byId("welcomeState").classList.add("hidden");
    byId("chatView").classList.add("show");
    byId("chatPanel").classList.add("mobile-open");
    byId("groupTitle").textContent = group.name;
    byId("groupAvatar").textContent = group.name.trim().charAt(0).toUpperCase() || "G";
    byId("inviteBtn").hidden = group.owner_id !== currentUser.id;
    const { count } = await supabaseClient.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", group.id);
    byId("groupMeta").textContent = `${count || 1} ${count === 1 ? "عضو" : "أعضاء"}`;
    await loadMessages();
    subscribeToMessages();
}

async function loadMessages() {
    if (!selectedGroup) return;
    byId("messages").innerHTML = '<div class="loading">جاري تحميل الرسائل...</div>';
    const { data, error } = await supabaseClient
        .from("group_messages")
        .select("id, group_id, sender_id, message, created_at, profiles(display_name)")
        .eq("group_id", selectedGroup.id)
        .order("created_at", { ascending: true })
        .limit(300);
    if (error) { byId("messages").innerHTML = '<div class="empty-state">تعذّر تحميل الرسائل.</div>'; return; }
    if (!data?.length) { byId("messages").innerHTML = '<div class="empty-state">لا توجد رسائل بعد. ابدأ أول محادثة 👋</div>'; return; }
    byId("messages").innerHTML = "";
    data.forEach(message => {
        if (message.profiles) profilesById.set(message.sender_id, { id: message.sender_id, ...message.profiles });
        renderMessage(message, false);
    });
    scrollToBottom();
}

function renderMessage(message, scroll = true) {
    if (byId("messages").querySelector(`[data-message-id="${message.id}"]`)) return;
    const empty = byId("messages").querySelector(".empty-state, .loading");
    if (empty) empty.remove();
    const mine = message.sender_id === currentUser.id;
    const profile = message.profiles || profilesById.get(message.sender_id);
    const element = document.createElement("article");
    element.className = `message${mine ? " mine" : ""}`;
    element.dataset.messageId = message.id;
    element.innerHTML = `<span class="message-name">${escapeHtml(mine ? "أنت" : displayName(profile))}</span><div class="message-text">${escapeHtml(message.message)}</div><time class="message-time">${formatTime(message.created_at)}</time>`;
    byId("messages").appendChild(element);
    if (scroll) scrollToBottom();
}

function scrollToBottom() { requestAnimationFrame(() => { byId("messages").scrollTop = byId("messages").scrollHeight; }); }

function subscribeToMessages() {
    if (messagesChannel) supabaseClient.removeChannel(messagesChannel);
    messagesChannel = supabaseClient.channel(`group-messages-${selectedGroup.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${selectedGroup.id}` }, async payload => {
            const message = payload.new;
            if (!profilesById.has(message.sender_id)) {
                const { data } = await supabaseClient.from("profiles").select("id, display_name").eq("id", message.sender_id).maybeSingle();
                if (data) profilesById.set(data.id, data);
            }
            renderMessage(message);
        }).subscribe();
}

async function createGroup(event) {
    event.preventDefault();
    const name = byId("groupName").value.trim();
    const description = byId("groupDescription").value.trim();
    if (!name) return;
    const submit = event.submitter;
    submit.disabled = true;
    const { data, error } = await supabaseClient.rpc("create_learning_group", {
        group_name: name,
        group_description: description || null
    });
    submit.disabled = false;
    if (error) { showError(error.message); return; }
    event.target.reset();
    hideModal("createModal");
    await loadGroups(data);
}

async function sendMessage(event) {
    event.preventDefault();
    if (!selectedGroup) return;
    const input = byId("messageInput");
    const text = input.value.trim();
    if (!text) return;
    byId("sendBtn").disabled = true;
    const { data, error } = await supabaseClient.from("group_messages").insert({ group_id: selectedGroup.id, sender_id: currentUser.id, message: text }).select().single();
    byId("sendBtn").disabled = false;
    if (error) { showError(error.message); return; }
    input.value = "";
    renderMessage({ ...data, profiles: currentProfile });
}

async function openInviteModal() {
    if (!selectedGroup || selectedGroup.owner_id !== currentUser.id) return;
    showModal("inviteModal");
    byId("peopleSearch").value = "";
    await loadPeople();
}

async function loadPeople(query = "") {
    byId("peopleList").innerHTML = '<div class="loading">جاري تحميل المستخدمين...</div>';
    const { data: memberRows } = await supabaseClient.from("group_members").select("user_id").eq("group_id", selectedGroup.id);
    const memberIds = new Set((memberRows || []).map(item => item.user_id));
    let request = supabaseClient.from("profiles").select("id, display_name").eq("is_public", true).neq("id", currentUser.id).order("display_name").limit(60);
    if (query.trim()) request = request.ilike("display_name", `%${query.trim()}%`);
    const { data, error } = await request;
    if (error) { byId("peopleList").innerHTML = '<div class="empty-state">تعذّر تحميل المستخدمين.</div>'; return; }
    const people = (data || []).filter(profile => !memberIds.has(profile.id));
    if (!people.length) { byId("peopleList").innerHTML = '<div class="empty-state">لا يوجد مستخدمون مطابقون للدعوة.</div>'; return; }
    byId("peopleList").innerHTML = people.map(profile => `
        <div class="person"><span class="person-avatar">${escapeHtml(displayName(profile).charAt(0).toUpperCase())}</span><strong class="person-name">${escapeHtml(displayName(profile))}</strong><button class="primary-btn small-btn" type="button" data-invite-user="${profile.id}">دعوة</button></div>`).join("");
    byId("peopleList").querySelectorAll("[data-invite-user]").forEach(button => button.addEventListener("click", () => invitePerson(button)));
}

async function invitePerson(button) {
    button.disabled = true;
    const inviteeId = button.dataset.inviteUser;
    const { error } = await supabaseClient.from("group_invitations").upsert({ group_id: selectedGroup.id, inviter_id: currentUser.id, invitee_id: inviteeId, status: "pending", responded_at: null }, { onConflict: "group_id,invitee_id" });
    if (error) { button.disabled = false; showError(error.message); return; }
    button.textContent = "تم الإرسال ✓";
}

let searchTimer;
byId("peopleSearch").addEventListener("input", event => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadPeople(event.target.value), 250); });
byId("openCreateBtn").addEventListener("click", () => showModal("createModal"));
byId("inviteBtn").addEventListener("click", openInviteModal);
byId("createForm").addEventListener("submit", createGroup);
byId("messageForm").addEventListener("submit", sendMessage);
byId("mobileBackBtn").addEventListener("click", () => byId("chatPanel").classList.remove("mobile-open"));
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => hideModal(button.dataset.close)));
document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) hideModal(modal.id); }));
window.addEventListener("beforeunload", () => { if (messagesChannel) supabaseClient.removeChannel(messagesChannel); });
init();
