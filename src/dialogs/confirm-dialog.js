import GObject from 'gi://GObject';
import St from 'gi://St';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

export const ConfirmDialog = GObject.registerClass(
class ConfirmDialog extends ModalDialog.ModalDialog {
    constructor({ message, confirmLabel, onConfirm, _ }) {
        super({ styleClass: 'habit-confirm-dialog' });

        const label = new St.Label({
            text: message,
            style_class: 'habit-confirm-message',
            x_expand: true,
        });
        this.contentLayout.add_child(label);

        this.setButtons([
            { label: _('Cancel'), action: () => this.close() },
            { label: confirmLabel, action: () => { onConfirm(); this.close(); }, default: true },
        ]);
    }
});
