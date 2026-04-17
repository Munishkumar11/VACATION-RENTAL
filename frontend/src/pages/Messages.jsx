import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaSearch } from "react-icons/fa";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";

const initialConversations = [
  {
    id: 1, name: "Priya Sharma", role: "Host · Goa Apartment", time: "2h ago", unread: true, color: "#c0392b", initials: "PS",
    messages: [
      { type: "theirs", text: "Hello! Thank you for booking my apartment in Goa.", time: "Yesterday" },
      { type: "mine", text: "Hi Priya! Very excited about the stay. Quick question — is parking available?", time: "Yesterday" },
      { type: "theirs", text: "Yes, there is covered parking for one car included. Let me know if you need anything else!", time: "Yesterday" },
      { type: "mine", text: "Perfect, thank you so much!", time: "10:00 AM" },
      { type: "theirs", text: "See you on the 15th! Check-in is at 3 PM.", time: "2h ago" },
    ],
  },
  {
    id: 2, name: "Rahul Mehta", role: "Host · Manali Cottage", time: "1d ago", unread: false, color: "#27ae60", initials: "RM",
    messages: [
      { type: "theirs", text: "Welcome! The cottage is all set for May. The mountains should be beautiful.", time: "2 days ago" },
      { type: "mine", text: "Can't wait! Will it be cold? Should we pack heavy jackets?", time: "2 days ago" },
      { type: "theirs", text: "Yes, definitely bring warm clothes. Temperatures drop to 5°C at night.", time: "1 day ago" },
      { type: "mine", text: "Thanks for the heads up!", time: "1 day ago" },
      { type: "theirs", text: "Great! I'll have the fireplace ready for you.", time: "1d ago" },
    ],
  },
  {
    id: 3, name: "Ananya Patel", role: "Host · Kerala Bungalow", time: "3d ago", unread: false, color: "#8e44ad", initials: "AP",
    messages: [
      { type: "theirs", text: "Hope you had a wonderful stay at the bungalow!", time: "4 days ago" },
      { type: "mine", text: "It was absolutely amazing. The sunrise over the sea was breathtaking!", time: "4 days ago" },
      { type: "theirs", text: "So happy to hear that! You're welcome back anytime.", time: "3 days ago" },
      { type: "theirs", text: "Hope you enjoyed your stay! Please leave a review.", time: "3d ago" },
    ],
  },
];

export default function Messages() {

  const socket = useRef(null);

  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, activeConv?.messages.length]);
  
  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [activeId, activeConv?.messages.length]);

