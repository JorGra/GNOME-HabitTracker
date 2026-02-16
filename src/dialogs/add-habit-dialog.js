import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

export const AddHabitDialog = GObject.registerClass(
class AddHabitDialog extends ModalDialog.ModalDialog {
    constructor({ onAdd, _, iconChoices, defaultIcon, initialName = '', initialIcon = null, confirmLabel = _('Add') }) {
        super({ styleClass: 'habit-add-dialog' });

        this._onAdd = onAdd;
        this._ = _;
        this._iconChoices = iconChoices;
        this._defaultIcon = defaultIcon;

        this._iconIndex = Math.max(0, iconChoices.indexOf(initialIcon ?? defaultIcon));

        const content = new St.BoxLayout({
            vertical: true,
            style_class: 'habit-dialog-content',
            x_expand: true,
        });
        const contentLayout = content.get_layout_manager?.();
        if (contentLayout?.set_spacing)
            contentLayout.set_spacing(10);

        this._entry = new St.Entry({
            hint_text: _('e.g. Meditate'),
            can_focus: true,
            style_class: 'habit-entry',
            x_expand: true,
        });
        if (initialName)
            this._entry.set_text(initialName);
        content.add_child(this._entry);

    const iconRow = new St.BoxLayout({
        vertical: false,
        style_class: 'habit-icon-row',
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
    });
    const iconRowLayout = iconRow.get_layout_manager?.();
    if (iconRowLayout?.set_spacing)
        iconRowLayout.set_spacing(8);
        const iconLabel = new St.Label({
            text: _('Icon'),
            x_expand: true,
        });
        this._iconPreview = new St.Icon({
            icon_name: this._iconChoices[this._iconIndex] || this._defaultIcon,
            icon_size: 24,
            style_class: 'habit-icon-preview',
        });
        const cycleButton = new St.Button({
            label: _('Next'),
            style_class: 'habit-cycle-button',
            x_align: Clutter.ActorAlign.END,
        });
        cycleButton.connect('clicked', () => this._cycleIcon());

        iconRow.add_child(iconLabel);
        iconRow.add_child(this._iconPreview);
        iconRow.add_child(cycleButton);
        content.add_child(iconRow);

        this.contentLayout.add_child(content);

        this.setButtons([
            { label: _('Cancel'), action: () => this.close() },
            { label: confirmLabel, action: () => this._submit(), default: true },
        ]);

        this._entry.clutter_text.connect('text-changed', () => this._syncAddState());
        this._entry.clutter_text.connect('activate', () => this._submit());
        this._syncAddState();
    }

    _cycleIcon() {
        this._iconIndex = (this._iconIndex + 1) % this._iconChoices.length;
        this._iconPreview.icon_name = this._iconChoices[this._iconIndex] || this._defaultIcon;
    }

    _syncAddState() {
        const hasText = this._entry.get_text().trim().length > 0;
        const addButton = this._buttons?.[1];
        if (addButton) {
            addButton.reactive = hasText;
            addButton.can_focus = hasText;
            addButton.opacity = hasText ? 255 : 80;
        }
    }

    _submit() {
        const name = this._entry.get_text().trim();
        if (!name)
            return;

        const iconName = this._iconChoices[this._iconIndex] || this._defaultIcon;
        this._onAdd?.(name, iconName);
        this.close();
    }
});
