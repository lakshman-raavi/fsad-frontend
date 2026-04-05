import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
    getActivities, addActivity, updateActivity, deleteActivity,
    getUsers, generateId, addNotification, bulkFinalizeAttendance
} from '../utils/storage';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const [activities, setActivitiesState] = useState([]);
    const [users, setUsersState] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshActivities = useCallback(async () => {
        const acts = await getActivities();
        setActivitiesState(Array.isArray(acts) ? acts : []);
    }, []);

    const refreshUsers = useCallback(async () => {
        const allUsers = await getUsers();
        setUsersState(Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'student' || u.role === 'STUDENT') : []);
    }, []);

    useEffect(() => {
        const init = async () => {
            await Promise.all([refreshActivities(), refreshUsers()]);
            setLoading(false);
        };
        init();
    }, [refreshActivities, refreshUsers]);

    const createActivity = useCallback(async (data) => {
        const optimisticId = generateId();
        const optimisticActivity = {
            id: optimisticId,
            ...data,
            attendanceLocked: false,
            createdAt: new Date().toISOString().split('T')[0],
            registrations: [],
        };

        // Optimistic update
        setActivitiesState(prev => [...prev, optimisticActivity]);

        try {
            // Remove frontend string ID before sending to Spring Boot (which expects Long or null)
            const { id, registrations, createdAt, ...payload } = optimisticActivity;
            const res = await addActivity(payload);
            
            // Swap out the optimistic object with the real DB object, ensuring registrations default to []
            const newActivity = { ...optimisticActivity, ...res, registrations: [] };
            setActivitiesState(prev => prev.map(a => a.id === optimisticId ? newActivity : a));
            
            // Trigger background refresh to ensure consistency with backend format and state
            setTimeout(() => refreshActivities(), 100);
            
            return { success: true, activity: newActivity };
        } catch (e) {
            console.error('Context createActivity error', e);
            // Revert state on failure
            setActivitiesState(prev => prev.filter(a => a.id !== optimisticId));
            return { success: false, error: e.response?.data?.message || 'Failed to sync with server' };
        }
    }, []);

    const editActivity = useCallback(async (id, updates) => {
        // Optimistic update
        let updatedActivity = null;
        setActivitiesState(prev => prev.map(a => {
            if (String(a.id) === String(id)) {
                updatedActivity = { ...a, ...updates };
                return updatedActivity;
            }
            return a;
        }));

        try {
            const res = await updateActivity(id, updates);
            // Replace with actual updated object from DB
            setActivitiesState(prev => prev.map(a => String(a.id) === String(id) ? res : a));
            return { success: true, activity: res };
        } catch (e) {
            console.error('Context editActivity error', e);
            await refreshActivities();
            return { success: false, error: e.response?.data?.message || 'Failed to sync edit' };
        }
    }, [refreshActivities]);

    const removeActivity = useCallback(async (id) => {
        // Optimistic update
        setActivitiesState(prev => prev.filter(a => String(a.id) !== String(id)));

        try {
            await deleteActivity(id);
            return { success: true };
        } catch (e) {
            console.error('Context removeActivity error', e);
            await refreshActivities();
            return { success: false, error: e.response?.data?.message || 'Failed to remove from server' };
        }
    }, [refreshActivities]);

    const registerForActivity = useCallback(async (activityId, student) => {
        const act = activities.find(a => a.id === activityId);
        if (!act) return { success: false, error: 'Event not found' };
        if (act.attendanceLocked) return { success: false, error: 'Registration closed — attendance already finalized' };
        if (act.registrations.find(r => r.studentId === student.studentId))
            return { success: false, error: 'Already registered for this event' };

        const newReg = {
            studentId: student.studentId,
            studentName: student.name,
            attended: false,
            points: 0,
        };

        const updatedRegs = [...act.registrations, newReg];

        // Optimistic update
        setActivitiesState(prev => prev.map(a => a.id === activityId ? { ...a, registrations: updatedRegs } : a));

        const updated = await updateActivity(activityId, { registrations: updatedRegs });

        addNotification(student.studentId, {
            type: 'registration',
            message: `You've successfully registered for "${act.name}" on ${act.date}.`,
            activityId,
            activityName: act.name,
        });

        return { success: true, activity: updated };
    }, [activities]);

    const unregister = useCallback(async (activityId, studentId) => {
        const act = activities.find(a => a.id === activityId);
        if (!act) return { success: false, error: 'Event not found' };
        if (act.attendanceLocked) return { success: false, error: 'Cannot unregister after attendance is finalized' };

        const updatedRegs = act.registrations.filter(r => r.studentId !== studentId);

        // Optimistic update
        setActivitiesState(prev => prev.map(a => a.id === activityId ? { ...a, registrations: updatedRegs } : a));

        const updated = await updateActivity(activityId, { registrations: updatedRegs });

        return { success: true, activity: updated };
    }, [activities]);

    const finalizeAttendance = useCallback(async (activityId, attendanceMap) => {
        const act = activities.find(a => a.id === activityId);
        if (!act) return { success: false, error: 'Event not found' };
        if (act.attendanceLocked) return { success: false, error: 'Attendance already locked' };

        const updatedRegs = act.registrations.map(reg => ({
            ...reg,
            studentName: reg.studentName || reg.name, // Normalize to studentName
            attended: attendanceMap[reg.studentId] ?? false,
            points: (attendanceMap[reg.studentId] ?? false) ? act.defaultPoints : 0,
        }));

        // Optimistic update
        setActivitiesState(prev => prev.map(a => a.id === activityId ? { ...a, registrations: updatedRegs, attendanceLocked: true } : a));

        try {
            const payloadRecords = updatedRegs.map(r => ({
                studentId: r.studentId,
                attended: r.attended
            }));
            // 1. Must successfully push summarize table records to MySQL before the DB locks the event
            await bulkFinalizeAttendance(activityId, payloadRecords);
            
            // 2. Update local state caches safely
            await updateActivity(activityId, { registrations: updatedRegs, attendanceLocked: true });
            
        } catch (e) {
            console.error('Failed to sync attendance', e);
        }

        updatedRegs.forEach(reg => {
            addNotification(reg.studentId, {
                type: reg.attended ? 'points' : 'attendance',
                message: reg.attended
                    ? `You attended "${act.name}" and earned ${act.defaultPoints} points! 🎉`
                    : `Attendance finalized for "${act.name}". You were marked absent.`,
                activityId,
                activityName: act.name,
            });
        });

        // Skip refreshActivities() here as it might return stale data on Vercel
        // The optimistic update above is sufficient and trusted.
        return { success: true };
    }, [activities]);

    const reopenAttendance = useCallback(async (activityId) => {
        const act = activities.find(a => a.id === activityId);
        if (!act) return { success: false, error: 'Event not found' };

        const updatedRegs = act.registrations.map(r => ({ ...r, attended: false, points: 0 }));

        // Optimistic update
        setActivitiesState(prev => prev.map(a => a.id === activityId ? { ...a, registrations: updatedRegs, attendanceLocked: false } : a));

        await updateActivity(activityId, { registrations: updatedRegs, attendanceLocked: false });
        // Skip refreshActivities() to preserve local state
        return { success: true };
    }, [activities]);

    return (
        <DataContext.Provider value={{
            activities, users, loading, refreshActivities,
            createActivity, editActivity, removeActivity,
            registerForActivity, unregister,
            finalizeAttendance, reopenAttendance,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useDataContext must be used inside DataProvider');
    return ctx;
};
