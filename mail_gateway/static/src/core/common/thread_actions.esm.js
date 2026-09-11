import {_t} from "@web/core/l10n/translation";
import {registerThreadAction} from "@mail/core/common/thread_actions";

/**
 * Conditions are evaluated on every render: keep them synchronous and free of
 * side effects. The gateway partner comes from the server store data.
 */
function isVisibleChannel(owner, thread) {
    return (
        thread?.model === "discuss.channel" &&
        (!owner.props.chatWindow || owner.props.chatWindow.isOpen)
    );
}

function gatewayPartnerId(thread) {
    if (thread.channel_type === "gateway") {
        return thread.gateway_partner_id || false;
    }
    return thread.correspondent?.partner_id?.id || false;
}

registerThreadAction("open-gw-new-partner", {
    condition: ({owner, thread}) =>
        isVisibleChannel(owner, thread) &&
        thread.channel_type === "gateway" &&
        !thread.gateway_partner_id &&
        thread.channel_member_ids.some((member) => member.guest_id),
    icon: "fa fa-fw fa-address-book",
    name: _t("New Partner"),
    async open({owner, thread}) {
        const guest = thread.channel_member_ids.find((m) => m.guest_id)?.guest_id;
        if (!guest) {
            return;
        }
        await owner.env.services.action.doAction(
            {
                type: "ir.actions.act_window",
                res_model: "mail.guest.manage",
                context: {default_guest_id: guest.id},
                views: [[false, "form"]],
                target: "new",
            },
            {
                // Refresh gateway_partner_id and members after the merge
                onClose: () =>
                    thread.store.fetchStoreData("discuss.channel", [thread.id]),
            }
        );
    },
    sequence: 18,
    sequenceGroup: 20,
});
registerThreadAction("open-gw-profile", {
    condition: ({owner, thread}) =>
        isVisibleChannel(owner, thread) && Boolean(gatewayPartnerId(thread)),
    icon: "fa fa-fw fa-user-circle-o",
    name: _t("Open Contact"),
    async open({owner, thread}) {
        await owner.env.services.action.doAction({
            type: "ir.actions.act_window",
            res_model: "res.partner",
            res_id: gatewayPartnerId(thread),
            views: [[false, "form"]],
        });
    },
    sequence: 17,
    sequenceGroup: 20,
});
