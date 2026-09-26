"use client";

import { useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { PROFILE_LINKS } from "@/constants";
import { getPreferences, setPreferences, type Preferences } from "@/actions/preferences";
import { PROFILE_SECTIONS, orderedSections, type ProfileSection } from "@/lib/profileSections";
import { Skeleton } from "@/components/general/Skeleton";

/** Settings > Profile: pick which tabs show, and drag them into order. */
export default function ProfileSectionsForm() {
    const dndId = useId();
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["preferences"], queryFn: () => getPreferences() });
    const hidden = data?.hiddenSections ?? [];
    const order = orderedSections(data?.sectionOrder);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const save = async (patch: Preferences) => {
        queryClient.setQueryData(["preferences"], { ...data, ...patch });
        const { error } = await setPreferences(patch);
        if (error) {
            toast.error(error);
            queryClient.invalidateQueries({ queryKey: ["preferences"] });
        }
    };

    const toggle = (id: ProfileSection) => {
        const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
        if (next.length >= PROFILE_SECTIONS.length) return toast.error("Keep at least one tab.");
        void save({ hiddenSections: next });
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const from = order.indexOf(active.id as ProfileSection);
        const to = order.indexOf(over.id as ProfileSection);
        void save({ sectionOrder: arrayMove(order, from, to) });
    };

    const first = order.find((s) => !hidden.includes(s));

    return (
        <div className="w-full space-y-3 border-gray-200 border p-4 rounded-md lg:col-span-2">
            <div>
                <h1 className="text-base font-semibold">Profile tabs</h1>
                <p className="text-xs text-muted-foreground">
                    Tap to show or hide. Drag to change the order: the first one is what people see first. Hiding one
                    doesn&apos;t delete anything.
                </p>
            </div>
            {isLoading ? (
                <Skeleton className="h-9 w-full rounded-md" />
            ) : (
                <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={order} strategy={horizontalListSortingStrategy}>
                        <div className="flex flex-wrap gap-2">
                            {order.map((id) => (
                                <Chip
                                    key={id}
                                    id={id}
                                    on={!hidden.includes(id)}
                                    first={id === first}
                                    onToggle={() => toggle(id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}

function Chip({ id, on, first, onToggle }: { id: ProfileSection; on: boolean; first: boolean; onToggle: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const link = PROFILE_LINKS.find((l) => l.id === id);
    if (!link) return null;
    const Icon = link.icon;

    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={onToggle}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            {...attributes}
            {...listeners}
            aria-pressed={on}
            className={`flex touch-none select-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-grab active:cursor-grabbing ${
                isDragging ? "z-10 shadow-lg" : ""
            } ${on ? "bg-black text-white hover:bg-gray-800" : "bg-white text-gray-500 ring-1 ring-gray-300 hover:text-black"}`}
        >
            <Icon className="size-3.5" />
            {link.label}
            {first && <span className="rounded-full bg-white/20 px-1.5 text-[10px]">first</span>}
        </button>
    );
}
