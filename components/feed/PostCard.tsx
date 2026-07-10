'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Heart, MessageCircle, Share2, Users, MoreHorizontal } from 'lucide-react';
import { spring } from '@/lib/motion';
import { ActivityPost } from './ActivityPost';
import { EventPost } from './EventPost';
import { PhotoPost } from './PhotoPost';
import type { FeedPost } from './data';

interface PostCardProps {
  post: FeedPost;
}

// memo: filter changes in FeedClient only re-render cards whose post reference changed.
// Post objects are stable references from the useState array, so unchanged posts skip.
export const PostCard = memo(function PostCard({ post }: PostCardProps) {
  const [liked, setLiked]         = useState(false);
  const [joined, setJoined]       = useState(false);
  const [likeDelta, setLikeDelta] = useState(0);
  const [joinDelta, setJoinDelta] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [flyKey, setFlyKey]       = useState(0);
  const [showFly, setShowFly]     = useState(false);
  const reduced = useEffectiveReducedMotion();

  const baseReactions = post.type === 'photo' ? post.likeCount : post.reactions;
  const displayReactions = baseReactions + likeDelta;
  const baseGoing = (post.type === 'activity' || post.type === 'event') ? post.goingCount : 0;
  const displayGoing = baseGoing + joinDelta;

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikeDelta(d => next ? d + 1 : d - 1);
    if (next && !reduced) {
      setShowFly(true);
      setFlyKey(k => k + 1);
      setTimeout(() => setShowFly(false), 700);
    }
  }

  function toggleJoin() {
    const next = !joined;
    setJoined(next);
    setJoinDelta(d => next ? d + 1 : d - 1);
  }

  return (
    <article
      className="rounded-[var(--radius-lg)] overflow-hidden flex flex-col"
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-1)',
        border: '1px solid rgba(20,26,46,0.06)',
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0">
          {post.author.avatar ? (
            <Image src={post.author.avatar} alt={post.author.name} fill sizes="40px" className="object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-sm font-semibold text-white"
              style={{ background: 'var(--grad-cta)' }}
              aria-hidden="true"
            >
              {post.author.name[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--color-ink)' }}>
            {post.author.name}
          </p>
          <p className="text-xs leading-tight" style={{ color: 'var(--color-ink-muted)' }}>
            {post.author.area} · {post.timeAgo}
          </p>
        </div>
        <button aria-label="More options" className="p-1.5 rounded-full shrink-0" style={{ color: 'var(--color-ink-muted)' }}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post body */}
      <div className="px-4 pb-3">
        {post.type === 'activity' && <ActivityPost post={post} />}
        {post.type === 'event'    && <EventPost post={post} />}
        {post.type === 'photo'    && (
          <PhotoPost
            post={post}
            liked={liked}
            onDoubleTapLike={() => { setLiked(true); setLikeDelta(d => d + 1); }}
          />
        )}
      </div>

      {/* Action row */}
      <div
        className="flex items-center gap-0.5 px-2 py-1.5"
        style={{ borderTop: '1px solid rgba(20,26,46,0.06)' }}
      >
        {/* Like — with fly-up ❤️ on press */}
        <div className="relative">
          <motion.button
            onClick={toggleLike}
            whileTap={reduced ? {} : { scale: 0.8 }}
            transition={spring.stamp}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike' : 'Like'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold"
            style={{ color: liked ? '#E53E3E' : 'var(--color-ink-muted)' }}
          >
            <Heart size={16} fill={liked ? '#E53E3E' : 'none'} aria-hidden="true" />
            <motion.span
              key={displayReactions}
              initial={reduced ? {} : { scale: 1.4, y: -2 }}
              animate={{ scale: 1, y: 0, transition: spring.snappy }}
            >
              {displayReactions}
            </motion.span>
          </motion.button>
          <AnimatePresence>
            {showFly && (
              <motion.span
                key={flyKey}
                className="absolute -top-1 left-3 pointer-events-none text-base"
                initial={{ opacity: 1, y: 0, scale: 0.7 }}
                animate={{ opacity: 0, y: -28, scale: 1.2 }}
                exit={{}}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                aria-hidden="true"
              >
                ❤️
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Join / RSVP — activity and event only */}
        {(post.type === 'activity' || post.type === 'event') && (
          <motion.button
            onClick={toggleJoin}
            whileTap={reduced ? {} : { scale: 0.88 }}
            transition={spring.stamp}
            aria-pressed={joined}
            aria-label={joined ? 'Leave' : post.type === 'event' ? 'RSVP Going' : 'Join activity'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-semibold transition-colors"
            style={
              joined
                ? { background: 'var(--color-azure)', color: 'white' }
                : {
                    background: 'rgba(46,107,255,0.07)',
                    color: 'var(--color-azure)',
                    border: '1.5px solid rgba(46,107,255,0.2)',
                  }
            }
          >
            <Users size={13} aria-hidden="true" />
            {joined ? 'Going' : post.type === 'event' ? 'RSVP' : 'Join'}
            <motion.span
              key={displayGoing}
              initial={reduced ? {} : { scale: 1.35 }}
              animate={{ scale: 1, transition: spring.snappy }}
            >
              · {displayGoing}
            </motion.span>
          </motion.button>
        )}

        {/* Comment toggle */}
        <button
          onClick={() => setCommentsOpen(v => !v)}
          aria-expanded={commentsOpen}
          aria-label={`${post.comments.length} comments`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold"
          style={{ color: commentsOpen ? 'var(--color-azure)' : 'var(--color-ink-muted)' }}
        >
          <MessageCircle size={16} aria-hidden="true" />
          {post.comments.length}
        </button>

        {/* Share */}
        <button
          aria-label="Share"
          className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold ml-auto"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <Share2 size={15} aria-hidden="true" />
          Share
        </button>
      </div>

      {/* Expandable comments */}
      {commentsOpen && post.comments.length > 0 && (
        <div
          className="px-4 pb-4 flex flex-col gap-2.5 pt-3"
          style={{ borderTop: '1px solid rgba(20,26,46,0.05)' }}
        >
          {post.comments.map(c => (
            <div key={c.id} className="flex gap-2.5 items-start">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-white"
                style={{ background: 'var(--grad-violet-azure)' }}
                aria-hidden="true"
              >
                {c.author[0].toUpperCase()}
              </div>
              <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--color-ink)' }}>
                <span className="font-semibold mr-1">{c.author}</span>
                {c.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
});
