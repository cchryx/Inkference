// components/general/Modal.tsx
import { ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
};

const Modal = ({ open, onClose, children }: ModalProps) => {
    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>,
        document.body
    );
};

export default Modal;
