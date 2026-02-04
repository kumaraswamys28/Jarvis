import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, Plus, Check, AlertCircle, Loader2 } from 'lucide-react'

function KnowledgeBase({ health }) {
    const [text, setText] = useState('')
    const [title, setTitle] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [stats, setStats] = useState({ initialized: false, total_vectors: 0 })
    const [toast, setToast] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/knowledge/stats')
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        }
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleAddText = async () => {
        if (!text.trim()) return

        setIsUploading(true)
        try {
            const response = await fetch('http://localhost:8000/knowledge/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text.trim(),
                    title: title.trim() || undefined
                })
            })

            if (!response.ok) throw new Error('Failed to add knowledge')

            const data = await response.json()
            showToast(`Added ${data.vectors_created} knowledge chunks`)
            setText('')
            setTitle('')
            fetchStats()
        } catch (error) {
            showToast('Failed to add knowledge', 'error')
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileUpload = async (file) => {
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('http://localhost:8000/knowledge/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) throw new Error('Failed to upload file')

            const data = await response.json()
            showToast(`Uploaded "${data.filename}"`)
            fetchStats()
        } catch (error) {
            showToast('Failed to upload file', 'error')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file?.type === 'text/plain') {
            handleFileUpload(file)
        } else {
            showToast('Please upload a .txt file', 'error')
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Knowledge Base</h2>
                    <p className="text-sm text-gray-400">
                        Add documents to enhance context-aware responses
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{stats.total_vectors || 0}</p>
                        <p className="text-xs text-gray-400">Vectors</p>
                    </div>
                    <div className="text-center">
                        <Badge variant={stats.initialized ? "default" : "secondary"}>
                            {stats.initialized ? 'Connected' : 'Disconnected'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-white bg-gray-800/50' : 'border-gray-700 hover:border-gray-600'
                    }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                />
                <div className="h-12 w-12 rounded-lg bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <p className="font-medium text-sm">Drop a file or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">Supports .txt files</p>
            </div>

            {/* Manual Text Input */}
            <div className="space-y-3">
                <Input
                    placeholder="Title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                    placeholder="Paste knowledge text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[120px]"
                />
                <div className="flex gap-2">
                    <Button
                        onClick={handleAddText}
                        disabled={!text.trim() || isUploading || !stats.initialized}
                        className="gap-2"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Add to Knowledge Base
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => { setText(''); setTitle('') }}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Warning if not initialized */}
            {!stats.initialized && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium">Vector database not connected</p>
                        <p className="text-red-400/80">Add your Pinecone API key to backend/.env</p>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-white text-gray-900' : 'bg-red-600 text-white'
                    }`}>
                    {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span className="text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    )
}

export default KnowledgeBase
