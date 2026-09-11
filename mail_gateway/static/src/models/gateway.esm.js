import {Record} from "@mail/core/common/record";

export class MailGateway extends Record {
    static _name = "mail.gateway";
    static id = "id";
    /** @type {Number} */
    id;
    /** @type {String} */
    name;
    /** @type {String} */
    gateway_type;
}
MailGateway.register();
