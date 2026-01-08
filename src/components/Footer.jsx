export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0a] py-8">
      <div className="max-w-xl mx-auto px-4 text-center">
        <p className="text-[#444] text-xs">
          &copy; {currentYear} Archive of Meme
        </p>
      </div>
    </footer>
  );
}
