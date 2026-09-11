import {Message} from "@mail/core/common/message_model";
import {fields} from "@mail/core/common/record";
import {patch} from "@web/core/utils/patch";
import {router} from "@web/core/browser/router";
import {url} from "@web/core/utils/urls";

patch(Message.prototype, {
    setup() {
        super.setup(...arguments);
        this.gateway_type = fields.Attr(false);
        this.gateway_channel_data = fields.Attr(false);
        this.gateway_thread_data = fields.Attr(false);
    },
    get resUrl() {
        if (!this.gateway_thread_data?.model) {
            return super.resUrl;
        }
        return url(
            router.stateToUrl({
                model: this.gateway_thread_data.model,
                resId: this.gateway_thread_data.id,
            })
        );
    },
    get editable() {
        return super.editable && !this.gateway_type;
    },
});
