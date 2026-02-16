import St from 'gi://St';
import Clutter from 'gi://Clutter';

export const buildWeekStrip = (week, habit, onToggleDate, _) => {
    const weekBox = new St.BoxLayout({
        vertical: false,
        style_class: 'habit-week-strip',
        x_expand: true,
    });
    const layout = weekBox.get_layout_manager?.();
    if (layout?.set_spacing)
        layout.set_spacing(8);

    for (const day of week) {
        const done = habit.dates?.includes(day.date);
        const dot = new St.Button({
            style_class: [
                'habit-week-dot',
                done ? 'habit-week-dot-done' : 'habit-week-dot-empty',
                day.isToday ? 'habit-week-dot-today' : '',
            ].join(' '),
            x_expand: false,
            y_expand: false,
            reactive: true,
            can_focus: true,
        });
        dot.connect('clicked', () => onToggleDate?.(habit.id, day.date));

        const label = new St.Label({
            text: day.short,
            style_class: `habit-week-day${day.isToday ? ' accent' : ''}`,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        const column = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: false,
            x_align: Clutter.ActorAlign.CENTER,
            style_class: 'habit-week-column',
        });
        column.add_child(dot);
        column.add_child(label);

        weekBox.add_child(column);
    }

    return weekBox;
};
