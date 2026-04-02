import React, { useState, useRef, useEffect, useCallback } from 'react'
import { message } from 'antd'
import {
    SendOutlined,
    UserOutlined,
    ReloadOutlined,
    CommentOutlined,
    CloseOutlined,
} from '@ant-design/icons'
import { useChatStore } from '../../shared/context/store'
import api from '../../shared/services/api'
import styles from './ChatBot.module.css'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    status: 'sent' | 'thinking' | 'error'
    timestamp: string
}

/* ── Sparkle SVG icon ────────────────────────────────────────────── */
const SparkleIcon: React.FC<{ size?: number; color?: string }> = ({
    size = 22,
    color = 'white',
}) => (
    <svg
        className={styles.sparkleIcon}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        {/* Main 4-point star */}
        <path
            d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z"
            fill={color}
        />
        {/* Small accent star top-right */}
        <path
            d="M19 3 L19.9 6.1 L23 7 L19.9 7.9 L19 11 L18.1 7.9 L15 7 L18.1 6.1 Z"
            fill={color}
            opacity="0.55"
        />
    </svg>
)

/* ── Empty state ─────────────────────────────────────────────────── */
const EmptyState: React.FC = () => (
    <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
            <SparkleIcon size={26} color="var(--brand-gray-400, #94a3b8)" />
        </div>
        <p className={styles.emptyTitle}>Tôi có thể giúp gì cho bạn?</p>
        <p className={styles.emptyDesc}>
            Hãy hỏi tôi về số ngày nghỉ phép,<br />
            phiếu lương, hoặc chính sách công ty.
        </p>
    </div>
)

