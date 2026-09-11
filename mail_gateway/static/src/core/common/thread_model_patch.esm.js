import {Thread} from "@mail/core/common/thread_model";
import {fields} from "@mail/core/common/record";
import {imageUrl} from "@web/core/utils/urls";
import {patch} from "@web/core/utils/patch";

patch(Thread.prototype, {
    setup() {
        super.setup(...arguments);
        this.gateway_id = fields.One("mail.gateway");
        /** Id of the partner linked to the gateway token of the channel */
        this.gateway_partner_id = fields.Attr(false);
        /** Gateway notifications selected in the chatter composer */
        this.gateway_notifications = fields.Attr([]);
        this.gateway_followers = fields.Many("res.partner");
    },
    get isChatChannel() {
        return this.channel_type === "gateway" || super.isChatChannel;
    },
    get hasMemberList() {
        return this.channel_type === "gateway" || super.hasMemberList;
    },
    get avatarUrl() {
        if (this.channel_type !== "gateway") {
            return super.avatarUrl;
        }
        return imageUrl("discuss.channel", this.id, "avatar_128", {
            unique: this.avatar_cache_key,
        });
    },
});
