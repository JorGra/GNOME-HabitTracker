import St from 'gi://St';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { parseDate, toDateString } from '../date-utils.js';

export const createYearGrid = (habitDates, todayStr, onToggleDate, _) => {
    const container = new St.BoxLayout({
        vertical: false,
        style_class: 'habit-year-grid',
        x_expand: true,
    });

    const doneSet = new Set(habitDates ?? []);

    let endDate = GLib.DateTime.new_now_local();
    for (const dateStr of doneSet) {
        const dt = parseDate(dateStr);
        if (dt && dt.compare(endDate) > 0)
            endDate = dt;
    }

    const startDate = endDate.add_days(-364);
    const startOffset = startDate.get_day_of_week() - 1; // 0 = Monday
    let cursor = startDate.add_days(-startOffset);

    const days = [];
    while (cursor.compare(endDate) <= 0) {
        days.push(cursor);
        cursor = cursor.add_days(1);
    }

    const tail = 7 - ((days.length) % 7);
    for (let i = 0; i < (tail === 7 ? 0 : tail); i++) {
        days.push(cursor);
        cursor = cursor.add_days(1);
    }

    for (let i = 0; i < days.length; i += 7) {
        const week = days.slice(i, i + 7);
        const col = new St.BoxLayout({
            vertical: true,
            style_class: 'habit-year-week',
            x_expand: false,
        });

        week.forEach(day => {
            const dateStr = toDateString(day);
            const inRange = day.compare(startDate) >= 0 && day.compare(endDate) <= 0;
            const done = inRange && doneSet.has(dateStr);
            const dot = new St.BoxLayout({
                style_class: [
                    'habit-year-dot',
                    inRange ? (done ? 'habit-year-dot-done' : 'habit-year-dot-empty') : 'habit-year-dot-empty',
                    dateStr === todayStr ? 'habit-year-dot-today' : '',
                ].join(' '),
            });

            if (inRange) {
                const btn = new St.Button({
                    reactive: true,
                    can_focus: true,
                    style_class: 'habit-year-hit',
                });
                btn.connect('clicked', () => onToggleDate?.(dateStr));
                btn.set_child(dot);

                const tipText = `${day.format('%Y-%m-%d')} - ${done ? (_?.('Done') ?? 'Done') : (_?.('Missed') ?? 'Missed')}`;
                _attachTooltip(btn, tipText);

                col.add_child(btn);
            } else {
                col.add_child(dot);
            }
        });

        container.add_child(col);
    }

    return container;
};

function _attachTooltip(actor, text) {
    let label = null;
    let timeoutId = 0;

    const destroyLabel = () => {
        if (label && label.get_parent())
            label.destroy();
        label = null;
    };

    actor.connect('enter-event', () => {
        if (timeoutId)
            GLib.source_remove(timeoutId);
        timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
            label = new St.Label({ text, style_class: 'habit-tooltip' });
            Main.layoutManager.addTopChrome(label);
            const [x, y] = actor.get_transformed_position();
            label.set_position(x, y - label.height - 6);
            return GLib.SOURCE_REMOVE;
        });
    });

    actor.connect('leave-event', () => {
        if (timeoutId)
            GLib.source_remove(timeoutId);
        timeoutId = 0;
        destroyLabel();
    });
}
