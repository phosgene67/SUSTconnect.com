import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { usePost, useVote, Post } from '@/hooks/usePosts';
import { useComments, useCreateComment, Comment } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  ArrowLeft,
  MessageCircle,
  Send,
  Reply,
  MoreHorizontal,
} from 'lucide-react';

const categoryColors: Record<string, string> = {
  academic_help: 'bg-blue-500/10 text-blue-600',
  project: 'bg-green-500/10 text-green-600',
  notice: 'bg-orange-500/10 text-orange-600',
  question: 'bg-purple-500/10 text-purple-600',
  resource: 'bg-pink-500/10 text-pink-600',
};

const categoryLabels: Record<string, string> = {
  academic_help: 'Academic Help',
  project: 'Project',
  notice: 'Notice',
  question: 'Question',
  resource: 'Resource',
};

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth?: number;
}

function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const vote = useVote();
  const createComment = useCreateComment();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const score = (comment.upvotes || 0) - (comment.downvotes || 0);

  const handleVote = (value: 1 | -1) => {
    if (!user) return;
    const newValue = comment.user_vote === value ? 0 : value;
    vote.mutate({ targetId: comment.id, targetType: 'comment', value: newValue as 1 | -1 | 0 });
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    createComment.mutate(
      { postId, content: replyContent, parentId: comment.id },
      {
        onSuccess: () => {
          setReplyContent('');
          setIsReplying(false);
        },
      }
    );
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        {/* Vote buttons */}
        <div className="flex flex-col items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${comment.user_vote === 1 ? 'text-primary bg-primary/10' : ''}`}
            onClick={() => handleVote(1)}
          >
            <ArrowBigUp className="h-4 w-4" />
          </Button>
          <span className={`text-xs font-medium ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : ''}`}>
            {score}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${comment.user_vote === -1 ? 'text-destructive bg-destructive/10' : ''}`}
            onClick={() => handleVote(-1)}
          >
            <ArrowBigDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={comment.author?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {comment.author?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <Link 
              to={`/profile/${comment.author_id}`} 
              className="text-sm font-medium hover:underline"
            >
              {comment.author?.full_name || 'Unknown'}
            </Link>
            <span className="text-xs text-muted-foreground">
              {comment.author?.department}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center gap-2 mt-2">
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleReply}
                  disabled={!replyContent.trim() || createComment.isPending}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Reply
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsReplying(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              postId={postId} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: post, isLoading: postLoading } = usePost(postId || '');
  const { data: comments, isLoading: commentsLoading } = useComments(postId || '');
  const vote = useVote();
  const createComment = useCreateComment();
  
  const [newComment, setNewComment] = useState('');

  if (!postId) {
    return <div>Invalid post</div>;
  }

  const handleVote = (value: 1 | -1) => {
    if (!user || !post) return;
    const newValue = post.user_vote === value ? 0 : value;
    vote.mutate({ targetId: post.id, targetType: 'post', value: newValue as 1 | -1 | 0 });
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    createComment.mutate(
      { postId, content: newComment },
      {
        onSuccess: () => setNewComment(''),
      }
    );
  };

  const score = post ? (post.upvotes || 0) - (post.downvotes || 0) : 0;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {postLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : post ? (
          <>
            {/* Post */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Vote buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 ${post.user_vote === 1 ? 'text-primary bg-primary/10' : ''}`}
                      onClick={() => handleVote(1)}
                    >
                      <ArrowBigUp className="h-6 w-6" />
                    </Button>
                    <span className={`text-lg font-bold ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : ''}`}>
                      {score}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 ${post.user_vote === -1 ? 'text-destructive bg-destructive/10' : ''}`}
                      onClick={() => handleVote(-1)}
                    >
                      <ArrowBigDown className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Category & Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className={categoryColors[post.category] || ''}>
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <Link to={`/profile/${post.author_id}`} className="flex items-center gap-2 hover:underline">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {post.author?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{post.author?.full_name || 'Unknown'}</span>
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {post.author?.department} • {post.author?.batch}
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

                    {/* Content */}
                    <div className="prose prose-sm max-w-none mb-4">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {post.comment_count || 0} Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* New Comment Form */}
                {user ? (
                  <div className="mb-6">
                    <Textarea
                      placeholder="What are your thoughts?"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] mb-2"
                    />
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || createComment.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground mb-2">Log in to join the discussion</p>
                    <Button asChild>
                      <Link to="/login">Log In</Link>
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="divide-y">
                    {comments.map((comment) => (
                      <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        postId={postId} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="font-semibold mb-2">Post not found</h3>
              <p className="text-muted-foreground mb-4">This post may have been deleted.</p>
              <Button asChild>
                <Link to="/feed">Back to Feed</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
