import {Thread} from "@mail/core/common/thread_model";
import {patch} from "@web/core/utils/patch";

patch(Thread.prototype, {
    _computeDiscussAppCategory() {
        if (this.channel_type === "gateway" && !this.parent_channel_id) {
            return this.store.discuss.gateway;
        }
        return super._computeDiscussAppCategory(...arguments);
    },
    _computeDisplayInSidebar() {
        if (this.channel_type === "gateway" && !this.parent_channel_id) {
            // Gateway users see every gateway channel they can read, even when
            // they are not a member of it. Only an explicit unpin hides it.
            return this.self_member_id ? this.self_member_id.is_pinned : true;
        }
        return super._computeDisplayInSidebar(...arguments);
    },
});
