import {Store} from "@mail/core/common/store_service";
import {fields} from "@mail/core/common/record";
import {patch} from "@web/core/utils/patch";

patch(Store.prototype, {
    setup() {
        super.setup(...arguments);
        /** Gateways of the current user, sent by res.users._init_messaging */
        this.gateways = fields.Attr([]);
    },
    tabToThreadType(tab) {
        const types = super.tabToThreadType(...arguments);
        if (tab === "chat") {
            types.push("gateway");
        }
        return types;
    },
    async getMessagePostParams({thread}) {
        const params = await super.getMessagePostParams(...arguments);
        if (thread?.gateway_notifications?.length) {
            params.post_data.gateway_notifications = thread.gateway_notifications;
        }
        return params;
    },
});
