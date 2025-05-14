export default function Loading() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] p-4 md:p-8">
      {/* Header section */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[rgba(9,203,177,0.823)]">AI Security Buddy</h1>
            <p className="text-[#bbb] mt-2">Your intelligent cybersecurity assistant</p>
          </div>
          <div>
            <span className="text-[rgba(9,203,177,0.823)]">
              Back to Home
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-[#1e1e1e] rounded-lg p-6 shadow-lg border border-[rgba(9,203,177,0.3)]">
          <div className="bg-[#252525] rounded-lg p-4 mb-4 h-[500px] flex items-center justify-center border border-[rgba(9,203,177,0.2)]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[rgba(9,203,177,0.823)] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#bbb]">Loading AI Buddy...</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 p-3 border border-[rgba(9,203,177,0.3)] rounded-lg bg-[#252525] animate-pulse h-12"></div>
            <div className="w-20 bg-[rgba(9,203,177,0.3)] rounded-lg animate-pulse h-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 