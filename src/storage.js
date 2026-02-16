import GLib from 'gi://GLib';
import { DEFAULT_ICON } from './constants.js';

export const DATA_DIR = GLib.build_filenamev([GLib.get_user_data_dir(), 'habittracker']);
export const HABITS_FILE = GLib.build_filenamev([DATA_DIR, 'habits.json']);

export const ensureDataDir = () => {
    if (!GLib.file_test(DATA_DIR, GLib.FileTest.IS_DIR))
        GLib.mkdir_with_parents(DATA_DIR, 0o755);
};

export const loadHabits = () => {
    if (!GLib.file_test(HABITS_FILE, GLib.FileTest.IS_REGULAR))
        return [];

    try {
        const [ok, contents] = GLib.file_get_contents(HABITS_FILE);
        if (!ok)
            return [];

        const decoder = new TextDecoder('utf-8');
        const json = decoder.decode(contents);
        const parsed = JSON.parse(json);

        if (!Array.isArray(parsed))
            return [];

        return parsed.map(habit => ({
            ...habit,
            icon: habit.icon || DEFAULT_ICON,
            dates: Array.isArray(habit.dates) ? habit.dates : [],
        }));
    } catch (error) {
        logError(error, 'Failed to load habits file');
        return [];
    }
};

export const saveHabits = (habits) => {
    try {
        ensureDataDir();
        GLib.file_set_contents(HABITS_FILE, JSON.stringify(habits, null, 2));
    } catch (error) {
        logError(error, 'Failed to save habits file');
    }
};
