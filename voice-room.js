const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const qs = new URLSearchParams(location.search);
const groupId = qs.get("group");
const groupName = qs.get("name") || "الغرفة الصوتية";
const audioConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

let user;
let profile;
let channel;
let stream;
let muted = false;
let hand = false;
let startedAt = Date.now();
let peers = new Map();
let unread = 0;
let microphoneBusy = false;
const topics = ["What made you smile today?", "What is your dream travel destination?", "Describe your perfect weekend.", "What new English word did you learn?", "Would you rather live by the sea or in the mountains?", "Tell us about your favorite food."];
let topicIndex = 0;

function toast(text) {
    $("roomToast").textContent = text;
    $("roomToast").classList.add("show");
    setTimeout(() => $("roomToast").classList.remove("show"), 2500);
}

function setMuteButton() {
    $("muteBtn").classList.toggle("active", muted);
    $("muteBtn").innerHTML = muted ? "<span>🔇</span><small>تشغيل</small>" : "<span>🎙️</span><small>كتم</small>";
}

async function init() {
    if (!groupId) { location.href = "groups.html"; return; }
    const { data: { user: signedUser } } = await supabaseClient.auth.getUser();
    if (!signedUser) { location.href = "login.html"; return; }
    user = signedUser;
    const { data: membership } = await supabaseClient.from("group_members").select("id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
    if (!membership) { alert("هذه الغرفة متاحة لأعضاء المجموعة فقط."); location.href = "groups.html"; return; }
    const { data: savedProfile } = await supabaseClient.from("profiles").select("id,display_name").eq("id", user.id).maybeSingle();
    profile = savedProfile || { id: user.id, display_name: user.user_metadata?.name || "مستخدم" };
    $("roomName").textContent = groupName;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        watchMicrophoneTrack(stream.getAudioTracks()[0]);
    } catch (error) {
        alert("اسمح للموقع باستخدام الميكروفون ثم حاول مرة أخرى.");
        location.href = "groups.html";
        return;
    }
    connect();
    setInterval(updateTimer, 1000);
}

function watchMicrophoneTrack(track) {
    if (!track) return;
    track.onended = () => {
        if (!muted) {
            muted = true;
            setMuteButton();
            updatePresence();
            toast("توقف الميكروفون. اضغط تشغيل لإعادته");
        }
    };
}

function connect() {
    channel = supabaseClient.channel(`voice-group-${groupId}`, { config: { presence: { key: user.id }, broadcast: { self: false } } });
    channel
        .on("presence", { event: "sync" }, renderPeople)
        .on("presence", { event: "leave" }, ({ key }) => removePeer(key))
        .on("broadcast", { event: "voice-signal" }, ({ payload }) => signal(payload))
        .on("broadcast", { event: "room-chat" }, ({ payload }) => addMessage(payload))
        .subscribe(async status => {
            if (status === "SUBSCRIBED") {
                await updatePresence();
                send({ kind: "join" });
            }
        });
}

const send = message => channel?.send({ type: "broadcast", event: "voice-signal", payload: { ...message, sender_id: user.id } });

function peer(id) {
    if (peers.has(id)) return peers.get(id);
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] });
    const connection = { pc, q: [] };
    peers.set(id, connection);
    stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));
    pc.onicecandidate = event => event.candidate && send({ kind: "candidate", target_id: id, candidate: event.candidate });
    pc.ontrack = event => {
        let audio = document.querySelector(`audio[data-u="${id}"]`);
        if (!audio) {
            audio = document.createElement("audio");
            audio.autoplay = true;
            audio.playsInline = true;
            audio.dataset.u = id;
            $("remoteAudioContainer").appendChild(audio);
        }
        audio.srcObject = event.streams[0];
        audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => ["failed", "closed"].includes(pc.connectionState) && removePeer(id);
    return connection;
}

async function signal(signalData) {
    if (signalData.sender_id === user.id || (signalData.target_id && signalData.target_id !== user.id)) return;
    try {
        if (signalData.kind === "join") {
            const connection = peer(signalData.sender_id);
            const offer = await connection.pc.createOffer();
            await connection.pc.setLocalDescription(offer);
            send({ kind: "offer", target_id: signalData.sender_id, description: connection.pc.localDescription });
        } else if (signalData.kind === "offer") {
            const connection = peer(signalData.sender_id);
            await connection.pc.setRemoteDescription(signalData.description);
            await flush(connection);
            const answer = await connection.pc.createAnswer();
            await connection.pc.setLocalDescription(answer);
            send({ kind: "answer", target_id: signalData.sender_id, description: connection.pc.localDescription });
        } else {
            const connection = peer(signalData.sender_id);
            if (signalData.kind === "answer") {
                await connection.pc.setRemoteDescription(signalData.description);
                await flush(connection);
            } else if (signalData.kind === "candidate") {
                connection.pc.remoteDescription ? await connection.pc.addIceCandidate(signalData.candidate) : connection.q.push(signalData.candidate);
            }
        }
    } catch (error) {
        console.error("Voice signaling error:", error);
    }
}

async function flush(connection) {
    while (connection.q.length) await connection.pc.addIceCandidate(connection.q.shift());
}

function removePeer(id) {
    peers.get(id)?.pc.close();
    peers.delete(id);
    document.querySelector(`audio[data-u="${id}"]`)?.remove();
}

