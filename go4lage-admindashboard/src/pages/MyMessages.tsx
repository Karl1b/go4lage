import { useContext, useEffect, useState } from 'react'
import {
  MessageSquareShare,
  Search,
  Filter,
  Reply,
  CheckCircle2,
  X,
  Send,
  User,
  Clock,
} from 'lucide-react'
import Button from '../stylecomponents/Button'
import api from '../util/api'
import { MainContext } from '../App'
import { FeedBackT } from '../util/types'
import { useTranslation } from 'react-i18next'

// Chat message structure for parsing chat JSON
interface ChatMessage {
  timestamp: string
  from: string
  message: string
}

export default function MyMessages({ isAdmin }: { isAdmin: boolean }) {
  const [messages, setMessages] = useState<FeedBackT[]>([])
  const [selectedMessage, setSelectedMessage] = useState<FeedBackT | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'solved' | 'unsolved'
  >('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updater, setUpdater] = useState<number>(0)
  const [chatText, setChatText] = useState<string>('')
  const [isSending, setIsSending] = useState(false)
  const [isSolvedChecked, setIsSolvedChecked] = useState(false)

  const { userData, setToast } = useContext(MainContext)
  const { t } = useTranslation()

  useEffect(() => {
    async function getMsgs() {
      if (!userData.token) {
        return
      }

      try {
        const messages = await api.getMsg(userData.token, isAdmin)
        setMessages(messages)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }
    getMsgs()
  }, [userData.token, updater])

  async function sendChat() {
    if (!userData.token || !selectedMessage || !chatText.trim()) {
      return
    }

    setIsSending(true)
    try {
      const updatedFeedback = await api.updateFeedBack(
        userData.token,
        {
          message: chatText.trim(),
          id: selectedMessage.id,
          is_solved: isAdmin ? isSolvedChecked : null,
        },
        isAdmin,
        setToast
      )
      setChatText('')
      setIsSolvedChecked(false)
      setUpdater(updater + 1)
      setSelectedMessage(updatedFeedback)
    } catch (e) {
      console.log(e)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChat()
    }
  }

  const openModal = (message: FeedBackT) => {
    setSelectedMessage(message)
    setIsModalOpen(true)
    setIsSolvedChecked(message.is_solved || false)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMessage(null)
    setChatText('')
    setIsSolvedChecked(false)
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.behaviour_is.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.behaviour_should
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      message.full_url.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'solved' && message.is_solved) ||
      (filterStatus === 'unsolved' && !message.is_solved)

    return matchesSearch && matchesFilter
  })

  const getStatusIcon = (isSolved: boolean) => {
    if (isSolved) {
      return <CheckCircle2 className="w-4 h-4 text-success" />
    } else {
      return <div className="w-2 h-2 bg-accent-primary rounded-full" />
    }
  }

  const getStatusText = (isSolved: boolean) => {
    return isSolved ? t('solved') : t('open')
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      )

      if (diffInHours < 1) {
        return t('justNow')
      } else if (diffInHours < 24) {
        return t('hoursAgo', { hours: diffInHours })
      } else if (diffInHours < 48) {
        return t('oneDayAgo')
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        return t('daysAgo', { days: diffInDays })
      }
    } catch (error) {
      return timestamp
    }
  }

  const formatChatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return timestamp
    }
  }

  const getSubjectFromFeedback = (feedback: FeedBackT) => {
    const behaviorPreview = feedback.behaviour_is.substring(0, 50)
    return behaviorPreview + (feedback.behaviour_is.length > 50 ? '...' : '')
  }

  const getPreviewFromFeedback = (feedback: FeedBackT) => {
    return `${t('current')}: ${feedback.behaviour_is.substring(0, 100)}${
      feedback.behaviour_is.length > 100 ? '...' : ''
    }`
  }

  const parseChatMessages = (chatJson: string | null): ChatMessage[] => {
    if (!chatJson) return []

    try {
      return JSON.parse(chatJson)
    } catch (error) {
      console.error('Error parsing chat JSON:', error)
      return []
    }
  }

  const getLastChatMessage = (chatJson: string | null): string => {
    const messages = parseChatMessages(chatJson)
    if (messages.length === 0) return t('noMessagesYet')

    const lastMessage = messages[messages.length - 1]
    return `${lastMessage.from}: ${lastMessage.message.substring(0, 50)}${
      lastMessage.message.length > 50 ? '...' : ''
    }`
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-surface-primary rounded-lg border border-border-default p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              {t('myFeedback')}
            </h1>
            <p className="text-text-secondary">{t('viewAndManageFeedback')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              {t('feedbackItemsCount', {
                filtered: filteredMessages.length,
                total: messages.length,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-surface-primary rounded-lg border border-border-default">
        {/* Search and Filter */}
        <div className="p-4 border-b border-border-default">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder={t('searchFeedbackPlaceholder')}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="all">{t('allFeedback')}</option>
                <option value="unsolved">{t('open')}</option>
                <option value="solved">{t('solved')}</option>
              </select>
              <Button kind="secondary" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t('filter')}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="divide-y divide-border-default">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => openModal(message)}
                className={`p-4 cursor-pointer hover:bg-surface-secondary transition-colors border-l-4 ${
                  message.is_solved ? 'border-l-success' : 'border-l-warning'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(message.is_solved)}
                      <MessageSquareShare className="w-4 h-4 text-accent-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate text-text-primary">
                        {getSubjectFromFeedback(message)}
                      </h3>
                      <p className="text-sm text-text-muted mt-1 line-clamp-2">
                        {getPreviewFromFeedback(message)}
                      </p>
                      {message.chat && (
                        <p className="text-xs text-text-muted mt-1 italic">
                          {getLastChatMessage(message.chat)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-text-muted whitespace-nowrap">
                    {formatTimestamp(message.created_at)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquareShare className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">{t('noFeedbackFound')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-surface-primary rounded-lg border border-border-default w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedMessage.is_solved)}
                    <MessageSquareShare className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      {t('feedbackDetails')}
                    </h2>
                    <p className="text-sm text-text-secondary">
                      {getStatusText(selectedMessage.is_solved)} •{' '}
                      {t('created')}{' '}
                      {formatTimestamp(selectedMessage.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    kind="secondary"
                    className="flex items-center gap-2"
                    onClick={closeModal}
                  >
                    <X className="w-4 h-4" />
                    {t('close')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Panel - Feedback Details */}
              <div className="w-1/2 p-6 border-r border-border-default overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-accent-primary rounded"></div>
                      {t('currentBehavior')}
                    </h3>
                    <div className="bg-surface-secondary p-4 rounded-lg">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {selectedMessage.behaviour_is}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-success rounded"></div>
                      {t('expectedBehavior')}
                    </h3>
                    <div className="bg-surface-secondary p-4 rounded-lg">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {selectedMessage.behaviour_should}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-warning rounded"></div>
                      {t('url')}
                    </h3>
                    <div className="bg-surface-secondary p-4 rounded-lg">
                      <p className="text-sm text-text-secondary break-all font-mono">
                        {selectedMessage.full_url}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Chat */}
              <div className="w-1/2 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-border-default">
                  <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <Reply className="w-4 h-4" />
                    {t('chatHistory')}
                  </h3>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {parseChatMessages(selectedMessage.chat).length > 0 ? (
                    parseChatMessages(selectedMessage.chat).map(
                      (msg, index) => {
                        // Extract email from "email (Staff)" format if present
                        const fromEmail = msg.from.split(' ')[0]
                        const isCurrentUser = fromEmail === userData.email

                        return (
                          <div
                            key={index}
                            className={`flex gap-3 ${
                              isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] ${
                                isCurrentUser ? 'order-2' : 'order-1'
                              }`}
                            >
                              {/* Message bubble */}
                              <div
                                className={`p-3 rounded-lg shadow-sm ${
                                  isCurrentUser
                                    ? 'bg-brand text-text-primary rounded-br-sm'
                                    : 'bg-surface-secondary text-text-secondary rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {msg.message}
                                </p>
                              </div>

                              {/* Message metadata */}
                              <div
                                className={`flex items-center gap-1 mt-1 text-xs text-text-muted ${
                                  isCurrentUser
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span className={`font-medium`}>
                                    {isCurrentUser ? t('you') : fromEmail}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {formatChatTimestamp(msg.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquareShare className="w-12 h-12 text-text-muted mb-3" />
                      <p className="text-text-secondary">
                        {t('noMessagesYet')}
                      </p>
                      <p className="text-text-muted text-sm">
                        {t('startConversationBelow')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border-default">
                  {/* Admin checkbox */}
                  {isAdmin && !selectedMessage.is_solved && (
                    <div className="mb-3">
                      <label className="flex items-center gap-2 text-sm text-text-primary">
                        <input
                          type="checkbox"
                          checked={isSolvedChecked}
                          onChange={(e) => setIsSolvedChecked(e.target.checked)}
                          className="w-4 h-4 text-brand bg-surface-secondary border-border-default rounded focus:ring-brand focus:ring-2"
                        />
                        <span>{t('markAsSolved')}</span>
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <textarea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('typeYourMessage')}
                      className="flex-1 px-3 py-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                      rows={2}
                      disabled={isSending}
                    />
                    <Button
                      kind="primary"
                      onClick={sendChat}
                      disabled={!chatText.trim() || isSending}
                      className="flex items-center gap-2 px-4 py-2 self-end"
                    >
                      <Send className="w-4 h-4" />
                      {isSending ? t('sending') : t('send')}
                    </Button>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {t('enterToSendShiftEnterNewLine')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
