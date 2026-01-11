import MemeDetail from '@/components/MemeDetail';
import { getMemeIdFromSlug } from '@/utils/slug';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = getMemeIdFromSlug(slug);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/memes/${id}`, {
      next: { revalidate: 60 }
    });
    const data = await res.json();

    if (data.meme) {
      return {
        title: `${data.meme.name} - Archive of Meme`,
        description: data.meme.description?.slice(0, 160) || `View ${data.meme.name} on Archive of Meme`,
        openGraph: {
          title: `${data.meme.name} - Archive of Meme`,
          description: data.meme.description?.slice(0, 160),
          images: [data.meme.image],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'Meme - Archive of Meme',
  };
}

export default async function MemePage({ params }) {
  const { slug } = await params;
  const memeId = getMemeIdFromSlug(slug);

  return <MemeDetail memeId={memeId} />;
}
