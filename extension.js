/* extension.js
 *
 * Habit tracker shell indicator that reuses the logic from the old GTK app.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { todayString, weekDates } from './src/date-utils.js';
import { loadHabits, saveHabits, ensureDataDir } from './src/storage.js';
import { AddHabitDialog } from './src/dialogs/add-habit-dialog.js';
import { createHabitRow } from './src/views/habit-row.js';
import { DEFAULT_ICON, ICON_CHOICES } from './src/constants.js';

const HabitTrackerIndicator = GObject.registerClass(
class HabitTrackerIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, _('Habit Tracker'));

        this._extension = extension;
        this._addDialog = null;
        this._habits = loadHabits();
        this._expandedIds = new Set();

        this.add_child(new St.Icon({
            icon_name: 'emblem-ok-symbolic',
            style_class: 'system-status-icon',
        }));

        const addItem = new PopupMenu.PopupMenuItem(_('Add habit...'));
        addItem.connect('activate', () => this._openAddDialog());
        this.menu.addMenuItem(addItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._emptyItem = new PopupMenu.PopupMenuItem(_('No habits yet'));
        this._emptyItem.setSensitive(false);
        this.menu.addMenuItem(this._emptyItem);

        this._section = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._section);

        this._renderHabits();
    }

    _destroyDialog() {
        if (this._addDialog) {
            this._addDialog.destroy();
            this._addDialog = null;
        }
    }

    _openAddDialog() {
        this._destroyDialog();
        this._addDialog = new AddHabitDialog({
            onAdd: (name, iconName) => this._addHabit(name, iconName),
            _: _,
            iconChoices: ICON_CHOICES,
            defaultIcon: DEFAULT_ICON,
            confirmLabel: _('Add'),
            initialName: '',
            initialIcon: DEFAULT_ICON,
        });
        this._addDialog.open(global.get_current_time());
        this._addDialog._entry?.grab_key_focus?.();
    }

    _openEditDialog(habitId) {
        const habit = this._habits.find(h => h.id === habitId);
        if (!habit)
            return;

        this._destroyDialog();
        this._addDialog = new AddHabitDialog({
            onAdd: (name, iconName) => {
                habit.name = name;
                habit.icon = iconName;
                saveHabits(this._habits);
                this._renderHabits();
                Main.notify(_('Updated "%s"').format(name));
            },
            _: _,
            iconChoices: ICON_CHOICES,
            defaultIcon: DEFAULT_ICON,
            confirmLabel: _('Save'),
            initialName: habit.name,
            initialIcon: habit.icon,
        });
        this._addDialog.open(global.get_current_time());
        this._addDialog._entry?.grab_key_focus?.();
    }

    _addHabit(name, iconName = DEFAULT_ICON) {
        const newHabit = {
            id: GLib.uuid_string_random(),
            name,
            dates: [],
            icon: iconName || DEFAULT_ICON,
        };

        this._habits.unshift(newHabit);
        saveHabits(this._habits);
        this._renderHabits();
        Main.notify(_('Added "%s"').format(name));
    }

    _weekToday() {
        return {
            today: todayString(),
            week: weekDates(),
        };
    }

    _setHabitDone(habitId, dateStr, done) {
        const habit = this._habits.find(h => h.id === habitId);
        if (!habit)
            return;

        habit.dates = habit.dates ?? [];

        if (done) {
            if (!habit.dates.includes(dateStr))
                habit.dates.push(dateStr);
        } else {
            habit.dates = habit.dates.filter(date => date !== dateStr);
        }

        saveHabits(this._habits);
    }

    _toggleHabitDay(habitId, dateStr) {
        const habit = this._habits.find(h => h.id === habitId);
        if (!habit)
            return;

        const has = habit.dates?.includes(dateStr);
        this._setHabitDone(habitId, dateStr, !has);
        this._renderHabits();
    }

    _removeHabit(habitId) {
        this._habits = this._habits.filter(h => h.id !== habitId);
        this._expandedIds.delete(habitId);
        saveHabits(this._habits);
        this._renderHabits();
        Main.notify(_('Removed habit'));
    }

    _renderHabits() {
        const { today, week } = this._weekToday();

        // capture expanded state before clearing
        const prevExpanded = new Set(this._expandedIds);
        this._expandedIds.clear();

        this._section.removeAll();

        if (this._habits.length === 0) {
            this._emptyItem.visible = true;
            return;
        }

        this._emptyItem.visible = false;

        for (const habit of this._habits) {
            const expanded = prevExpanded.has(habit.id);
            const row = createHabitRow({
                habit,
                week,
                todayStr: today,
                onToggleToday: (habitId, done) => {
                    this._setHabitDone(habitId, today, done);
                    this._renderHabits();
                },
                onToggleDate: (habitId, dateStr) => this._toggleHabitDay(habitId, dateStr),
                onRemove: (habitId) => this._removeHabit(habitId),
                onEdit: (habitId) => this._openEditDialog(habitId),
                onToggleExpand: (habitId, isExpanded) => {
                    if (isExpanded)
                        this._expandedIds.add(habitId);
                    else
                        this._expandedIds.delete(habitId);
                },
                expanded,
                _: _,
            });
            this._section.addMenuItem(row);
            if (expanded)
                this._expandedIds.add(habit.id);
        }
    }

    destroy() {
        this._destroyDialog();
        super.destroy();
    }
});

export default class HabitTrackerExtension extends Extension {
    enable() {
        ensureDataDir();
        this._indicator = new HabitTrackerIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
