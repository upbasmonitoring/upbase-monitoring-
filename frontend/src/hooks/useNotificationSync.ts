import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";

/**
 * useNotificationSync
 * Global background observer for monitor status changes.
 * Triggers WhatsApp-style popups for down/recovery events.
 */
export const useNotificationSync = () => {
    const { selectedProject } = useProject();
    const prevStatuses = useRef<Record<string, string>>({});

    const { data: monitors } = useQuery({
        queryKey: ["monitors-notification-sync", selectedProject?._id],
        queryFn: async () => {
            if (!selectedProject?._id) return [];
            return await apiFetch(`/monitors?projectId=${selectedProject._id}`);
        },
        refetchInterval: 5000,
        enabled: !!selectedProject?._id,
    });

    useEffect(() => {
        if (!monitors || !Array.isArray(monitors)) return;

        monitors.forEach((monitor: any) => {
            const lastStatus = prevStatuses.current[monitor._id];
            const currentStatus = monitor.status;

            // --- Case 1: Monitor Went DOWN (Critical Alert) ---
            if (lastStatus && lastStatus !== 'DOWN' && currentStatus === 'DOWN') {
                toast.error(`CRITICAL: ${monitor.name} is DOWN`, {
                    description: `${monitor.url} failed validation check. High-priority resolution required.`,
                    duration: 10000,
                    id: `down-${monitor._id}`,
                });
            }

            // --- Case 2: Monitor RECOVERED (Success Alert) ---
            if (lastStatus === 'DOWN' && currentStatus !== 'DOWN') {
                toast.success(`RECOVERY: ${monitor.name} is BACK UP`, {
                    description: `System stability restored at ${new Date().toLocaleTimeString()}.`,
                    duration: 5000,
                    id: `up-${monitor._id}`,
                });
            }

            // Update persistent state
            prevStatuses.current[monitor._id] = currentStatus;
        });
    }, [monitors]);

    return null;
};
