import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/comments/vote - Votar en un comentario
export async function POST(request) {
  try {
    const body = await request.json();
    const { commentId, wallet, voteType } = body;

    // Validations
    if (!commentId || !wallet || ![-1, 1].includes(voteType)) {
      return Response.json({ error: 'commentId, wallet, and voteType (1 or -1) required' }, { status: 400 });
    }

    // Verify user has the OG Pass
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const passResponse = await fetch(`${baseUrl}/api/verify-pass?wallet=${wallet}`);
    const passData = await passResponse.json();

    if (!passData.hasPass) {
      return Response.json({ error: 'OG Pass required to vote' }, { status: 403 });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_wallet', wallet.toLowerCase())
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Same vote - remove it (toggle off)
        await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_wallet', wallet.toLowerCase());

        return Response.json({ success: true, action: 'removed' });
      } else {
        // Different vote - update it
        await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('comment_id', commentId)
          .eq('user_wallet', wallet.toLowerCase());

        return Response.json({ success: true, action: 'changed' });
      }
    }

    // New vote - insert
    const { error } = await supabase
      .from('comment_votes')
      .insert({
        comment_id: commentId,
        user_wallet: wallet.toLowerCase(),
        vote_type: voteType
      });

    if (error) {
      console.error('Error voting:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, action: 'added' });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
