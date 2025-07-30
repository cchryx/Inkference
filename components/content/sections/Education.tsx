const Education = () => {
    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className="h-[400px] bg-gray-200 rounded-md shadow-md p-6"
                >
                    <h2 className="font-semibold text-gray-800">
                        Box #{i + 1}
                    </h2>
                    <p className="text-sm text-gray-500">
                        This is some placeholder content to create scroll space.
                    </p>
                </div>
            ))}
        </div>
    );
};

export default Education;
