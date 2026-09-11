import {Record, fields} from "@mail/core/common/record";

export class ResPartnerGatewayChannel extends Record {
    static _name = "res.partner.gateway.channel";
    static id = "id";
    /** @type {Number} */
    id;
    /** @type {String} */
    name;
    gateway_id = fields.One("mail.gateway");
}
ResPartnerGatewayChannel.register();
