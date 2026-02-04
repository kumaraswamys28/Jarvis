import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function MessageBubble({ message }) {
    const isUser = message.role === 'user'

    return (
        <div className={`message ${isUser ? 'user' : 'assistant'}`}>
            <div className="message-avatar">
                {isUser ? <User /> : <Bot />}
            </div>
            <div className="message-content">
                {isUser ? (
                    message.content
                ) : (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
            </div>
        </div>
    )
}

export default MessageBubble
