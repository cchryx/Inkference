import React from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

const Modal = ({ open, onClose, children }: Props) => {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-gray-100 rounded-xl w-full md:w-[70%] lg:w-[40%] shadow-lg flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;
