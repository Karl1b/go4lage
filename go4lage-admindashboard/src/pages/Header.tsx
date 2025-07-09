import React, { useState, useContext, useRef, useEffect } from 'react'
import {
  Menu,
  User,
  ChevronDown,
  MessageSquareShare,
  X,
  Send,
  MessageCircle,
  Inbox,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MainContext } from '../App'
import { ThemeToggle } from '../themecomps/ThemeToggle'
import Logout from '../components/Logout'
import Logo from '../components/Logo'
import Button from '../stylecomponents/Button'
import api from '../util/api'

interface HeaderProps {
  isSidebarExpanded: boolean
  setIsMobileOpen: (open: boolean) => void
}

const Header: React.FC<HeaderProps> = ({
  isSidebarExpanded,
  setIsMobileOpen,
}) => {
  const { userData, setToast } = useContext(MainContext)
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [behaviourAs, setBehaviourAs] = useState('')
  const [behaviourShould, setBehaviourShould] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const messageModalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
      if (
        messageModalRef.current &&
        !messageModalRef.current.contains(event.target as Node)
      ) {
        setIsMessageModalOpen(false)
        setIsComposing(false)
        setBehaviourAs('')
        setBehaviourShould('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSendMessage = () => {
    if (!behaviourAs.trim() || !behaviourShould.trim()) {
      setToast({
        show: true,
        success: false,
        header: 'Validation Error',
        text: 'Please fill in both behavior fields before sending.',
      })
      return
    }

    // Simulate sending message
    setToast({
      show: true,
      success: true,
      header: 'Message Sent',
      text: 'Your feedback message has been sent successfully!',
    })

    // Reset form and close modal
    setBehaviourAs('')
    setBehaviourShould('')
    setIsComposing(false)
    setIsMessageModalOpen(false)

    async function sendMsg() {
      try {
        api.newfeedback(
          userData.token,
          {
            behaviour_is: behaviourAs,
            behaviour_should: behaviourShould,
            full_url: window.location.toString(),
            chat: null,
            id: '',
            is_solved: false,
            created_at: '',
            updated_at: ''
          },
          setToast
        )
      } catch (e) {
        console.log(e)
      }
    }
    sendMsg()
  }

  const handleGoToMessages = () => {
    setIsMessageModalOpen(false)
    navigate('/mymessages')
  }

  const handleComposeMessage = () => {
    setIsComposing(true)
  }

  const handleBackToMenu = () => {
    setIsComposing(false)
    setBehaviourAs('')
    setBehaviourShould('')
  }

  return (
    <header
      className={`
        fixed top-0 right-0 h-16 z-30
        bg-surface-primary border-b border-border-default
        transition-all duration-300 ease-in-out
        ${isSidebarExpanded ? 'md:left-0' : 'md:left-0'}
        left-0
      `}
    >
      <div className="flex items-center h-full px-4 md:px-6">
        {/* Left Section - Mobile Menu + Logo */}
        <div className="flex items-center gap-3 flex-1 md:flex-none">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary transition-all duration-200 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo - Hidden on mobile when sidebar is present */}
          <div className="md:hidden flex-1 flex justify-center">
            <Logo />
          </div>
        </div>

        {/* Center Section - Logo on desktop */}
        <div className="hidden md:flex flex-1 justify-center items-center">
          <Logo />
          <h2 className="text-text-primary ml-2 text-lg">Admin-Dashboard</h2>
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Message Menu */}
          <div className="relative" ref={messageModalRef}>
            <button
              onClick={() => setIsMessageModalOpen(!isMessageModalOpen)}
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary transition-all duration-200"
            >
              <MessageSquareShare className="w-5 h-5" />
            </button>

            {/* Message Modal */}
            {isMessageModalOpen && (
              <div className="absolute right-0 mt-2 rounded-xl bg-surface-primary border border-border-default shadow-xl shadow-black/10 z-50">
                {!isComposing ? (
                  /* Main Menu */
                  <div className="w-64">
                    <div className="px-4 py-3 border-b border-border-muted">
                      <div className="flex items-center gap-2">
                        <MessageSquareShare className="w-5 h-5 text-accent-primary" />
                        <p className="text-sm font-medium text-text-primary">
                          Messages
                        </p>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={handleComposeMessage}
                        className="w-full px-3 py-3 text-left hover:bg-surface-secondary rounded-lg transition-colors flex items-center gap-3"
                      >
                        <MessageCircle className="w-4 h-4 text-accent-primary" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            Compose New Message
                          </p>
                          <p className="text-xs text-text-secondary">
                            Send feedback to the team
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={handleGoToMessages}
                        className="w-full px-3 py-3 text-left hover:bg-surface-secondary rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Inbox className="w-4 h-4 text-accent-primary" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            Go to My Messages
                          </p>
                          <p className="text-xs text-text-secondary">
                            View all conversations
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Compose Message Form */
                  <div className="w-96">
                    <div className="px-4 py-3 border-b border-border-muted">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-accent-primary" />
                          <p className="text-sm font-medium text-text-primary">
                            Compose Feedback
                          </p>
                        </div>
                        <button
                          onClick={handleBackToMenu}
                          className="text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Behaviour as it is
                        </label>
                        <textarea
                          value={behaviourAs}
                          onChange={(e) => setBehaviourAs(e.target.value)}
                          className="w-full h-20 rounded-lg border border-border-default px-3 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none text-sm"
                          placeholder="Describe the current behavior..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Behaviour as it should be
                        </label>
                        <textarea
                          value={behaviourShould}
                          onChange={(e) => setBehaviourShould(e.target.value)}
                          className="w-full h-20 rounded-lg border border-border-default px-3 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none text-sm"
                          placeholder="Describe the expected behavior..."
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSendMessage}
                          kind="primary"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Send Message
                        </Button>
                        <Button
                          onClick={handleBackToMenu}
                          kind="secondary"
                          className="px-4"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-text-inverse" />
              </div>
              <span className="hidden sm:block text-sm font-medium truncate max-w-32">
                {userData.email || 'User'}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform shrink-0 ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-primary border border-border-default shadow-xl shadow-black/10">
                <div className="px-4 py-3 border-b border-border-muted">
                  <p className="text-sm font-medium text-text-primary">
                    Signed in as
                  </p>
                  <p className="text-sm text-text-secondary truncate">
                    {userData.email}
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer">
                    <ThemeToggle />
                  </div>
                  <div className="px-3 py-2 hover:bg-surface-secondary rounded-lg transition-colors">
                    <Logout />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
