import GLib from 'gi://GLib';

export const todayString = (now = GLib.DateTime.new_now_local()) =>
    now.format('%Y-%m-%d');

export const toDateString = (dt) => dt.format('%Y-%m-%d');

export const parseDate = (dateStr) =>
    GLib.DateTime.new_from_iso8601(`${dateStr}T00:00:00`, GLib.TimeZone.new_local());

export const weekDates = (now = GLib.DateTime.new_now_local()) => {
    const todayStr = todayString(now);
    const offset = now.get_day_of_week() - 1; // Monday = 1
    let day = now.add_days(-offset);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const dateStr = toDateString(day);
        days.push({
            date: dateStr,
            label: day.format('%a %b %d'),
            short: day.format('%a').substring(0, 1),
            isToday: dateStr === todayStr,
        });
        day = day.add_days(1);
    }
    return days;
};
