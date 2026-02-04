import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Plus, Trash2, Database, Settings, Bot } from 'lucide-react'

function Sidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    health
}) {
    return (
        <div className="h-full bg-gray-950 flex flex-col border-r border-gray-800">
            {/* Header */}
            <div className="p-3 border-b border-gray-800">
                <Button
                    onClick={onNewConversation}
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent border-gray-700 hover:bg-gray-800"
                >
                    <Plus className="h-4 w-4" />
                    New chat
                </Button>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 px-2 py-2">
                <div className="space-y-1">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${conv.id === activeConversationId
                                    ? 'bg-gray-800'
                                    : 'hover:bg-gray-800/50'
                                }`}
                            onClick={() => onSelectConversation(conv.id)}
                        >
                            <MessageSquare className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm truncate flex-1">{conv.title}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteConversation(conv.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                            >
                                <Trash2 className="h-3 w-3 text-gray-400" />
                            </button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800 space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <Database className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Knowledge Base</span>
                    <span className={`ml-auto h-2 w-2 rounded-full ${health.vector_db_available ? 'bg-green-500' : 'bg-gray-600'}`} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Settings</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                    <Bot className="h-4 w-4" />
                    <span>{health.llm_available ? `Using ${health.model}` : 'LLM Offline'}</span>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
