import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, User, Bot, Sparkles, Loader2, RotateCcw, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function ChatInterface({ health, messages, onUpdateMessages }) {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState(null)
    const messagesEndRef = useRef(null)
    const textareaRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = { role: 'user', content: input.trim() }
        const newMessages = [...messages, userMessage]
        onUpdateMessages(newMessages)
        setInput('')
        setIsLoading(true)

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        try {
            const response = await fetch('http://localhost:8000/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversation_history: messages,
                    use_knowledge_base: true
                })
            })

            if (!response.ok) throw new Error('Failed to get response')

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ''

            onUpdateMessages([...newMessages, { role: 'assistant', content: '' }])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') continue

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.content) {
                                assistantMessage += parsed.content
                                onUpdateMessages([...newMessages, { role: 'assistant', content: assistantMessage }])
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error)
            onUpdateMessages([...newMessages, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please check that the backend and Ollama are running.'
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    const suggestions = [
        { icon: '💡', text: "Explain a concept" },
        { icon: '📝', text: "Help me write something" },
        { icon: '🔧', text: "Debug my code" },
        { icon: '🎯', text: "Brainstorm ideas" },
    ]

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center px-4">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center mb-6 shadow-lg">
                            <Sparkles className="h-10 w-10 text-gray-300" />
                        </div>
                        <h1 className="text-2xl font-semibold mb-2">How can I help you today?</h1>
                        <p className="text-gray-400 text-center max-w-md mb-8">
                            I'm Jarvis, your AI assistant powered by a self-hosted LLM.
                        </p>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(suggestion.text)}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-700 hover:bg-gray-800/50 transition-colors text-left"
                                >
                                    <span className="text-2xl">{suggestion.icon}</span>
                                    <span className="text-sm text-gray-300">{suggestion.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`py-6 ${index !== 0 ? 'border-t border-gray-800' : ''}`}
                            >
                                <div className="flex gap-4">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className={
                                            message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gradient-to-br from-green-500 to-teal-600 text-white'
                                        }>
                                            {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm">
                                                {message.role === 'user' ? 'You' : 'Jarvis'}
                                            </span>
                                        </div>
                                        <div className="prose-message text-gray-200">
                                            {message.role === 'user' ? (
                                                <p>{message.content}</p>
                                            ) : (
                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                            )}
                                        </div>
                                        {message.role === 'assistant' && message.content && (
                                            <div className="flex gap-1 mt-3">
                                                <button
                                                    onClick={() => copyToClipboard(message.content, index)}
                                                    className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                                                    title="Copy"
                                                >
                                                    {copiedIndex === index ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                                                    title="Regenerate"
                                                >
                                                    <RotateCcw className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="py-6 border-t border-gray-800">
                                <div className="flex gap-4">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
                                            <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="typing-dot h-2 w-2 rounded-full bg-gray-500" />
                                            <span className="typing-dot h-2 w-2 rounded-full bg-gray-500" />
                                            <span className="typing-dot h-2 w-2 rounded-full bg-gray-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800 p-4">
                <div className="max-w-3xl mx-auto">
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={health.llm_available ? "Message Jarvis..." : "Waiting for LLM connection..."}
                            disabled={!health.llm_available}
                            className="min-h-[52px] max-h-[200px] resize-none pr-12 rounded-xl bg-gray-800 border-gray-700 focus:border-gray-600"
                            rows={1}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || !health.llm_available}
                            size="icon"
                            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Jarvis can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ChatInterface
