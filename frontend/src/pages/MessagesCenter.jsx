import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MessageCircle, Search, SendHorizontal, Trash2 } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import axios from "axios";
import api from "../api";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay) {
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (diff < oneDay * 7) {
    return date.toLocaleDateString("en-IN", { weekday: "short" });
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const buildConversationFromMessage = (message, currentUserId) => {
  const isMine = String(message.sender?._id) === String(currentUserId);
  const otherUser = isMine ? message.receiver : message.sender;

  return {
    user: otherUser,
    property: message.property || null,
    lastMessage: message.message,
    lastMessageAt: message.createdAt,
    unreadCount: isMine ? 0 : 1,
  };
};

const getConversationPreview = (thread = []) => {
  const lastMessage = thread[thread.length - 1];

  return {
    lastMessage: lastMessage?.message || "",
    lastMessageAt: lastMessage?.createdAt || null,
  };
};

export default function MessagesCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get("userId");
  const initialPropertyId = searchParams.get("propertyId");

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState("");
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const name = conversation.user?.name?.toLowerCase() || "";
      const role = conversation.user?.role?.toLowerCase() || "";
      const property = conversation.property?.title?.toLowerCase() || "";
      return name.includes(term) || role.includes(term) || property.includes(term);
    });
  }, [conversations, search]);

  const syncConversation = (nextConversation) => {
    setConversations((prev) => {
      const filtered = prev.filter(
        (conversation) => String(conversation.user?._id) !== String(nextConversation.user?._id)
      );
      return [nextConversation, ...filtered];
    });
  };

  const loadConversations = async () => {
    const conversationsRes = await api.getConversations();
    if (!conversationsRes?.success) {
      throw new Error(conversationsRes?.message || "Failed to load conversations");
    }

    const nextConversations = conversationsRes.data || [];
    setConversations(nextConversations);
    return nextConversations;
  };

  const openConversation = async (conversation, options = {}) => {
    const propertyId = options.propertyId || conversation.property?._id || "";
    const userId = conversation.user?._id;
    if (!userId) return;

    setThreadLoading(true);

    try {
      const res = await api.getConversationMessages(userId, propertyId || undefined);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load conversation");
      }

      const preview = getConversationPreview(res.data || []);
      const nextConversation = {
        user: res.participant || conversation.user,
        property: res.property || conversation.property || null,
        lastMessage: preview.lastMessage || conversation.lastMessage || "",
        lastMessageAt: preview.lastMessageAt || conversation.lastMessageAt || null,
        unreadCount: 0,
      };

      setActiveConversation(nextConversation);
      setMessages(res.data || []);
      syncConversation(nextConversation);

      const markReadRes = await api.markConversationRead(userId, propertyId || undefined);
      if (!markReadRes?.success) {
        throw new Error(markReadRes?.message || "Failed to update read status");
      }

      setSearchParams(propertyId ? { userId, propertyId } : { userId }, { replace: true });
    } catch (error) {
      toast.error(error?.message || "Failed to load conversation");
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const profileRes = await axios.get("/user/me");
        const user = profileRes.data?.data;
        setCurrentUser(user);

        const nextConversations = await loadConversations();

        if (initialUserId) {
          const existingConversation =
            nextConversations.find(
              (conversation) => String(conversation.user?._id) === String(initialUserId)
            ) || {
              user: { _id: initialUserId },
              property: initialPropertyId ? { _id: initialPropertyId } : null,
              lastMessage: "",
              lastMessageAt: null,
              unreadCount: 0,
            };

          await openConversation(existingConversation, { propertyId: initialPropertyId });
        } else if (nextConversations.length > 0) {
          await openConversation(nextConversations[0]);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return undefined;

    socketRef.current = io("http://localhost:5000");
    socketRef.current.emit("join", currentUser._id);

    socketRef.current.on("getMessage", async (message) => {
      const nextConversation = buildConversationFromMessage(message, currentUser._id);
      const isActive =
        String(activeConversation?.user?._id) === String(nextConversation.user?._id) &&
        String(activeConversation?.property?._id || "") === String(nextConversation.property?._id || "");

      syncConversation({
        ...nextConversation,
        unreadCount: isActive ? 0 : nextConversation.unreadCount,
      });

      if (isActive) {
        setMessages((prev) => [...prev, message]);
        try {
          await api.markConversationRead(
            nextConversation.user._id,
            nextConversation.property?._id
          );
        } catch {
          // ignore read-sync errors
        }
      }
    });

    socketRef.current.on("messageDeleted", async ({ messageId }) => {
      if (!messageId) return;

      setMessages((prev) =>
        prev.filter((message) => String(message._id) !== String(messageId))
      );

      try {
        await loadConversations();
      } catch {
        // ignore delete-sync errors
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [activeConversation?.property?._id, activeConversation?.user?._id, currentUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeConversation?.user?._id || sending) return;

    setSending(true);

    try {
      const res = await api.sendMessage({
        receiverId: activeConversation.user._id,
        propertyId: activeConversation.property?._id,
        message: text,
      });
      if (!res?.success) {
        throw new Error(res?.message || "Unable to send message");
      }

      const savedMessage = res.data;
      setMessages((prev) => [...prev, savedMessage]);
      syncConversation({
        ...activeConversation,
        lastMessage: savedMessage.message,
        lastMessageAt: savedMessage.createdAt,
        unreadCount: 0,
      });
      setInputText("");
    } catch (error) {
      toast.error(error?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || deletingMessageId) return;

    const confirmed = window.confirm("Delete this message?");
    if (!confirmed) return;

    setDeletingMessageId(messageId);

    try {
      const res = await api.deleteMessage(messageId);
      if (!res?.success) {
        throw new Error(res?.message || "Unable to delete message");
      }

      setMessages((prev) =>
        prev.filter((message) => String(message._id) !== String(messageId))
      );

      try {
        await loadConversations();
      } catch {
        // ignore sidebar refresh errors after a successful delete
      }
    } catch (error) {
      toast.error(error?.message || "Unable to delete message");
    } finally {
      setDeletingMessageId("");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f5f3ec] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#e0dbd0] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#2d3a1e]">Please login first</h1>
          <p className="mt-2 text-sm text-[#8a8267]">
            Sign in to chat with guests, hosts, or users in your workspace.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-[#d6cebc] px-5 py-2.5 text-sm font-medium text-[#3d5028] hover:bg-[#f5f3ec]"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-[#6b8c3e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a7a30]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ec] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2d3a1e]">Messages</h1>
          <p className="mt-1 text-sm text-[#8a8267]">
            {currentUser?.role === "host"
              ? "Chat with your guests and respond in real time."
              : currentUser?.role === "admin"
                ? "Reach any user in the system and monitor conversations."
                : "Stay in touch with hosts before and after your stay."}
          </p>
        </div>

        <div className="grid min-h-[72vh] overflow-hidden rounded-[28px] border border-[#e0dbd0] bg-white shadow-sm lg:grid-cols-[340px_1fr]">
          <aside className="border-b border-[#ece8de] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#ece8de] p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9476]" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search people or properties"
                  className="w-full rounded-2xl border border-[#d6cebc] bg-[#f8f6f0] py-3 pl-10 pr-4 text-sm text-[#2d3a1e] outline-none focus:border-[#6b8c3e]"
                />
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto">
              {loading ? (
                <div className="p-5 text-sm font-medium text-[#8a8267]">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-5 text-sm text-[#8a8267]">
                  No conversations yet. Start from a property, booking, or admin user list.
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive =
                    String(activeConversation?.user?._id) === String(conversation.user?._id);

                  return (
                    <button
                      key={conversation.user?._id}
                      type="button"
                      onClick={() => openConversation(conversation)}
                      className={`flex w-full items-start gap-3 border-b border-[#f3efe6] px-4 py-4 text-left transition-colors ${
                        isActive ? "bg-[#edf3e2]" : "hover:bg-[#faf9f4]"
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6b8c3e] text-sm font-bold text-white">
                        {getInitials(conversation.user?.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-[#2d3a1e]">
                            {conversation.user?.name || "Unknown user"}
                          </p>
                          <span className="shrink-0 text-[11px] text-[#9a9476]">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b8c3e]">
                          {conversation.user?.role || "user"}
                        </p>
                        {conversation.property?.title && (
                          <p className="mt-1 truncate text-xs text-[#7c755e]">
                            {conversation.property.title}
                          </p>
                        )}
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <p className="truncate text-xs text-[#8a8267]">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="rounded-full bg-[#6b8c3e] px-2 py-0.5 text-[10px] font-bold text-white">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[72vh] flex-col bg-[#fcfbf8]">
            {!activeConversation ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e8ecd8] text-[#6b8c3e]">
                  <MessageCircle className="h-9 w-9" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-[#2d3a1e]">Choose a conversation</h2>
                <p className="mt-2 max-w-md text-sm text-[#8a8267]">
                  Your messages with hosts, guests, and users will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-[#ece8de] bg-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6b8c3e] text-sm font-bold text-white">
                      {getInitials(activeConversation.user?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[#2d3a1e]">
                        {activeConversation.user?.name}
                      </p>
                      <p className="truncate text-sm text-[#7c755e]">
                        {activeConversation.user?.role}
                        {activeConversation.property?.title
                          ? ` • ${activeConversation.property.title}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                  {threadLoading ? (
                    <div className="text-sm font-medium text-[#8a8267]">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="text-lg font-semibold text-[#2d3a1e]">No messages yet</p>
                      <p className="mt-2 max-w-md text-sm text-[#8a8267]">
                        Send the first message to start this conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isMine =
                          String(message.sender?._id) === String(currentUser?._id);

                        return (
                          <div
                            key={message._id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`group flex max-w-[85%] flex-col md:max-w-[70%] ${
                                isMine ? "items-end" : "items-start"
                              }`}
                            >
                              {message.property?.title && (
                                <p
                                  className={`mb-1 text-[11px] ${
                                    isMine ? "text-right text-[#6b8c3e]" : "text-[#7c755e]"
                                  }`}
                                >
                                  {message.property.title}
                                </p>
                              )}
                              <div className={`flex items-start gap-2 ${isMine ? "justify-end" : ""}`}>
                                {isMine && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(message._id)}
                                    disabled={deletingMessageId === message._id}
                                    className="mt-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d6cebc] bg-white text-[#8a8267] opacity-0 transition hover:border-[#d27d63] hover:text-[#d27d63] focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
                                    aria-label="Delete message"
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                                <div
                                  className={`rounded-3xl px-4 py-3 text-sm leading-6 ${
                                    isMine
                                      ? "rounded-br-md bg-[#6b8c3e] text-white"
                                      : "rounded-bl-md border border-[#e0dbd0] bg-white text-[#2d3a1e]"
                                  }`}
                                >
                                  {message.message}
                                </div>
                              </div>
                              <p
                                className={`mt-1 text-[11px] text-[#9a9476] ${
                                  isMine ? "text-right" : "text-left"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-[#ece8de] bg-white p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      rows={1}
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="max-h-32 min-h-[52px] flex-1 resize-none rounded-2xl border border-[#d6cebc] bg-[#f8f6f0] px-4 py-3 text-sm text-[#2d3a1e] outline-none focus:border-[#6b8c3e]"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !inputText.trim()}
                      className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#6b8c3e] text-white transition-colors hover:bg-[#5a7a30] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <SendHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
