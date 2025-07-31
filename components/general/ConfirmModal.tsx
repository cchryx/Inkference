// ConfirmModal.tsx
import React from "react";
import Modal from "./Modal";
import { Button } from "../ui/button";

type Props = {
    isPending: boolean;
    open: boolean;
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: () => void;
    children?: React.ReactNode;
};

const ConfirmModal = ({
    isPending,
    open,
    title,
    text,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onClose,
    children,
}: Props) => {
    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-4 md:p-6 space-y-4">
                <h2 className="text-lg font-semibold">{title}</h2>

                {children ? (
                    <div className="text-sm text-gray-700">{children}</div>
                ) : text ? (
                    <p className="text-sm text-gray-700">{text}</p>
                ) : null}

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="cursor-pointer"
                        disabled={isPending}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="cursor-pointer"
                        disabled={isPending}
                        variant="destructive"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