useEffect(() => {
  socket.current = io("/");

  // join user (replace with real user id later)
  socket.current.emit("join", "user1");

  // receive message
  socket.current.on("getMessage", (data) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { type: "theirs", text: data.message, time: "Just now" },
              ],
            }
          : c
      )
    );
  });

  return () => {
    socket.current.disconnect();
  };
}, [activeId]);

  const openConv = (id) => {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: false } : c))
    );
  };

 const sendMessage = async () => {
  const text = inputText.trim();
  if (!text || !activeId) return;

  const messageData = {
    senderId: "user1",
    receiverId: activeId,
    message: text,
  };

  // ✅ realtime send
  socket.current.emit("sendMessage", messageData);

  // ✅ save in DB
  await fetch("/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageData),
  });

  // ✅ UI update
  setConversations((prev) =>
    prev.map((c) =>
      c.id === activeId
        ? {
            ...c,
            messages: [
              ...c.messages,
              { type: "mine", text, time: "Just now" },
            ],
            time: "Just now",
          }
        : c
    )
  );

  setInputText("");
};
  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };
  const isLoggedIn = document.cookie.includes("token");
  if (!isLoggedIn) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ec", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", border: "1px solid #e0dbd0", borderRadius: 14, padding: 32, textAlign: "center", maxWidth: 360 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#2d3a1e", marginBottom: 8 }}>Please login first</p>
        <p style={{ fontSize: 13, color: "#9a9476", marginBottom: 20 }}>Login or signup to view your messages</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/login" style={{ padding: "8px 20px", border: "1px solid #d6cebc", borderRadius: 8, fontSize: 13, color: "#3d5028", textDecoration: "none" }}>Login</Link>
          <Link to="/signup" style={{ padding: "8px 20px", background: "#6b8c3e", borderRadius: 8, fontSize: 13, color: "white", textDecoration: "none" }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Messages</h1>
        <p style={styles.subtitle}>Chat with your hosts</p>
      </div>

      <div style={styles.layout}>
        {/* Conversation List */}
        <div style={styles.convList}>
          <div style={styles.searchBox}>
            <FaSearch size={12} color="#6b6b60" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredConvs.map((c) => (
            <div
              key={c.id}
              style={{ ...styles.convItem, ...(activeId === c.id ? styles.convItemActive : {}) }}
              onClick={() => openConv(c.id)}
            >
              <div style={{ ...styles.convAvatar, background: c.color }}>{c.initials}</div>
              <div style={styles.convBody}>
                <div style={styles.convNameRow}>
                  <span style={styles.convName}>{c.name}</span>
                  <span style={styles.convTime}>{c.time}</span>
                </div>
                <div style={styles.convRole}>{c.role}</div>
                <div style={styles.convPreview}>
                  {c.messages[c.messages.length - 1]?.text}
                </div>
              </div>
              {c.unread && <div style={styles.unreadDot} />}
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {!activeConv ? (
            <div style={styles.emptyChat}>
              <span style={{ fontSize: 44 }}>💬</span>
              <p style={styles.emptyChatTitle}>Select a conversation</p>
              <p style={styles.emptyChatSub}>Choose a chat to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <div style={{ ...styles.chatHeaderAvatar, background: activeConv.color }}>
                  {activeConv.initials}
                </div>
                <div>
                  <p style={styles.chatHostName}>{activeConv.name}</p>
                  <p style={styles.chatHostRole}>{activeConv.role}</p>
                </div>
              </div>

              {/* Messages */}
              <div style={styles.messages}>
                {activeConv.messages.map((msg, i) => (
                  <div key={i} style={{ ...styles.msgWrapper, justifyContent: msg.type === "mine" ? "flex-end" : "flex-start" }}>
                    <div>
                      <div style={{ ...styles.bubble, ...(msg.type === "mine" ? styles.bubbleMine : styles.bubbleTheirs) }}>
                        {msg.text}
                      </div>
                      <div style={{ ...styles.msgTime, textAlign: msg.type === "mine" ? "right" : "left" }}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={styles.inputArea}>
                <input
                  style={styles.textInput}
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button style={styles.sendBtn} onClick={sendMessage}>
                  <FaPaperPlane size={14} color="white" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "32px 28px", maxWidth: 1200, margin: "0 auto" },
  header: { marginBottom: 28 },
  h1: { fontSize: 26, fontWeight: 700, color: "#1a1a1a" },
  subtitle: { color: "#6b6b60", fontSize: 14, marginTop: 4 },
  layout: { display: "grid", gridTemplateColumns: "320px 1fr", background: "#fff", border: "1px solid #e0e0d8", borderRadius: 14, overflow: "hidden", height: 560 },
  convList: { borderRight: "1px solid #e0e0d8", overflowY: "auto" },
  searchBox: { padding: "12px 14px", borderBottom: "1px solid #e0e0d8", position: "relative" },
  searchInput: { width: "100%", padding: "8px 10px 8px 28px", border: "1px solid #e0e0d8", borderRadius: 10, fontSize: 13, outline: "none", background: "#f9f9f6", color: "#1a1a1a" },
  convItem: { display: "flex", gap: 12, padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid #e0e0d8", position: "relative", transition: "background 0.1s" },
  convItemActive: { background: "#e8f5e8" },
  convAvatar: { width: 44, height: 44, borderRadius: "50%", fontSize: 15, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  convBody: { flex: 1, minWidth: 0 },
  convNameRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  convName: { fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  convTime: { fontSize: 11, color: "#6b6b60" },
  convRole: { fontSize: 11, color: "#2d6a2d", fontWeight: 500, marginTop: 1 },
  convPreview: { fontSize: 12, color: "#6b6b60", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  unreadDot: { width: 8, height: 8, background: "#2d6a2d", borderRadius: "50%", position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" },
  chatArea: { display: "flex", flexDirection: "column" },
  emptyChat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#fafaf7" },
  emptyChatTitle: { fontSize: 15, fontWeight: 600, color: "#1a1a1a" },
  emptyChatSub: { fontSize: 13, color: "#6b6b60" },
  chatHeader: { padding: "14px 20px", borderBottom: "1px solid #e0e0d8", display: "flex", alignItems: "center", gap: 12 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: "50%", fontSize: 14, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" },
  chatHostName: { fontSize: 15, fontWeight: 700, color: "#1a1a1a" },
  chatHostRole: { fontSize: 12, color: "#6b6b60" },
  messages: { flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "#fafaf7" },
  msgWrapper: { display: "flex" },
  bubble: { padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: 1.5, maxWidth: 340 },
  bubbleMine: { background: "#2d6a2d", color: "white", borderBottomRightRadius: 4 },
  bubbleTheirs: { background: "white", color: "#1a1a1a", border: "1px solid #e0e0d8", borderBottomLeftRadius: 4 },
  msgTime: { fontSize: 11, color: "#6b6b60", marginTop: 3 },
  inputArea: { padding: "14px 16px", borderTop: "1px solid #e0e0d8", display: "flex", gap: 10, alignItems: "center" },
  textInput: { flex: 1, padding: "10px 14px", border: "1.5px solid #e0e0d8", borderRadius: 22, fontSize: 13, outline: "none", background: "#f9f9f6", color: "#1a1a1a" },
  sendBtn: { width: 38, height: 38, borderRadius: "50%", background: "#3a7a3a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};
