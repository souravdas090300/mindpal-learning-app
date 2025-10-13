export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            MindPal
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your AI-powered learning companion. Save content, generate flashcards, 
            and master knowledge with spaced repetition.
          </p>
          <div className="space-x-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Get Started
            </button>
            <button className="border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-white transition">
              Learn More
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="text-xl font-semibold mb-2">AI-Generated Flashcards</h3>
            <p className="text-gray-600">
              Save any content and let AI create personalized flashcards for effective learning.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-xl font-semibold mb-2">Smart Summaries</h3>
            <p className="text-gray-600">
              Get concise AI-powered summaries of articles, notes, and documents instantly.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="text-xl font-semibold mb-2">Spaced Repetition</h3>
            <p className="text-gray-600">
              Review flashcards at optimal intervals to maximize retention and learning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
