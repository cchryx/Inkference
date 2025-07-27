export default function Page() {
    return (
        <div className="flex h-screen p-4 gap-4 bg-gray-100">
            {/* Left box determines height */}
            <div className="w-2/3 bg-gray-200 p-4 overflow-auto">
                <h2 className="text-xl font-bold mb-2">Left Box</h2>
                <p>This box controls the height of the layout.</p>
                {[...Array(20)].map((_, i) => (
                    <p key={i}>Line {i + 1} in the left box</p>
                ))}
            </div>

            {/* Right column */}
            <div className="w-1/3 flex flex-col">
                {/* Top box: content-sized */}
                <div className="bg-blue-300 p-4">
                    <h2 className="font-semibold">Top Right Box</h2>
                    <p>Auto height based on content.</p>
                </div>

                {/* Bottom box: fills remaining height and scrolls */}
                <div className="flex-1 bg-green-300 p-4 overflow-auto">
                    <h2 className="font-semibold mb-2">Bottom Right Box</h2>
                    {[...Array(50)].map((_, i) => (
                        <p key={i}>Scrollable item {i + 1}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}
