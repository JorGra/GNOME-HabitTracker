import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { DEFAULT_ICON } from '../constants.js';
import { buildWeekStrip } from './week-strip.js';
import { createYearGrid } from './year-grid.js';

export const createHabitRow = ({
    habit,
    week,
    todayStr,
    onToggleToday,
    onToggleDate,
    onRemove,
    onEdit,
    onToggleExpand,
    expanded,
    _,
}) => {
    const doneToday = habit.dates?.includes(todayStr);
    const iconName = habit.icon || DEFAULT_ICON;

    const item = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
        hover: false,
    });

    const container = new St.BoxLayout({
        vertical: true,
        style_class: 'habit-row',
        x_expand: true,
    });

    const header = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'habit-row-header',
    });
    const headerLayout = header.get_layout_manager?.();
    if (headerLayout?.set_spacing)
        headerLayout.set_spacing(8);

    const icon = new St.Icon({
        icon_name: iconName,
        style_class: 'habit-row-icon',
        icon_size: 20,
        y_align: Clutter.ActorAlign.CENTER,
    });
    header.add_child(icon);

    const labels = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        y_expand: false,
        y_align: Clutter.ActorAlign.CENTER,
    });
    const titleLabel = new St.Label({
        text: habit.name,
        style_class: 'habit-row-title',
        x_expand: true,
    });
    labels.add_child(titleLabel);
    header.add_child(labels);

    const toggleIcon = new St.Icon({
        icon_name: 'emblem-ok-symbolic',
        icon_size: 16,
    });
    if (!doneToday)
        toggleIcon.opacity = 0;
    const toggleStyle = doneToday
        ? 'border-radius: 99px; background-color: #78aeed; border: 2px solid #78aeed; padding: 6px; color: white;'
        : 'border-radius: 99px; background-color: transparent; border: 2px solid #78aeed; padding: 6px;';
    const toggle = new St.Button({
        style: toggleStyle,
        child: toggleIcon,
        y_align: Clutter.ActorAlign.CENTER,
        can_focus: true,
    });
    toggle.connect('clicked', () => onToggleToday?.(habit.id, !doneToday));
    header.insert_child_at_index(toggle, 0);

    const expandIcon = new St.Icon({
        icon_name: expanded ? 'pan-up-symbolic' : 'pan-down-symbolic',
        style_class: 'habit-expand-icon',
        icon_size: 14,
    });
    const expandBtn = new St.Button({
        child: expandIcon,
        style_class: 'habit-expand-button',
        can_focus: true,
    });

    let isExpanded = expanded;
    expandBtn.connect('clicked', () => {
        isExpanded = !isExpanded;
        details.remove_all_transitions();

        if (isExpanded) {
            details.visible = true;
            details.opacity = 0;
            const [, natHeight] = details.get_preferred_height(-1);
            details.height = 0;
            details.ease({
                height: natHeight,
                opacity: 255,
                duration: 200,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    details.height = -1;
                },
            });
        } else {
            const [, natHeight] = details.get_preferred_height(-1);
            details.height = natHeight;
            details.ease({
                height: 0,
                opacity: 0,
                duration: 200,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    details.visible = false;
                    details.height = -1;
                    details.opacity = 255;
                },
            });
        }

        expandIcon.icon_name = isExpanded ? 'pan-up-symbolic' : 'pan-down-symbolic';
        onToggleExpand?.(habit.id, isExpanded);
    });
    header.add_child(expandBtn);

    const editBtn = new St.Button({
        style_class: 'habit-edit-button',
        child: new St.Icon({ icon_name: 'document-edit-symbolic', icon_size: 16 }),
        can_focus: true,
    });
    editBtn.connect('clicked', () => onEdit?.(habit.id));
    header.add_child(editBtn);

    const removeBtn = new St.Button({
        style_class: 'habit-remove-button',
        child: new St.Icon({ icon_name: 'user-trash-symbolic', icon_size: 16 }),
        can_focus: true,
    });
    removeBtn.connect('clicked', () => onRemove?.(habit.id));
    header.add_child(removeBtn);

    container.add_child(header);

    const weekStrip = buildWeekStrip(week, habit, (id, dateStr) => onToggleDate?.(id, dateStr), _);
    container.add_child(weekStrip);

    const details = new St.BoxLayout({
        vertical: true,
        visible: expanded,
        style_class: 'habit-details',
        x_expand: true,
        clip_to_allocation: true,
    });

    const yearGrid = createYearGrid(
        habit.dates,
        todayStr,
        dateStr => onToggleDate?.(habit.id, dateStr),
        _,
    );

    const yearScroll = new St.ScrollView({
        overlay_scrollbars: false,
        style_class: 'habit-year-scroll',
        x_expand: true,
        hscrollbar_policy: St.PolicyType.NEVER,
        vscrollbar_policy: St.PolicyType.NEVER,
    });
    yearScroll.add_child(yearGrid);
    details.add_child(yearScroll);

    container.add_child(details);

    item.add_child(container);
    return item;
};
