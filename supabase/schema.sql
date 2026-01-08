-- =============================================
-- ARCHIVE OF MEME - COMMUNITY SCHEMA
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. TABLA: users (perfiles de usuarios)
CREATE TABLE users (
  wallet_address VARCHAR(42) PRIMARY KEY,
  alias VARCHAR(20) UNIQUE,
  show_alias BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda por alias
CREATE INDEX idx_users_alias ON users(alias);

-- 2. TABLA: comments (comentarios en memes)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id VARCHAR(10) NOT NULL,
  user_wallet VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_comments_meme ON comments(meme_id);
CREATE INDEX idx_comments_user ON comments(user_wallet);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- 3. TABLA: comment_votes (votos en comentarios)
CREATE TABLE comment_votes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_wallet VARCHAR(42) NOT NULL,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_wallet)
);

-- 4. TABLA: reports (reportes de comentarios)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_wallet VARCHAR(42) NOT NULL,
  reason VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voting_ends_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (comment_id, reporter_wallet)
);

-- 5. TABLA: moderation_votes (votos de moderación)
CREATE TABLE moderation_votes (
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_wallet VARCHAR(42) NOT NULL,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('keep', 'remove')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (report_id, user_wallet)
);

-- 6. TABLA: banned_words (palabras prohibidas)
CREATE TABLE banned_words (
  word VARCHAR(50) PRIMARY KEY
);

-- Insertar algunas palabras prohibidas básicas
INSERT INTO banned_words (word) VALUES
  ('spam'),
  ('scam'),
  ('nigger'),
  ('faggot');

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Políticas para comments
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (is_hidden = false);

CREATE POLICY "Authenticated can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (true);

-- Políticas para comment_votes
CREATE POLICY "Votes are viewable by everyone" ON comment_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can vote" ON comment_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can change own vote" ON comment_votes
  FOR UPDATE USING (true);

CREATE POLICY "Users can remove own vote" ON comment_votes
  FOR DELETE USING (true);

-- Políticas para reports
CREATE POLICY "Reports viewable by everyone" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can report" ON reports
  FOR INSERT WITH CHECK (true);

-- Políticas para moderation_votes
CREATE POLICY "Mod votes viewable by everyone" ON moderation_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can vote moderation" ON moderation_votes
  FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Función para obtener el conteo de votos de un comentario
CREATE OR REPLACE FUNCTION get_comment_vote_count(comment_uuid UUID)
RETURNS TABLE (upvotes BIGINT, downvotes BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 1) as upvotes,
    COUNT(*) FILTER (WHERE vote_type = -1) as downvotes
  FROM comment_votes
  WHERE comment_id = comment_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si una palabra está prohibida
CREATE OR REPLACE FUNCTION contains_banned_word(text_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM banned_words
    WHERE LOWER(text_to_check) LIKE '%' || LOWER(word) || '%'
  );
END;
$$ LANGUAGE plpgsql;
