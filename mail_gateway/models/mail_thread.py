# Copyright 2024 Dixmit
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import models

from odoo.addons.mail.tools.discuss import Store


class MailThread(models.AbstractModel):
    _inherit = "mail.thread"

    def _get_message_create_valid_field_names(self):
        # Add gateway fields
        field_names = super()._get_message_create_valid_field_names()
        field_names.update(
            {"gateway_type", "gateway_notifications", "gateway_message_id"}
        )
        return field_names

    def _get_notify_valid_parameters(self):
        notify_valid_parameters = super()._get_notify_valid_parameters()
        return notify_valid_parameters | {"gateway_notifications"}

    def _notify_thread_by_email(self, message, recipients_data, **kwargs):
        partners_data = [r for r in recipients_data if r["notif"] == "gateway"]
        if partners_data:
            self._notify_thread_by_gateway(message, partners_data, **kwargs)
        return super()._notify_thread_by_email(message, recipients_data, **kwargs)

    def _notify_thread_by_gateway(self, message, partners_data, **kwargs):
        for partner_data in partners_data:
            if partner_data["notif"] != "gateway" or not partner_data.get(
                "gateway_channel_id"
            ):
                continue
            message._send_to_gateway_thread(
                self.env["res.partner.gateway.channel"].browse(
                    partner_data.get("gateway_channel_id")
                )
            )

    def _notify_get_recipients(self, message, msg_vals=False, **kwargs):
        if self.env.context.get("link_gateway_message"):
            # When we have the context link_gateway_message we want to avoid
            # notify the followers thread.
            return []
        if kwargs.get("gateway_notifications"):
            result = []
            for notification in kwargs["gateway_notifications"]:
                if not notification.get("channel_type"):
                    continue
                partner = self.env["res.partner"].browse(notification["partner_id"])
                user = partner.user_ids
                follower_data = {
                    "active": partner.active,
                    "email_normalized": partner.email_normalized,
                    "id": partner.id,
                    "is_follower": True,
                    "lang": partner.lang,
                    "groups": set(user.all_group_ids.ids),
                    "name": partner.name,
                    "notif": notification.get("channel_type"),
                    "share": partner.partner_share,
                    "uid": user[:1].id,
                    "ushare": user and any(user.mapped("share")),
                    "gateway_channel_id": notification.get("gateway_channel_id"),
                }
                if follower_data["ushare"]:  # any type of share user
                    follower_data["type"] = "portal"
                elif follower_data[
                    "share"
                ]:  # no user, is share -> customer (partner only)
                    follower_data["type"] = "customer"
                else:  # has a user not share -> internal user
                    follower_data["type"] = "user"
                result.append(follower_data)
            return result
        return super()._notify_get_recipients(message, msg_vals, **kwargs)

    def _thread_to_store(self, store: Store, fields, *, request_list=None):
        res = super()._thread_to_store(store, fields, request_list=request_list)
        # Core ends with ``store.add(thread, res, as_thread=True)`` which calls
        # this method again with ``request_list=None``: only act on the real
        # client request asking for followers.
        if "followers" not in (request_list or []):
            return res
        for record in self:
            followers = (
                self.env["mail.followers"]
                .sudo()
                .search([("res_model", "=", record._name), ("res_id", "=", record.id)])
            )
            partners = followers.partner_id.filtered("gateway_channel_ids")
            store.add(
                record,
                {
                    "gateway_followers": Store.Many(
                        partners,
                        ["name", *partners._get_store_gateway_channel_fields()],
                    )
                },
                as_thread=True,
            )
        return res

    def _check_can_update_message_content(self, messages):
        # We can delete the messages comming from a gateway on not channels
        if self._name != "discuss.channel":
            new_messages = messages.filtered(lambda r: not r.gateway_message_ids)
        else:
            new_messages = messages
        return super()._check_can_update_message_content(new_messages)

    def _message_update_content(self, message, /, *, body, **kwargs):
        result = super()._message_update_content(message, body=body, **kwargs)
        if body == "":
            # Unlink the message
            for gateway_msg in message.gateway_message_ids:
                gateway_msg.gateway_message_id = False
                Store(bus_channel=gateway_msg._bus_channel()).add(
                    gateway_msg, ["gateway_thread_data"]
                ).bus_send()
        return result

    def _get_allowed_message_params(self):
        return super()._get_allowed_message_params() | {"gateway_notifications"}
