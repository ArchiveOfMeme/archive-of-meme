-- =============================================
-- SCHEMA: AVATAR DE PERFIL
-- Archive of Meme - Enero 2026
-- =============================================

-- Añadir campos de avatar a mining_users
ALTER TABLE mining_users
ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS avatar_nft_contract VARCHAR(42),
ADD COLUMN IF NOT EXISTS avatar_nft_token_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_nft_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS avatar_auto_mode BOOLEAN DEFAULT TRUE;

-- Comentarios
COMMENT ON COLUMN mining_users.avatar_type IS 'Tipo de avatar: default, miner, pass, meme';
COMMENT ON COLUMN mining_users.avatar_nft_contract IS 'Contrato del NFT usado como avatar';
COMMENT ON COLUMN mining_users.avatar_nft_token_id IS 'Token ID del NFT usado como avatar';
COMMENT ON COLUMN mining_users.avatar_nft_url IS 'URL de la imagen del NFT';
COMMENT ON COLUMN mining_users.avatar_auto_mode IS 'TRUE=sistema auto-asigna avatar, FALSE=usuario controla manualmente';

-- =============================================
-- TABLA: Cache de NFTs del usuario
-- Almacena todos los NFTs que posee para selector de avatar
-- =============================================
CREATE TABLE IF NOT EXISTS user_nft_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mining_users(id) ON DELETE CASCADE,
  contract_address VARCHAR(42) NOT NULL,
  token_id VARCHAR(100) NOT NULL,
  collection_type VARCHAR(20) NOT NULL, -- 'miner', 'pass', 'meme'
  name VARCHAR(200),
  image_url VARCHAR(500),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contract_address, token_id)
);

CREATE INDEX IF NOT EXISTS idx_user_nft_cache_user ON user_nft_cache(user_id);

-- =============================================
-- FUNCIÓN: Actualizar avatar del usuario (manual)
-- Cuando el usuario cambia manualmente, desactiva modo auto
-- =============================================
CREATE OR REPLACE FUNCTION update_user_avatar(
  p_user_id UUID,
  p_avatar_type VARCHAR(20),
  p_contract VARCHAR(42) DEFAULT NULL,
  p_token_id VARCHAR(100) DEFAULT NULL,
  p_image_url VARCHAR(500) DEFAULT NULL,
  p_is_manual BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE mining_users
  SET
    avatar_type = p_avatar_type,
    avatar_nft_contract = p_contract,
    avatar_nft_token_id = p_token_id,
    avatar_nft_url = p_image_url,
    avatar_auto_mode = CASE WHEN p_is_manual THEN FALSE ELSE avatar_auto_mode END,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Auto-asignar avatar cuando se detectan NFTs
-- Solo si el usuario está en modo automático
-- =============================================
CREATE OR REPLACE FUNCTION auto_assign_avatar(
  p_user_id UUID,
  p_avatar_type VARCHAR(20),
  p_contract VARCHAR(42),
  p_token_id VARCHAR(100),
  p_image_url VARCHAR(500)
)
RETURNS BOOLEAN AS $$
DECLARE
  is_auto_mode BOOLEAN;
BEGIN
  -- Verificar si el usuario está en modo auto
  SELECT avatar_auto_mode INTO is_auto_mode
  FROM mining_users
  WHERE id = p_user_id;

  -- Solo actualizar si está en modo auto
  IF is_auto_mode = TRUE THEN
    UPDATE mining_users
    SET
      avatar_type = p_avatar_type,
      avatar_nft_contract = p_contract,
      avatar_nft_token_id = p_token_id,
      avatar_nft_url = p_image_url,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Obtener NFTs disponibles para avatar
-- =============================================
CREATE OR REPLACE FUNCTION get_user_avatar_options(p_user_id UUID)
RETURNS TABLE(
  contract_address VARCHAR(42),
  token_id VARCHAR(100),
  collection_type VARCHAR(20),
  name VARCHAR(200),
  image_url VARCHAR(500)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unc.contract_address,
    unc.token_id,
    unc.collection_type,
    unc.name,
    unc.image_url
  FROM user_nft_cache unc
  WHERE unc.user_id = p_user_id
    AND unc.image_url IS NOT NULL
  ORDER BY
    CASE unc.collection_type
      WHEN 'miner' THEN 1
      WHEN 'pass' THEN 2
      WHEN 'meme' THEN 3
      ELSE 4
    END,
    unc.cached_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Cachear NFTs del usuario
-- =============================================
CREATE OR REPLACE FUNCTION cache_user_nft(
  p_user_id UUID,
  p_contract VARCHAR(42),
  p_token_id VARCHAR(100),
  p_collection_type VARCHAR(20),
  p_name VARCHAR(200),
  p_image_url VARCHAR(500)
)
RETURNS UUID AS $$
DECLARE
  cached_id UUID;
BEGIN
  INSERT INTO user_nft_cache (user_id, contract_address, token_id, collection_type, name, image_url)
  VALUES (p_user_id, p_contract, p_token_id, p_collection_type, p_name, p_image_url)
  ON CONFLICT (user_id, contract_address, token_id)
  DO UPDATE SET
    name = p_name,
    image_url = p_image_url,
    cached_at = NOW()
  RETURNING id INTO cached_id;

  RETURN cached_id;
END;
$$ LANGUAGE plpgsql;
