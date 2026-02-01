import { useState, useEffect, useRef } from 'react';
import { MainLayout, MobileNav } from '@/components/layout';
import { useConversations, useMessages, useSendMessage, Message } from '@/hooks/useMessages';
import { useKorums } from '@/hooks/useKorums';
import { 
  useKorumMessages, 
  useSendKorumMessage, 
  usePinMessage, 
  useUnpinMessage, 
  useDeleteMessage,
  useReactToMessage,
  useKorumMembers,
  KorumMessage 
} from '@/hooks/useKorumMessages';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Send, 
  Search,
  ArrowLeft,
  Users,
  Pin,
  MoreVertical,
  Shield,
  Reply,
  Smile,
  Trash2,
  X,
  Crown,
} from 'lucide-react';

type ChatType = 'direct' | 'korum';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export default function Messages() {
  const { user } = useAuth();
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: korums, isLoading: loadingKorums } = useKorums();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedKorumId, setSelectedKorumId] = useState<string | null>(null);
  const [chatType, setChatType] = useState<ChatType>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: directMessages, isLoading: loadingDirectMessages } = useMessages(selectedUserId || '');
  const { data: korumMessages, isLoading: loadingKorumMessages } = useKorumMessages(selectedKorumId || '');
  const { data: korumMembers } = useKorumMembers(selectedKorumId || '');
  const sendMessage = useSendMessage();
  const sendKorumMessage = useSendKorumMessage();
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const deleteMessage = useDeleteMessage();
  const reactToMessage = useReactToMessage();

  const joinedKorums = (korums as any[])?.filter(k => k.is_member) || [];
  const selectedKorum = joinedKorums.find(k => k.id === selectedKorumId);
  const isKorumAdmin = selectedKorum?.user_role === 'admin' || selectedKorum?.user_role === 'moderator';
  const canPostInKorum = !selectedKorum?.admin_only_posting || isKorumAdmin;

  const { data: searchResults } = useQuery({
    queryKey: ['users-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('user_id', user?.id || '')
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!searchQuery.trim() && !!user && chatType === 'direct',
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages, korumMessages]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    if (chatType === 'direct' && selectedUserId) {
      sendMessage.mutate({ 
        receiverId: selectedUserId, 
        content: message,
        replyToId: replyingTo?.id 
      });
    } else if (chatType === 'korum' && selectedKorumId) {
      sendKorumMessage.mutate({ 
        korumId: selectedKorumId, 
        content: message,
        replyToId: replyingTo?.id 
      });
    }
    setMessage('');
    setReplyingTo(null);
  };

  const handleReply = (msg: KorumMessage | Message) => {
    setReplyingTo({
      id: msg.id,
      content: msg.content,
      senderName: msg.sender?.full_name || 'Unknown',
    });
  };

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate({ 
      messageId, 
      korumId: selectedKorumId || undefined,
      receiverId: selectedUserId || undefined 
    });
  };

  const handleReact = (messageId: string, emoji: string) => {
    reactToMessage.mutate({ 
      messageId, 
      emoji,
      korumId: selectedKorumId || undefined,
      receiverId: selectedUserId || undefined 
    });
  };

  const handlePinMessage = (messageId: string) => {
    if (selectedKorumId) {
      pinMessage.mutate({ korumId: selectedKorumId, messageId });
    }
  };

  const handleUnpinMessage = (messageId: string) => {
    if (selectedKorumId) {
      unpinMessage.mutate({ korumId: selectedKorumId, messageId });
    }
  };

  const selectedConversation = conversations?.find(c => c.other_user?.id === selectedUserId);
  const pinnedMessages = korumMessages?.filter(m => m.is_pinned) || [];

  const renderReactions = (reactions: { emoji: string; user_id: string; user_name?: string }[] | undefined) => {
    if (!reactions || reactions.length === 0) return null;
    
    // Group by emoji
    const grouped = reactions.reduce((acc, r) => {
      acc[r.emoji] = acc[r.emoji] || [];
      acc[r.emoji].push(r);
      return acc;
    }, {} as Record<string, typeof reactions>);

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(grouped).map(([emoji, users]) => (
          <Badge 
            key={emoji} 
            variant="secondary" 
            className="text-xs px-1.5 py-0 cursor-pointer hover:bg-muted"
            onClick={() => handleReact(reactions[0].user_id, emoji)}
          >
            {emoji} {users.length}
          </Badge>
        ))}
      </div>
    );
  };

  const renderMessage = (msg: KorumMessage | Message, isKorum: boolean) => {
    const isSender = msg.sender_id === user?.id;
    const korumMsg = msg as KorumMessage;
    
    return (
      <div
        key={msg.id}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} group`}
      >
        <div className="flex items-start gap-2 max-w-[80%]">
          {!isSender && isKorum && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={msg.sender?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {msg.sender?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1">
            {!isSender && isKorum && (
              <p className="text-xs text-muted-foreground mb-1">
                {msg.sender?.full_name}
              </p>
            )}
            
            {/* Reply preview */}
            {msg.reply_to && (
              <div className="text-xs bg-muted/50 rounded px-2 py-1 mb-1 border-l-2 border-primary">
                <span className="font-medium">{msg.reply_to.sender_name}: </span>
                <span className="text-muted-foreground truncate">{msg.reply_to.content.substring(0, 50)}...</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <div
                className={`rounded-lg px-4 py-2 ${
                  isSender
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {korumMsg.is_pinned && (
                  <Pin className="h-3 w-3 inline mr-1" />
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
              
              {/* Message actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                {/* Emoji reaction */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" side="top">
                    <div className="flex gap-1">
                      {EMOJI_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className="text-lg hover:bg-muted rounded p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* More options dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isSender ? 'end' : 'start'}>
                    <DropdownMenuItem onClick={() => handleReply(msg)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    
                    {isKorum && isKorumAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        {korumMsg.is_pinned ? (
                          <DropdownMenuItem onClick={() => handleUnpinMessage(msg.id)}>
                            <Pin className="h-4 w-4 mr-2" />
                            Unpin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePinMessage(msg.id)}>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    
                    {isSender && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(msg.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete for everyone
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Reactions */}
            {renderReactions(msg.reactions)}
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please log in to view messages</p>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)]">
        <Card className="h-full flex flex-col md:flex-row overflow-hidden">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${(selectedUserId || selectedKorumId) ? 'hidden md:flex' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              
              <Tabs value={chatType} onValueChange={(v) => setChatType(v as ChatType)} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="direct">Direct</TabsTrigger>
                  <TabsTrigger value="korum">
                    <Users className="h-4 w-4 mr-1" />
                    Korums
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {chatType === 'direct' && (
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
            </CardHeader>
            
            <ScrollArea className="flex-1">
              {chatType === 'direct' ? (
                <>
                  {searchQuery && searchResults && searchResults.length > 0 && (
                    <div className="p-2 border-b">
                      <p className="text-xs text-muted-foreground px-2 mb-2">Search Results</p>
                      {searchResults.map(searchUser => (
                        <div
                          key={searchUser.user_id}
                          onClick={() => {
                            setSelectedUserId(searchUser.user_id);
                            setSelectedKorumId(null);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={searchUser.avatar_url || undefined} />
                            <AvatarFallback>{searchUser.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{searchUser.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{searchUser.department}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {loadingConversations ? (
                    <div className="p-2 space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : conversations && conversations.length > 0 ? (
                    <div className="p-2">
                      {conversations.map(conv => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setSelectedUserId(conv.other_user?.id || null);
                            setSelectedKorumId(null);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                            selectedUserId === conv.other_user?.id ? 'bg-primary/10' : 'hover:bg-muted'
                          }`}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                            <AvatarFallback>
                              {conv.other_user?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {conv.other_user?.full_name || 'Unknown'}
                              </p>
                              {conv.unread_count && conv.unread_count > 0 && (
                                <Badge className="ml-2">{conv.unread_count}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <p className="text-muted-foreground text-sm">No conversations yet</p>
                      <p className="text-muted-foreground text-xs mt-1">Search for users to start chatting</p>
                    </div>
                  )}
                </>
              ) : (
                loadingKorums ? (
                  <div className="p-2 space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : joinedKorums.length > 0 ? (
                  <div className="p-2">
                    {joinedKorums.map(korum => (
                      <div
                        key={korum.id}
                        onClick={() => {
                          setSelectedKorumId(korum.id);
                          setSelectedUserId(null);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                          selectedKorumId === korum.id ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={korum.avatar_url || undefined} />
                          <AvatarFallback>
                            <Users className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{korum.name}</p>
                            {korum.user_role === 'admin' && (
                              <Shield className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {korum.member_count} members
                            {korum.admin_only_posting && (
                              <span className="ml-2 text-warning">Admin only</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm">No korums joined</p>
                    <p className="text-muted-foreground text-xs mt-1">Join a korum to start group chats</p>
                  </div>
                )
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selectedUserId && !selectedKorumId ? 'hidden md:flex' : ''}`}>
            {selectedUserId || selectedKorumId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => {
                      setSelectedUserId(null);
                      setSelectedKorumId(null);
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  {chatType === 'direct' && selectedUserId ? (
                    <>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation?.other_user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {selectedConversation?.other_user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedConversation?.other_user?.full_name || 'New Conversation'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation?.other_user?.department || ''}
                        </p>
                      </div>
                    </>
                  ) : selectedKorum ? (
                    <>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedKorum.avatar_url || undefined} />
                        <AvatarFallback>
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          {selectedKorum.name}
                          {selectedKorum.admin_only_posting && (
                            <Badge variant="outline" className="text-xs">Admin Only</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedKorum.member_count} members • {selectedKorum.type}
                        </p>
                      </div>
                      
                      {/* See Members Button */}
                      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Members
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Members ({selectedKorum.member_count})</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-80">
                            <div className="space-y-2">
                              {korumMembers?.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                      <AvatarFallback>
                                        {member.profiles?.full_name?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{member.profiles?.full_name}</p>
                                      <p className="text-xs text-muted-foreground">{member.profiles?.department}</p>
                                    </div>
                                  </div>
                                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                    {member.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                                    {member.role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                                    {member.role}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : null}
                </div>

                {/* Pinned Messages (Korum only) */}
                {chatType === 'korum' && pinnedMessages.length > 0 && (
                  <div className="bg-muted/50 border-b p-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Pin className="h-3 w-3" />
                      Pinned Messages
                    </div>
                    <ScrollArea className="max-h-24">
                      {pinnedMessages.map(msg => (
                        <div key={msg.id} className="text-sm bg-background rounded p-2 mb-1">
                          <span className="font-medium">{msg.sender?.full_name}: </span>
                          <span className="text-muted-foreground">{msg.content}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {(chatType === 'direct' ? loadingDirectMessages : loadingKorumMessages) ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className={`h-12 w-48 ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                      ))}
                    </div>
                  ) : (chatType === 'direct' ? directMessages : korumMessages) && 
                       (chatType === 'direct' ? directMessages : korumMessages)!.length > 0 ? (
                    <div className="space-y-4">
                      {(chatType === 'direct' ? directMessages : korumMessages)!.map((msg: any) => 
                        renderMessage(msg, chatType === 'korum')
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-4 py-2 border-t bg-muted/50 flex items-center gap-2">
                    <Reply className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">Replying to {replyingTo.senderName}: </span>
                      <span className="text-muted-foreground truncate">{replyingTo.content.substring(0, 50)}...</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t flex gap-2">
                  {(chatType === 'direct' || canPostInKorum) ? (
                    <>
                      <Input
                        placeholder={chatType === 'korum' && !canPostInKorum 
                          ? "Only admins can post in this group" 
                          : replyingTo ? "Reply to message..." : "Type a message..."}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        disabled={chatType === 'korum' && !canPostInKorum}
                      />
                      <Button 
                        onClick={handleSend} 
                        disabled={
                          !message.trim() || 
                          sendMessage.isPending || 
                          sendKorumMessage.isPending ||
                          (chatType === 'korum' && !canPostInKorum)
                        }
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="w-full text-center py-2 text-muted-foreground text-sm">
                      <Shield className="h-4 w-4 inline mr-2" />
                      Only admins and moderators can post in this group
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {chatType === 'direct' 
                      ? 'Select a conversation or search for a user to start chatting'
                      : 'Select a korum to start group chat'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <MobileNav />
    </MainLayout>
  );
}
