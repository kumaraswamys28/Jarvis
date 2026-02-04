import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatInterface from './components/ChatInterface'
import { Bot, Menu, X } from 'lucide-react'

function App() {
    const [health, setHealth] = useState({
        status: 'checking',
        llm_available: false,
        vector_db_available: false,
        model: ''
    })
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [conversations, setConversations] = useState([
        { id: 1, title: 'New conversation', messages: [], active: true }
    ])
    const [activeConversationId, setActiveConversationId] = useState(1)

    useEffect(() => {
        checkHealth()
        const interval = setInterval(checkHealth, 30000)
        return () => clearInterval(interval)
    }, [])

    const checkHealth = async () => {
        try {
            const response = await fetch('http://localhost:8000/health')
            const data = await response.json()
            setHealth(data)
        } catch (error) {
            setHealth({
                status: 'offline',
                llm_available: false,
                vector_db_available: false,
                model: ''
            })
        }
    }

    const activeConversation = conversations.find(c => c.id === activeConversationId)

    const updateConversation = (id, messages) => {
        setConversations(prev => prev.map(conv =>
            conv.id === id
                ? {
                    ...conv,
                    messages,
                    title: messages.length > 0 && conv.title === 'New conversation'
                        ? messages[0].content.slice(0, 30) + '...'
                        : conv.title
                }
                : conv
        ))
    }

    const createNewConversation = () => {
        const newId = Math.max(...conversations.map(c => c.id)) + 1
        const newConv = { id: newId, title: 'New conversation', messages: [], active: true }
        setConversations(prev => [...prev, newConv])
        setActiveConversationId(newId)
    }

    const deleteConversation = (id) => {
        if (conversations.length === 1) {
            setConversations([{ id: 1, title: 'New conversation', messages: [], active: true }])
            setActiveConversationId(1)
        } else {
            const remaining = conversations.filter(c => c.id !== id)
            setConversations(remaining)
            if (activeConversationId === id) {
                setActiveConversationId(remaining[remaining.length - 1].id)
            }
        }
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
                <Sidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={setActiveConversationId}
                    onNewConversation={createNewConversation}
                    onDeleteConversation={deleteConversation}
                    health={health}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-gray-400" />
                            <span className="font-medium">Jarvis</span>
                            <span className="text-xs text-gray-500">
                                {health.llm_available ? health.model : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${health.llm_available ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                </header>

                {/* Chat Area */}
                <ChatInterface
                    health={health}
                    messages={activeConversation?.messages || []}
                    onUpdateMessages={(messages) => updateConversation(activeConversationId, messages)}
                />
            </div>
        </div>
    )
}

export default App
