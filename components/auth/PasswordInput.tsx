"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "../ui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
    const [showPassword, setShowPassword] = useState(false);

    const type = showPassword ? "text" : "password";
    const Icon = showPassword ? EyeOffIcon : EyeIcon;

    return (
        <div className="relative">
            <Input className={cn("pe-9", className)} type={type} {...props} />
            <button
                type="button"
                className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
            >
                <Icon className="size-5 stroke-muted-foreground" />
            </button>
        </div>
    );
};
