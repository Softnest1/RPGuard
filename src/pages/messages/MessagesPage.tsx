import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { 
  fetchConversations, 
  getOrCreateConversation, 
  searchUsers, 
  fetchMessages, 
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  deleteConversation
} from '@/lib/api';
import type { Conversation, Message, Profile } from '@/types/types';
import PageContainer from '@/components/layouts/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AudioRecorder } from 'react-audio-voice-recorder';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Search, MessageSquare, Send, Smile, Play, Pause, ArrowLeft, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

function getInitials(username?: string | null): string {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessagesPage() {
  const { user } = useAuth();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<Profile>[]>([]);
  const [textInput, setTextInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
    
    // Realtime subscription for conversations
    const convSub = supabase
      .channel('conversations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convSub);
    };
  }, [user]);

  // Load messages when active conv changes
  useEffect(() => {
    if (!activeConv || !user) return;
    loadMessages(activeConv.id);
    markMessagesAsRead(activeConv.id, activeConv.other_user!.id).then(() => loadConversations());

    // Realtime messages
    const msgSub = supabase
      .channel(`messages-${activeConv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv.id}` }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.message_type === 'voice' && newMsg.voice_file_path) {
          const { data } = supabase.storage.from('audio_messages').getPublicUrl(newMsg.voice_file_path);
          newMsg.voice_public_url = data.publicUrl;
        }
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
        if (newMsg.sender_id !== user.id) {
          markMessagesAsRead(activeConv.id, activeConv.other_user!.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
    };
  }, [activeConv, user]);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (err: any) {
      toast.error('Erreur de chargement des conversations');
    } finally {
      setLoadingConv(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await fetchMessages(convId, 200);
      setMessages(data);
      setHasMoreMessages(data.length === 200);
      scrollToBottom();
    } catch (err: any) {
      toast.error('Erreur de chargement des messages');
    }
  };

  const loadMoreMessages = async () => {
    if (!activeConv || isLoadingMore || !hasMoreMessages || messages.length === 0) return;
    
    setIsLoadingMore(true);
    const firstMessageId = messages[0].id;
    
    try {
      const oldMessages = await fetchMessages(activeConv.id, 200, firstMessageId);
      
      if (oldMessages.length > 0) {
        setMessages(prev => [...oldMessages, ...prev]);
        setHasMoreMessages(oldMessages.length === 200);
        
        // Mantain scroll position after loading older messages
        setTimeout(() => {
          if (messageContainerRef.current) {
            // Rough estimation, a better way is to keep track of a specific child element
            messageContainerRef.current.scrollTop = 50; 
          }
        }, 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length >= 2) {
      try {
        const results = await searchUsers(q);
        setSearchResults(results);
      } catch (err) {
        // ignore
      }
    } else {
      setSearchResults([]);
    }
  };

  // Load drafts when conversation changes
  useEffect(() => {
    if (activeConv) {
      const savedDraft = localStorage.getItem(`draft_${activeConv.id}`);
      if (savedDraft) setTextInput(savedDraft);
      else setTextInput('');
    }
  }, [activeConv?.id]);

  // Save drafts automatically
  useEffect(() => {
    if (activeConv) {
      if (textInput.trim() === '') {
        localStorage.removeItem(`draft_${activeConv.id}`);
      } else {
        localStorage.setItem(`draft_${activeConv.id}`, textInput);
      }
    }
  }, [textInput, activeConv?.id]);

  const startConversation = async (otherUser: Partial<Profile>) => {
    try {
      const conv = await getOrCreateConversation(otherUser.id!);
      setSearchQuery('');
      setSearchResults([]);
      const enrichedConv = { ...conv, other_user: otherUser as Profile, unread_count: 0 };
      setActiveConv(enrichedConv);
      
      // Update local conv list if not present
      setConversations(prev => {
        if (!prev.find(c => c.id === conv.id)) return [enrichedConv, ...prev];
        return prev;
      });
    } catch (err: any) {
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !activeConv) return;
    
    setSending(true);
    const content = textInput.trim();
    setTextInput('');
    localStorage.removeItem(`draft_${activeConv.id}`);
    setShowEmoji(false);
    
    try {
      await sendMessage(activeConv.id, content, 'text');
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi');
      setTextInput(content); // restore
      localStorage.setItem(`draft_${activeConv.id}`, content);
    } finally {
      setSending(false);
    }
  };

  const handleSendAudio = async (blob: Blob) => {
    if (!activeConv) return;
    setSending(true);
    try {
      await sendMessage(activeConv.id, null, 'voice', blob);
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi vocal');
    } finally {
      setSending(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setTextInput(prev => prev + emojiData.emoji);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message supprimé');
    } catch (err) {
      toast.error('Erreur lors de la suppression du message');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette conversation ?')) return;
    try {
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (activeConv?.id === conversationId) {
        setActiveConv(null);
      }
      toast.success('Conversation supprimée');
    } catch (err) {
      toast.error('Erreur lors de la suppression de la conversation');
    }
  };

  if (!user) {
    return (
      <PageContainer width="xl" className="py-12 flex justify-center">
        <p>Veuillez vous connecter pour accéder à la messagerie.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="xl" className="py-6 md:py-10 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex bg-card border border-border rounded-2xl overflow-hidden h-full shadow-sm">
        
        {/* Sidebar (List & Search) */}
        <div className={`w-full md:w-1/3 border-r border-border flex flex-col bg-muted/10 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border bg-card">
            <h1 className="text-xl font-semibold mb-4">Messages</h1>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un utilisateur..." 
                className="pl-9 rounded-full bg-background"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="p-3 space-y-3">
                <p className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">Résultats de recherche</p>
                {searchResults.map(p => (
                  <div key={p.id} className="p-4 rounded-xl border border-border bg-card flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl overflow-hidden shrink-0 border-2 border-background shadow-sm">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.username || 'Utilisateur'} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(p.username)
                      )}
                    </div>
                    <div className="flex-1 w-full min-w-0">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="font-bold text-lg text-foreground truncate">{p.username}</span>
                        {p.role === 'admin' && (
                          <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      {p.pseudo_rp && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          🎭 {p.pseudo_rp}
                        </p>
                      )}
                      {p.bio && (
                        <p className="text-sm text-foreground/80 line-clamp-2 mt-2 bg-muted/30 p-2 rounded-lg text-left">
                          {p.bio}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => startConversation(p)}
                      className="w-full rounded-full gap-2 mt-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Envoyer un message
                    </Button>
                  </div>
                ))}
              </div>
            ) : loadingConv ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center">
                <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Aucune conversation. Recherchez un utilisateur pour discuter.</p>
              </div>
            ) : (
              <div className="flex flex-col p-2 gap-1">
                {conversations.map(conv => {
                  const isActive = activeConv?.id === conv.id;
                  const profile = conv.other_user;
                  return (
                    <div
                      key={conv.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left group ${isActive ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                    >
                      <button
                        onClick={() => setActiveConv(conv)}
                        className="flex-1 flex items-center gap-3 min-w-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shrink-0 relative">
                          {getInitials(profile?.username)}
                          {conv.unread_count && conv.unread_count > 0 ? (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full border-2 border-background flex items-center justify-center text-[10px] text-destructive-foreground font-bold">
                              {conv.unread_count}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-sm truncate">{profile?.username}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {conv.last_message ? formatTime(conv.last_message.created_at) : ''}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${conv.unread_count ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {conv.last_message?.message_type === 'voice' ? '🎤 Message vocal' : conv.last_message?.content || 'Nouvelle conversation'}
                          </p>
                        </div>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0"
                        title="Supprimer la conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`w-full md:w-2/3 flex flex-col bg-background ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0 z-10">
                <button onClick={() => setActiveConv(null)} className="md:hidden p-2 -ml-2 rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shrink-0">
                  {getInitials(activeConv.other_user?.username)}
                </div>
                <span className="font-semibold text-foreground">{activeConv.other_user?.username}</span>
              </div>

              {/* Chat Messages */}
              <div 
                ref={messageContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 flex flex-col gap-5"
              >
                {isLoadingMore && (
                  <div className="flex justify-center p-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {messages.map((msg, index) => {
                  const isMe = msg.sender_id === user.id;
                  
                  // Check if the previous message was from the same sender to group them
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                  
                  // Check if next message is from the same sender
                  const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                  const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                  return (
                    <div key={msg.id} className={`flex max-w-[90%] md:max-w-[75%] gap-2 items-end group ${isMe ? 'self-end flex-row-reverse' : 'self-start flex-row'} ${!isFirstInGroup ? '-mt-3' : ''}`}>
                      {/* Avatar (only show on the last message of a group) */}
                      <div className={`w-7 h-7 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shrink-0 text-[10px] overflow-hidden ${!isLastInGroup ? 'opacity-0 pointer-events-none' : ''}`}>
                        {isMe ? (
                          user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.user_metadata?.username || user.email)
                          )
                        ) : (
                          activeConv.other_user?.avatar_url ? (
                            <img src={activeConv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(activeConv.other_user?.username)
                          )
                        )}
                      </div>

                      {/* Message Bubble + Actions */}
                      <div className={`flex flex-col min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          
                          <div className={`px-4 py-2.5 shadow-sm max-w-full min-w-0 break-words ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} 
                            ${isMe 
                              ? `rounded-l-2xl ${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLastInGroup ? 'rounded-br-sm' : 'rounded-br-md'}` 
                              : `rounded-r-2xl ${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLastInGroup ? 'rounded-bl-sm' : 'rounded-bl-md'}`
                            }`}
                          >
                            {msg.message_type === 'text' ? (
                              <p className="text-[15px] whitespace-pre-wrap leading-relaxed min-w-0 break-words">{msg.content}</p>
                            ) : (
                              <div className="flex items-center gap-2 overflow-hidden w-full max-w-[200px] md:max-w-[250px]">
                                <audio src={msg.voice_public_url} controls className="h-10 w-full" />
                              </div>
                            )}
                          </div>
                          
                          {/* Dropdown Action (Delete) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 text-muted-foreground hover:bg-muted rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isMe ? 'end' : 'start'}>
                              <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer le message
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Time & Read Status (Only on the last message of the group) */}
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-1 text-[11px] text-muted-foreground ${isMe ? 'pr-1' : 'pl-1'}`}>
                            {formatTime(msg.created_at)}
                            {isMe && <CheckCheck className={`w-3.5 h-3.5 ${msg.is_read ? 'text-blue-500' : 'text-muted-foreground/50'}`} />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-2 md:p-4 bg-card border-t border-border shrink-0 relative w-full">
                {showEmoji && (
                  <div className="absolute bottom-[70px] left-2 md:left-4 z-50 shadow-xl rounded-xl border border-border overflow-hidden max-w-[calc(100vw-32px)]">
                    <EmojiPicker onEmojiClick={onEmojiClick} autoFocusSearch={false} />
                  </div>
                )}
                <form onSubmit={handleSendText} className="flex items-end gap-1 md:gap-2 w-full max-w-full">
                  <button 
                    type="button" 
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-2 md:p-3 text-muted-foreground hover:text-foreground transition rounded-full hover:bg-muted shrink-0"
                  >
                    <Smile className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <div className="flex-1 min-w-0 bg-muted/50 rounded-2xl flex items-center px-3 md:px-4 py-1 border border-transparent focus-within:border-primary/30 transition-colors">
                    <Input 
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder="Message..."
                      className="border-0 bg-transparent focus-visible:ring-0 px-0 h-10 shadow-none min-w-0 w-full"
                    />
                  </div>
                  {textInput.trim() ? (
                    <Button type="submit" disabled={sending} className="rounded-full w-10 h-10 md:w-12 md:h-12 p-0 shrink-0">
                      {sending ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5 ml-1" />}
                    </Button>
                  ) : (
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 relative overflow-hidden">
                      <div className="absolute inset-0 scale-[0.85] md:scale-100 flex items-center justify-center">
                        <AudioRecorder 
                          onRecordingComplete={handleSendAudio}
                          audioTrackConstraints={{
                            noiseSuppression: true,
                            echoCancellation: true,
                          }}
                          downloadOnSavePress={false}
                          downloadFileExtension="webm"
                          showVisualizer={true}
                          classes={{
                            AudioRecorderClass: 'shadow-none !bg-muted hover:!bg-muted/80 !transition-colors !w-12 !h-12',
                            AudioRecorderStartSaveClass: '!text-primary',
                            AudioRecorderPauseResumeClass: '!text-primary',
                            AudioRecorderDiscardClass: '!text-destructive'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}