function renderPeople() {
    const people = Object.values(channel.presenceState()).flat();
    const speakers = people.filter(person => person.role !== "listener");
    const listeners = people.filter(person => person.role === "listener");
    $("speakerCount").textContent = `${speakers.length}/6`;
    $("audienceCount").textContent = listeners.length;
    $("speakerGrid").innerHTML = speakers.map(person => `<article class="speaker"><div class="avatar-wrap"><div class="avatar">${esc((person.name || "م")[0])}</div><span class="mic-state">${person.muted ? "🔇" : "🎙️"}</span></div><h3>${esc(person.user_id === user.id ? "أنت" : person.name)}</h3><p>${person.hand ? "✋ يطلب التحدث" : "متحدث"}</p></article>`).join("") || '<p class="empty-note">لا يوجد متحدثون</p>';
    $("audienceList").innerHTML = listeners.map(person => `<span class="audience-person"><i>${esc((person.name || "م")[0])}</i>${esc(person.name)}</span>`).join("") || '<p class="empty-note">لا يوجد مستمعون حاليًا</p>';
}

async function updatePresence() {
    if (!channel) return;
    await channel.track({ user_id: user.id, name: profile.display_name, role: "speaker", muted, hand });
}

async function restoreMicrophone() {
    let track = stream?.getAudioTracks()[0];
    if (!track || track.readyState === "ended") {
        const replacementStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        track = replacementStream.getAudioTracks()[0];
        const oldTracks = stream?.getAudioTracks() || [];
        stream = replacementStream;
        watchMicrophoneTrack(track);
        await Promise.all([...peers.values()].map(async ({ pc }) => {
            const sender = pc.getSenders().find(item => item.track?.kind === "audio" || item.track === null);
            if (sender) await sender.replaceTrack(track);
            else pc.addTrack(track, stream);
        }));
        oldTracks.forEach(oldTrack => { oldTrack.onended = null; oldTrack.stop(); });
    } else {
        await Promise.all([...peers.values()].map(async ({ pc }) => {
            const sender = pc.getSenders().find(item => item.track?.kind === "audio");
            if (sender && sender.track !== track) await sender.replaceTrack(track);
        }));
    }
    track.enabled = true;
    return track;
}

async function toggleMute() {
    if (microphoneBusy) return;
    microphoneBusy = true;
    $("muteBtn").disabled = true;
    try {
        if (!muted) {
            stream?.getAudioTracks().forEach(track => { track.enabled = false; });
            muted = true;
            setMuteButton();
            await updatePresence();
        } else {
            await restoreMicrophone();
            muted = false;
            setMuteButton();
            await updatePresence();
            toast("تم تشغيل الميكروفون");
        }
    } catch (error) {
        console.error("Microphone restore error:", error);
        muted = true;
        setMuteButton();
        toast("تعذر تشغيل الميكروفون. تحقق من إذن المتصفح");
    } finally {
        microphoneBusy = false;
        $("muteBtn").disabled = false;
    }
}

function toggleHand() {
    hand = !hand;
    $("handBtn").classList.toggle("active", hand);
    $("handBtn").innerHTML = hand ? "<span>✋</span><small>أنزل يدك</small>" : "<span>✋</span><small>ارفع يدك</small>";
    updatePresence();
    toast(hand ? "تم رفع يدك" : "تم إنزال يدك");
}

function addMessage(message) {
    const element = document.createElement("div");
    element.className = "room-msg";
    element.innerHTML = `<strong>${esc(message.name)}</strong><p>${esc(message.text)}</p>`;
    $("roomMessages").appendChild(element);
    $("roomMessages").scrollTop = $("roomMessages").scrollHeight;
    if (!$("sidePanel").classList.contains("show")) {
        $("chatBadge").hidden = false;
        $("chatBadge").textContent = ++unread;
    }
}

async function leave() {
    stream?.getTracks().forEach(track => track.stop());
    for (const id of peers.keys()) removePeer(id);
    if (channel) { await channel.untrack(); await supabaseClient.removeChannel(channel); }
    location.href = "groups.html";
}

function updateTimer() {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    $("roomTimer").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

$("backBtn").onclick = leave;
$("leaveBtn").onclick = leave;
$("muteBtn").onclick = toggleMute;
$("handBtn").onclick = toggleHand;
$("nextTopicBtn").onclick = () => { $("topicText").textContent = topics[++topicIndex % topics.length]; };
$("chatBtn").onclick = () => { $("sidePanel").classList.add("show"); unread = 0; $("chatBadge").hidden = true; };
$("closeChatBtn").onclick = () => $("sidePanel").classList.remove("show");
$("shareBtn").onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast("تم نسخ رابط الغرفة"); } catch { toast("تعذر نسخ الرابط"); } };
$("roomMessageForm").onsubmit = event => {
    event.preventDefault();
    const input = $("roomMessageInput");
    const text = input.value.trim();
    if (!text) return;
    const message = { name: profile.display_name, text, sender_id: user.id };
    channel.send({ type: "broadcast", event: "room-chat", payload: message });
    addMessage(message);
    input.value = "";
};
window.addEventListener("beforeunload", () => { stream?.getTracks().forEach(track => track.stop()); });
init();
