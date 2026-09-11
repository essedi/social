import {Composer} from "@mail/core/common/composer";
import {_t} from "@web/core/l10n/translation";
import {patch} from "@web/core/utils/patch";

patch(Composer.prototype, {
    get SEND_TEXT() {
        if (this.props.type === "gateway" && !this.props.composer.message) {
            return _t("Send gateway");
        }
        return super.SEND_TEXT;
    },
    get placeholder() {
        if (
            this.thread?.model !== "discuss.channel" &&
            !this.props.placeholder &&
            this.props.type === "gateway"
        ) {
            return _t("Send a message to a gateway...");
        }
        return super.placeholder;
    },
    get isSendButtonDisabled() {
        const isSendButtonDisabled = super.isSendButtonDisabled;
        if (this.props.type !== "gateway") {
            return isSendButtonDisabled;
        }
        return isSendButtonDisabled || !this.thread?.gateway_notifications?.length;
    },
    onFocusin() {
        super.onFocusin(...arguments);
        if (
            this.props.type !== "gateway" &&
            this.thread?.gateway_notifications?.length
        ) {
            this.thread.gateway_notifications = [];
        }
    },
    async onClickFullComposer() {
        if (this.props.type !== "gateway") {
            return super.onClickFullComposer(...arguments);
        }
        const thread = this.thread;
        const attachmentIds = this.props.composer.attachments.map(
            (attachment) => attachment.id
        );
        const followers = thread.gateway_followers;
        const context = {
            default_attachment_ids: attachmentIds,
            default_body: this.props.composer.composerHtml,
            default_email_add_signature: false,
            default_model: thread.model,
            default_partner_ids: [],
            default_res_ids: [thread.id],
            default_subtype_xmlid: "mail.mt_comment",
            clicked_on_full_composer: true,
            is_thread_composer: true,
            default_wizard_partner_ids: Array.from(
                new Set(followers.map((follower) => follower.id))
            ),
            default_wizard_channel_ids: Array.from(
                new Set(
                    followers
                        .map((follower) =>
                            follower.gateway_channel_ids.map((channel) => channel.id)
                        )
                        .flat()
                )
            ),
        };
        const action = {
            name: _t("Gateway message"),
            type: "ir.actions.act_window",
            res_model: "mail.compose.gateway.message",
            view_mode: "form",
            views: [[false, "form"]],
            target: "new",
            context,
        };
        const options = {
            onClose: (args) => {
                // Args === { dismiss: true } : click on 'X' or press escape
                // args === { special: true } : click on 'discard'
                const isDiscard = Boolean(args?.dismiss || args?.special);
                if (!isDiscard) {
                    this.clear();
                }
                this.props.composer.replyToMessage = undefined;
                this.onCloseFullComposerCallback(isDiscard);
                this.state.isFullComposerOpen = false;
            },
        };
        await this.env.services.action.doAction(action, options);
        this.state.isFullComposerOpen = true;
    },
});