/* ── Main component ──────────────────────────────────────────────── */
export const ChatBot: React.FC = () => {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [, setConversations] = useState<any[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { currentConversationId, setCurrentConversation } = useChatStore()
    // Track the content of the last failed message for retry
    const lastFailedContentRef = useRef<string | null>(null)

    /* ── Auto-resize textarea ────────────────────────────────── */
    const autoResizeTextarea = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 90) + 'px'
    }, [])

    /* ── Auto-scroll ─────────────────────────────────────────── */
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    /* ── API helpers ─────────────────────────────────────── */
    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/sessions/')
            setConversations(res.data?.results ?? res.data)
        } catch (err) {
            console.error('Failed to fetch conversations:', err)
        }
    }

    const fetchMessages = async (conversationId: string) => {
        try {
            const res = await api.get(`/chat/sessions/${conversationId}/history/`)
            const msgs = res.data?.messages ?? res.data
            setMessages(Array.isArray(msgs) ? msgs.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                status: 'sent' as const,
                timestamp: m.created_at,
            })) : [])
        } catch (err) {
            console.error('Failed to fetch messages:', err)
        }
    }

    const ensureConversation = async (): Promise<string | null> => {
        if (currentConversationId) return currentConversationId
        try {
            const res = await api.post('/chat/sessions/', {
                title: `Trò chuyện ${new Date().toLocaleString()}`,
            })
            const id = res.data.id
            setCurrentConversation(id)
            fetchConversations()
            return id
        } catch {
            message.error('Không thể tạo cuộc trò chuyện')
            return null
        }
    }

    const createNewConversation = async () => {
        try {
            const res = await api.post('/chat/sessions/', {
                title: `Trò chuyện ${new Date().toLocaleString()}`,
            })
            setCurrentConversation(res.data.id)
            setMessages([])
            fetchConversations()
        } catch {
            message.error('Không thể tạo cuộc trò chuyện')
        }
    }

    /* ── Send message (core logic) ───────────────────────────── */
    const doSend = async (content: string) => {
        if (!content.trim() || isSending) return

        const convId = await ensureConversation()
        if (!convId) return

        // Optimistic: push user message
        const userMsgId = `user-${Date.now()}`
        const thinkingMsgId = `thinking-${Date.now()}`

        const userMessage: Message = {
            id: userMsgId,
            role: 'user',
            content: content.trim(),
            status: 'sent',
            timestamp: new Date().toISOString(),
        }

        const thinkingMessage: Message = {
            id: thinkingMsgId,
            role: 'assistant',
            content: '',
            status: 'thinking',
            timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, userMessage, thinkingMessage])
        setInput('')
        setIsSending(true)
        lastFailedContentRef.current = content.trim()

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        try {
            const response = await api.post(
                `/chat/sessions/${convId}/send_message/`,
                { content: content.trim() }
            )
            const asstMsg = response.data.assistant_message

            // Replace thinking bubble with real response
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === thinkingMsgId
                        ? {
                            id: asstMsg.id,
                            role: 'assistant',
                            content: asstMsg.content,
                            status: 'sent' as const,
                            timestamp: asstMsg.created_at,
                        }
                        : m
                )
            )
            lastFailedContentRef.current = null
        } catch (err: any) {
            console.error('Send message failed:', err)
            // Replace thinking bubble with error message
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === thinkingMsgId
                        ? {
                            ...m,
                            content: 'Mình gặp lỗi khi trả lời, bạn thử lại nhé.',
                            status: 'error' as const,
                        }
                        : m
                )
            )
        } finally {
            setIsSending(false)
        }
    }

    const sendMessage = () => {
        doSend(input)
    }

    /* ── Retry last failed message ───────────────────────────── */
    const retryLastMessage = () => {
        if (!lastFailedContentRef.current || isSending) return
        // Remove the error message from the list
        setMessages((prev) => prev.filter((m) => m.status !== 'error'))
        doSend(lastFailedContentRef.current)
    }

    /* ── Effects ──────────────────────────────────────────────── */
    useEffect(() => { fetchConversations() }, [])

    useEffect(() => {
        if (currentConversationId) fetchMessages(currentConversationId)
    }, [currentConversationId])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isSending, scrollToBottom])

    useEffect(() => {
        if (open) setTimeout(() => textareaRef.current?.focus(), 80)
    }, [open])

    /* ── Keyboard handling ────────────────────────────────────── */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Shift+Enter = newline (default behavior)
        // Enter alone = send
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!isSending) sendMessage()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        autoResizeTextarea()
    }

    /* ── Render ────────────────────────────────────────────────── */
    return (
        <>
            {/* ── Floating button ──────────────────────────── */}
            <button
                className={styles.floatingButton}
                onClick={() => setOpen((prev) => !prev)}
                title={open ? 'Đóng trợ lý' : 'Mở Trợ lý AI'}
                aria-label="Bật/tắt trợ lý AI"
            >
                {open
                    ? <CloseOutlined style={{ fontSize: 20 }} />
                    : <SparkleIcon size={24} color="white" />
                }
            </button>

            {/* ── Chat popup ───────────────────────────────── */}
            {open && (
                <div className={styles.chatPopup} role="dialog" aria-label="Trợ lý AI">

                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <div className={styles.headerIcon}>
                                <SparkleIcon size={18} color="white" />
                            </div>
                            <div>
                                <p className={styles.headerTitle}>Trợ lý AI Lumina</p>
                                <p className={styles.headerSubtitle}>
                                    <span className={styles.onlineDot} />
                                    Trực tuyến
                                </p>
                            </div>
                        </div>

                        <div className={styles.headerButtons}>
                            <button
                                className={styles.headerButton}
                                onClick={() => setMessages([])}
                                title="Xóa tin nhắn"
                            >
                                <ReloadOutlined style={{ fontSize: 14 }} />
                            </button>
                            <button
                                className={styles.headerButton}
                                onClick={createNewConversation}
                                title="Cuộc trò chuyện mới"
                            >
                                <CommentOutlined style={{ fontSize: 14 }} />
                            </button>
                            <button
                                className={styles.headerButton}
                                onClick={() => setOpen(false)}
                                title="Đóng"
                            >
                                <CloseOutlined style={{ fontSize: 14 }} />
                            </button>
                        </div>
                    </div>

                    {/* Message list */}
                    <div className={styles.messageList}>
                        {messages.length === 0 && !isSending ? (
                            <EmptyState />
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`${styles.message} ${msg.role === 'user' ? styles.user : ''}`}
                                >
                                    <div className={`${styles.messageAvatar} ${msg.role === 'assistant' ? styles.assistant : styles.user}`}>
                                        {msg.role === 'user'
                                            ? <UserOutlined style={{ fontSize: 13 }} />
                                            : <SparkleIcon size={14} color="var(--brand-gray-500, #64748b)" />
                                        }
                                    </div>
                                    <div className={styles.msgContent}>
                                        {msg.status === 'thinking' ? (
                                            <div className={styles.typingBubble}>
                                                <span className={styles.typingDot} />
                                                <span className={styles.typingDot} />
                                                <span className={styles.typingDot} />
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`${styles.messageBubble} ${styles[msg.role]} ${msg.status === 'error' ? styles.error : ''}`}>
                                                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                                                    {msg.status === 'error' && (
                                                        <button
                                                            className={styles.retryButton}
                                                            onClick={retryLastMessage}
                                                            disabled={isSending}
                                                            title="Thử lại"
                                                        >
                                                            <ReloadOutlined style={{ fontSize: 12 }} />
                                                            Thử lại
                                                        </button>
                                                    )}
                                                </div>
                                                <span className={styles.messageTime}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className={styles.inputArea}>
                        <textarea
                            ref={textareaRef}
                            className={styles.inputField}
                            placeholder="Hỏi tôi bất cứ điều gì…"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            aria-label="Ô nhập tin nhắn"
                        />
                        <button
                            className={styles.inputButton}
                            onClick={sendMessage}
                            disabled={isSending || !input.trim()}
                            title="Gửi"
                            aria-label="Gửi tin nhắn"
                        >
                            <SendOutlined style={{ fontSize: 14 }} />
                        </button>
                    </div>

                </div>
            )}
        </>
    )
}