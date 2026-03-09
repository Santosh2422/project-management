import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VisibilityState } from '@tanstack/react-table';

// The columns that users are allowed to show/hide, in display order.
export const HIDEABLE_COLUMNS: Array<{ id: string; label: string }> = [
    { id: 'title', label: 'Title' },
    { id: 'assignees', label: 'Assignees' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
];

interface DataTableViewOptionsProps {
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: (visibility: VisibilityState) => void;
}

export function DataTableViewOptions({
    columnVisibility,
    onColumnVisibilityChange,
}: DataTableViewOptionsProps) {
    const toggle = (id: string, checked: boolean) => {
        onColumnVisibilityChange({ ...columnVisibility, [id]: checked });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 px-3 shrink-0">
                    <Settings2 className="h-4 w-4" />
                    Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {HIDEABLE_COLUMNS.map(({ id, label }) => (
                    <DropdownMenuCheckboxItem
                        key={id}
                        className="capitalize"
                        // A column is visible unless explicitly set to false
                        checked={columnVisibility[id] !== false}
                        onCheckedChange={(checked) => toggle(id, checked)}
                    >
                        {label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
