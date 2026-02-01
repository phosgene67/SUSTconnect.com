import { useState, useEffect, useRef } from 'react';
import { MainLayout, MobileNav } from '@/components/layout';
import { useConversations, useMessages, useSendMessage } from '@/hooks/useMessages';
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
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Send, 
  Search,
  ArrowLeft,
} from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading: loadingMessages } = useMessages(selectedUserId || '');
  const sendMessage = useSendMessage();

  // Search users
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
    enabled: !!searchQuery.trim() && !!user,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !selectedUserId) return;
    sendMessage.mutate({ receiverId: selectedUserId, content: message });
    setMessage('');
  };

  const selectedConversation = conversations?.find(c => c.other_user?.id === selectedUserId);

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
          <div className={`w-full md:w-80 border-r flex flex-col ${selectedUserId ? 'hidden md:flex' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1">
              {/* Search Results */}
              {searchQuery && searchResults && searchResults.length > 0 && (
                <div className="p-2 border-b">
                  <p className="text-xs text-muted-foreground px-2 mb-2">Search Results</p>
                  {searchResults.map(user => (
                    <div
                      key={user.user_id}
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Conversations */}
              {loadingConversations ? (
                <div className="p-2 space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="p-2">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedUserId(conv.other_user?.id || null)}
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
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : ''}`}>
            {selectedUserId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedUserId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
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
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className={`h-12 w-48 ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                      ))}
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.sender_id === user.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  />
                  <Button onClick={handleSend} disabled={!message.trim() || sendMessage.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a conversation or search for a user to start chatting</p>
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
