import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/comments?meme_id=X - Listar comentarios de un meme
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const memeId = searchParams.get('meme_id');

  if (!memeId) {
    return Response.json({ error: 'meme_id required' }, { status: 400 });
  }

  try {
    // Get comments with user info and vote counts
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        meme_id,
        user_wallet,
        content,
        parent_id,
        is_hidden,
        created_at,
        users (alias, show_alias)
      `)
      .eq('meme_id', memeId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get vote counts for each comment
    const commentIds = comments.map(c => c.id);
    const { data: votes } = await supabase
      .from('comment_votes')
      .select('comment_id, vote_type')
      .in('comment_id', commentIds);

    // Calculate vote counts
    const voteCounts = {};
    votes?.forEach(v => {
      if (!voteCounts[v.comment_id]) {
        voteCounts[v.comment_id] = { up: 0, down: 0 };
      }
      if (v.vote_type === 1) voteCounts[v.comment_id].up++;
      else voteCounts[v.comment_id].down++;
    });

    // Format response
    const formattedComments = comments.map(c => ({
      id: c.id,
      memeId: c.meme_id,
      content: c.content,
      parentId: c.parent_id,
      createdAt: c.created_at,
      author: {
        wallet: c.user_wallet,
        alias: c.users?.alias,
        showAlias: c.users?.show_alias ?? true,
        displayName: c.users?.show_alias && c.users?.alias
          ? c.users.alias
          : `${c.user_wallet.slice(0, 6)}...${c.user_wallet.slice(-4)}`
      },
      votes: {
        up: voteCounts[c.id]?.up || 0,
        down: voteCounts[c.id]?.down || 0
      }
    }));

    // Organize into threads (parent comments with replies)
    const parentComments = formattedComments.filter(c => !c.parentId);
    const replies = formattedComments.filter(c => c.parentId);

    const threads = parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(r => r.parentId === parent.id)
    }));

    return Response.json({ comments: threads, total: threads.length });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/comments - Crear nuevo comentario
export async function POST(request) {
  try {
    const body = await request.json();
    const { memeId, content, parentId, wallet } = body;

    // Validations
    if (!memeId || !content || !wallet) {
      return Response.json({ error: 'memeId, content, and wallet required' }, { status: 400 });
    }

    if (content.length > 500) {
      return Response.json({ error: 'Comment too long (max 500 chars)' }, { status: 400 });
    }

    // Check for banned words
    const { data: hasBanned } = await supabase
      .rpc('contains_banned_word', { text_to_check: content });

    if (hasBanned) {
      return Response.json({ error: 'Comment contains prohibited words' }, { status: 400 });
    }

    // Verify user has the Community Pass
    const passResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'http://localhost:3000' : ''}/api/verify-pass?wallet=${wallet}`
    );
    const passData = await passResponse.json();

    if (!passData.hasPass) {
      return Response.json({ error: 'Community Pass required to comment' }, { status: 403 });
    }

    // Ensure user exists in users table
    const { error: userError } = await supabase
      .from('users')
      .upsert({ wallet_address: wallet.toLowerCase() }, { onConflict: 'wallet_address' });

    if (userError) {
      console.error('Error upserting user:', userError);
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        meme_id: memeId,
        user_wallet: wallet.toLowerCase(),
        content: content.trim(),
        parent_id: parentId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, comment });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
