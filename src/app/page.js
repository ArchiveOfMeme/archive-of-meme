import Header from '@/components/Header';
import Feed from '@/components/Feed';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="pt-14">
        <Feed />
      </main>
      <Footer />
    </div>
  );
}
