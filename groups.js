let currentUser = null;
let currentProfile = null;
let groups = [];
let selectedGroup = null;
let profilesById = new Map();
let messagesChannel = null;
let callChannel = null;
let localAudioStream = null;
let callPeers = new Map();
let callMuted = false;

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
    await loadPublicGroups();
}

async function loadGroups(selectId = null) {
    let { data, error } = await supabaseClient
        .from("group_members")
        .select("role, joined_at, groups(id, name, description, owner_id, created_at, is_public)")
        .eq("user_id", currentUser.id)
        .order("joined_at", { ascending: false });
    if (error?.message?.includes("is_public")) {
        const legacyResult = await supabaseClient
            .from("group_members")
            .select("role, joined_at, groups(id, name, description, owner_id, created_at)")
            .eq("user_id", currentUser.id)
            .order("joined_at", { ascending: false });
        data = legacyResult.data;
        error = legacyResult.error;
    }
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
            <span class="group-visibility ${group.is_public ? "" : "private"}">${group.is_public ? "🌐 عامة" : "🔒 خاصة"}</span>
        </button>`).join("");
    byId("groupsList").querySelectorAll("[data-group-id]").forEach(button => button.addEventListener("click", () => {
        const group = groups.find(item => item.id === button.dataset.groupId);
        if (group) openGroup(group);
    }));
}

async function loadPublicGroups() {
    const memberIds = new Set(groups.map(group => group.id));
    const { data, error } = await supabaseClient
        .from("groups")
        .select("id,name,description,owner_id,created_at,is_public")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(30);
    if (error) {
        byId("publicGroupsList").innerHTML = '<div class="empty-state">فعّل ميزة المجموعات العامة من ملف SQL.</div>';
        byId("publicGroupsCount").textContent = "0";
        return;
    }
    const publicGroups = (data || []).filter(group => !memberIds.has(group.id));
    byId("publicGroupsCount").textContent = publicGroups.length;
    if (!publicGroups.length) {
        byId("publicGroupsList").innerHTML = '<div class="empty-state">لا توجد مجموعات عامة جديدة حاليًا.</div>';
        return;
    }
    byId("publicGroupsList").innerHTML = publicGroups.map(group => `
        <article class="public-group-card">
            <div><h3>${escapeHtml(group.name)}</h3><p>${escapeHtml(group.description || "مجموعة عامة لتعلّم الإنجليزية")}</p></div>
            <button type="button" data-join-public="${group.id}">انضمام</button>
        </article>`).join("");
    byId("publicGroupsList").querySelectorAll("[data-join-public]").forEach(button => button.addEventListener("click", () => joinPublicGroup(button)));
}

async function joinPublicGroup(button) {
    button.disabled = true;
    button.textContent = "جاري الانضمام...";
    const { error } = await supabaseClient.rpc("join_public_group", { target_group: button.dataset.joinPublic });
    if (error) {
        button.disabled = false;
        button.textContent = "انضمام";
        showError(error.message);
        return;
    }
    const groupId = button.dataset.joinPublic;
    await loadGroups(groupId);
    await loadPublicGroups();
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
    if (callChannel && selectedGroup?.id !== group.id) await leaveGroupCall();
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
    const isPublic = document.querySelector('input[name="groupVisibility"]:checked')?.value === "public";
    if (!name) return;
    const submit = event.submitter;
    submit.disabled = true;
    const { data, error } = await supabaseClient.rpc("create_learning_group", {
        group_name: name,
        group_description: description || null,
        group_is_public: isPublic
    });
    submit.disabled = false;
    if (error) { showError(error.message); return; }
    event.target.reset();
    hideModal("createModal");
    await loadGroups(data);
    await loadPublicGroups();
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

/* المحادثة الصوتية الجماعية: WebRTC للصوت وSupabase Realtime للإشارات والحضور. */
async function joinGroupCall() {
    if (!selectedGroup || callChannel) return;
    const params = new URLSearchParams({ group: selectedGroup.id, name: selectedGroup.name });
    location.href = `voice-room.html?${params.toString()}`;
    return;
    if (!navigator.mediaDevices?.getUserMedia) {
        showError("متصفحك لا يدعم المكالمات الصوتية.");
        return;
    }
    showModal("callModal");
    byId("callGroupName").textContent = selectedGroup.name;
    byId("callStatus").textContent = "اسمح باستخدام الميكروفون للانضمام...";
    try {
        localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    } catch (error) {
        hideModal("callModal");
        showError("تعذر تشغيل الميكروفون. اسمح للموقع باستخدامه ثم حاول مجددًا.");
        return;
    }
    callMuted = false;
    updateMuteButton();
    byId("callOrb").classList.add("live");
    byId("callStatus").textContent = "أنت داخل المحادثة الصوتية الآن";

    callChannel = supabaseClient.channel(`voice-group-${selectedGroup.id}`, {
        config: { presence: { key: currentUser.id }, broadcast: { self: false } }
    });
    callChannel
        .on("presence", { event: "sync" }, renderCallParticipants)
        .on("presence", { event: "leave" }, ({ key }) => removeCallPeer(key))
        .on("broadcast", { event: "voice-signal" }, ({ payload }) => handleVoiceSignal(payload))
        .subscribe(async status => {
            if (status !== "SUBSCRIBED") return;
            await callChannel.track({ user_id: currentUser.id, name: displayName(currentProfile), joined_at: new Date().toISOString() });
            await sendVoiceSignal({ kind: "join" });
        });
}

async function sendVoiceSignal(message) {
    if (!callChannel) return;
    await callChannel.send({ type: "broadcast", event: "voice-signal", payload: { ...message, sender_id: currentUser.id } });
}

function createCallPeer(userId) {
    if (callPeers.has(userId)) return callPeers.get(userId);
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] });
    const peer = { pc, queuedCandidates: [] };
    callPeers.set(userId, peer);
    localAudioStream.getTracks().forEach(track => pc.addTrack(track, localAudioStream));
    pc.onicecandidate = event => { if (event.candidate) sendVoiceSignal({ kind: "candidate", target_id: userId, candidate: event.candidate }); };
    pc.ontrack = event => {
        let audio = document.querySelector(`audio[data-call-user="${userId}"]`);
        if (!audio) {
            audio = document.createElement("audio");
            audio.autoplay = true;
            audio.dataset.callUser = userId;
            byId("remoteAudioContainer").appendChild(audio);
        }
        audio.srcObject = event.streams[0];
    };
    pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) removeCallPeer(userId);
    };
    return peer;
}

async function handleVoiceSignal(signal) {
    if (!callChannel || signal.sender_id === currentUser.id) return;
    if (signal.target_id && signal.target_id !== currentUser.id) return;
    try {
        if (signal.kind === "join") {
            const peer = createCallPeer(signal.sender_id);
            const offer = await peer.pc.createOffer();
            await peer.pc.setLocalDescription(offer);
            await sendVoiceSignal({ kind: "offer", target_id: signal.sender_id, description: peer.pc.localDescription });
            return;
        }
        if (signal.kind === "offer") {
            const peer = createCallPeer(signal.sender_id);
            await peer.pc.setRemoteDescription(signal.description);
            await flushCallCandidates(peer);
            const answer = await peer.pc.createAnswer();
            await peer.pc.setLocalDescription(answer);
            await sendVoiceSignal({ kind: "answer", target_id: signal.sender_id, description: peer.pc.localDescription });
            return;
        }
        const peer = createCallPeer(signal.sender_id);
        if (signal.kind === "answer") {
            await peer.pc.setRemoteDescription(signal.description);
            await flushCallCandidates(peer);
        } else if (signal.kind === "candidate" && signal.candidate) {
            if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(signal.candidate);
            else peer.queuedCandidates.push(signal.candidate);
        }
    } catch (error) { console.error("Voice call signal error:", error); }
}

async function flushCallCandidates(peer) {
    while (peer.queuedCandidates.length) await peer.pc.addIceCandidate(peer.queuedCandidates.shift());
}

function renderCallParticipants() {
    if (!callChannel) return;
    const state = callChannel.presenceState();
    const people = Object.values(state).flat();
    byId("callPeople").innerHTML = people.map(person => {
        const name = person.user_id === currentUser.id ? "أنت" : (person.name || "عضو");
        return `<span class="call-person"><i>${escapeHtml(name.charAt(0))}</i>${escapeHtml(name)}</span>`;
    }).join("");
    byId("callStatus").textContent = `${people.length || 1} في المحادثة الصوتية`;
}

function toggleCallMute() {
    if (!localAudioStream) return;
    callMuted = !callMuted;
    localAudioStream.getAudioTracks().forEach(track => { track.enabled = !callMuted; });
    updateMuteButton();
}

function updateMuteButton() {
    const button = byId("muteCallBtn");
    button.classList.toggle("muted", callMuted);
    button.innerHTML = callMuted ? "🔇<span>تشغيل</span>" : "🎙️<span>كتم</span>";
}

function removeCallPeer(userId) {
    const peer = callPeers.get(userId);
    if (peer) peer.pc.close();
    callPeers.delete(userId);
    document.querySelector(`audio[data-call-user="${userId}"]`)?.remove();
}

async function leaveGroupCall() {
    for (const userId of [...callPeers.keys()]) removeCallPeer(userId);
    localAudioStream?.getTracks().forEach(track => track.stop());
    localAudioStream = null;
    if (callChannel) {
        await callChannel.untrack();
        await supabaseClient.removeChannel(callChannel);
    }
    callChannel = null;
    byId("callOrb").classList.remove("live");
    byId("callPeople").innerHTML = "";
    hideModal("callModal");
}

let searchTimer;
byId("peopleSearch").addEventListener("input", event => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadPeople(event.target.value), 250); });
byId("openCreateBtn").addEventListener("click", () => showModal("createModal"));
byId("inviteBtn").addEventListener("click", openInviteModal);
byId("createForm").addEventListener("submit", createGroup);
byId("messageForm").addEventListener("submit", sendMessage);
byId("groupCallBtn").addEventListener("click", joinGroupCall);
byId("muteCallBtn").addEventListener("click", toggleCallMute);
byId("leaveCallBtn").addEventListener("click", leaveGroupCall);
byId("mobileBackBtn").addEventListener("click", () => byId("chatPanel").classList.remove("mobile-open"));
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => hideModal(button.dataset.close)));
document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", event => {
    if (event.target !== modal) return;
    if (modal.id === "callModal") return;
    hideModal(modal.id);
}));
window.addEventListener("beforeunload", () => { if (messagesChannel) supabaseClient.removeChannel(messagesChannel); if (callChannel) leaveGroupCall(); });
init();
